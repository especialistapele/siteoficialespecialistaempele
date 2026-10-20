-- Completa o fluxo de agenda: reativa o cadastro de paciente quando um novo atendimento é confirmado.
-- Não altera atendimentos, pagamentos ou históricos existentes; a atualização só ocorre no cadastro
-- vinculado a um NOVO agendamento administrativo bem-sucedido.
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
as $fn$
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
    select id into v_patient_id
    from public.patients
    where id = p_patient_id;
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

  -- Ao marcar um novo atendimento, reativa apenas o cadastro escolhido/encontrado.
  -- Não altera acesso ao painel, dados pessoais nem registros históricos.
  update public.patients
  set status = 'ativo', updated_at = now()
  where id = v_patient_id
    and status is distinct from 'ativo';

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
$fn$;

revoke all on function public.admin_create_appointment(date,time,time,text,text,uuid,text,text,numeric,numeric) from public, anon;
grant execute on function public.admin_create_appointment(date,time,time,text,text,uuid,text,text,numeric,numeric) to authenticated;
