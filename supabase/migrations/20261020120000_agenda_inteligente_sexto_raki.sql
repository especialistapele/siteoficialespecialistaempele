-- Agenda inteligente: evolução incremental, preservando agendamentos legados.
-- Revisar e aplicar somente via fluxo de migrações do projeto; não foi aplicada ao banco.
alter table public.appointments
  add column if not exists appointment_end_time time without time zone;

create table if not exists public.appointment_recurring_blocks (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'SEXTO RAKI',
  start_date date not null default date '2026-10-19',
  interval_days integer not null default 6 check (interval_days > 0),
  end_date date null,
  color text not null default '#000000',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointment_recurring_blocks_end_after_start
    check (end_date is null or end_date >= start_date)
);

alter table public.appointment_recurring_blocks enable row level security;
grant select, insert, update on public.appointment_recurring_blocks to authenticated;
drop policy if exists appointment_recurring_blocks_admin_all on public.appointment_recurring_blocks;
create policy appointment_recurring_blocks_admin_all
  on public.appointment_recurring_blocks
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Configuração inicial idempotente. Conflitos existentes são apenas sinalizados,
-- nunca cancelados, movidos ou apagados.
insert into public.appointment_recurring_blocks
  (name, start_date, interval_days, end_date, color, active)
select 'SEXTO RAKI', date '2026-10-19', 6, null, '#000000', true
where not exists (
  select 1 from public.appointment_recurring_blocks
  where name = 'SEXTO RAKI' and start_date = date '2026-10-19'
);

create or replace function public.appointment_date_is_blocked(p_date date)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.appointment_recurring_blocks b
    where b.active
      and p_date >= b.start_date
      and (b.end_date is null or p_date <= b.end_date)
      and mod(p_date - b.start_date, b.interval_days) = 0
  );
$$;

create or replace function public.validate_appointment_schedule()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  schedule_changed boolean := tg_op = 'INSERT';
begin
  if tg_op = 'UPDATE' then
    schedule_changed :=
      new.appointment_date is distinct from old.appointment_date
      or new.appointment_time is distinct from old.appointment_time
      or new.appointment_end_time is distinct from old.appointment_end_time;
  end if;

  -- Mudanças de status/dados financeiros em registros legados não devem
  -- exigir horário final retroativo.
  if not schedule_changed then
    return new;
  end if;

  if new.appointment_end_time is null then
    raise exception using errcode = '22023',
      message = 'Informe o horário de término do novo agendamento.';
  end if;

  if new.appointment_end_time <= new.appointment_time then
    raise exception using errcode = '22023',
      message = 'O término deve ser posterior ao início.';
  end if;

  if new.appointment_time < time '08:00'
     or new.appointment_end_time > time '19:00'
     or new.appointment_time >= time '19:00' then
    raise exception using errcode = '22023',
      message = 'A agenda funciona das 08:00 às 19:00.';
  end if;

  -- Serializa gravações para a mesma data e evita corrida entre reservas.
  perform pg_advisory_xact_lock(hashtext(new.appointment_date::text));

  if public.appointment_date_is_blocked(new.appointment_date) then
    raise exception using errcode = '23P01',
      message = 'Data bloqueada pela recorrência da agenda (SEXTO RAKI).';
  end if;

  if exists (
    select 1
    from public.appointments a
    where a.appointment_date = new.appointment_date
      and a.status <> 'cancelado'
      and a.appointment_end_time is not null
      and (tg_op = 'INSERT' or a.id <> new.id)
      and new.appointment_time < a.appointment_end_time
      and new.appointment_end_time > a.appointment_time
  ) then
    raise exception using errcode = '23P01',
      message = 'Este horário se sobrepõe a outro atendimento ativo.';
  end if;

  return new;
end;
$$;

drop trigger if exists appointments_validate_schedule on public.appointments;
create trigger appointments_validate_schedule
before insert or update of appointment_date, appointment_time, appointment_end_time
on public.appointments
for each row execute function public.validate_appointment_schedule();

-- Operação atômica: paciente existente selecionado explicitamente OU criação
-- automática. Não cria login, e-mail, nem credenciais. Telefone é comparado
-- por dígitos; múltiplos resultados exigem seleção manual no cliente.
create or replace function public.admin_create_appointment(
  p_appointment_date date,
  p_appointment_time time,
  p_appointment_end_time time,
  p_patient_name text,
  p_patient_phone text,
  p_patient_id uuid default null,
  p_tipo text default null,
  p_description text default null,
  p_valor numeric default 0,
  p_taxa_agendamento numeric default 0
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_patient_id uuid;
  v_matches integer;
  v_appointment_id uuid;
  v_phone_digits text;
begin
  if not public.is_admin() then
    raise exception using errcode = '42501', message = 'Apenas administradores podem criar agendamentos.';
  end if;
  if p_appointment_date is null or p_appointment_time is null
     or p_appointment_end_time is null
     or nullif(trim(p_patient_name), '') is null
     or nullif(trim(p_patient_phone), '') is null then
    raise exception using errcode = '22023',
      message = 'Preencha data, início, término, nome e telefone do paciente.';
  end if;

  if p_patient_id is not null then
    select id into v_patient_id from public.patients where id = p_patient_id;
    if v_patient_id is null then
      raise exception using errcode = '22023', message = 'Paciente selecionado não encontrado.';
    end if;
  else
    v_phone_digits := regexp_replace(p_patient_phone, '[^0-9]', '', 'g');
    select count(*) into v_matches
    from public.patients p
    where regexp_replace(coalesce(p.phone, ''), '[^0-9]', '', 'g') = v_phone_digits
      and v_phone_digits <> '';

    if v_matches > 1 then
      raise exception using errcode = '22023',
        message = 'Há mais de um paciente com este telefone. Selecione o cadastro correto.';
    elsif v_matches = 1 then
      select p.id into v_patient_id
      from public.patients p
      where regexp_replace(coalesce(p.phone, ''), '[^0-9]', '', 'g') = v_phone_digits
        and v_phone_digits <> ''
      limit 1;
    else
      insert into public.patients (full_name, phone, status, acesso_painel)
      values (trim(p_patient_name), trim(p_patient_phone), 'ativo', false)
      returning id into v_patient_id;
    end if;
  end if;

  insert into public.appointments (
    patient_id, appointment_date, appointment_time, appointment_end_time,
    tipo, description, valor, taxa_agendamento, status
  ) values (
    v_patient_id, p_appointment_date, p_appointment_time, p_appointment_end_time,
    nullif(trim(coalesce(p_tipo, '')), ''),
    nullif(trim(coalesce(p_description, '')), ''),
    greatest(coalesce(p_valor, 0), 0),
    greatest(coalesce(p_taxa_agendamento, 0), 0),
    'agendado'
  ) returning id into v_appointment_id;

  return v_appointment_id;
end;
$$;

revoke all on function public.admin_create_appointment(date,time,time,text,text,uuid,text,text,numeric,numeric) from public, anon;
grant execute on function public.admin_create_appointment(date,time,time,text,text,uuid,text,text,numeric,numeric) to authenticated;
