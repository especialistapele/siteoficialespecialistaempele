-- Eventos administrativos e bloqueios pontuais para a Agenda.
-- Incremental: não altera nem remove atendimentos ou pagamentos existentes.
create table if not exists public.appointment_date_blocks (
 id uuid primary key default gen_random_uuid(),
 name text not null check (length(trim(name)) > 0),
 block_date date not null,
 start_time time without time zone null,
 end_time time without time zone null,
 color text not null default '#b91c1c',
 active boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint appointment_date_blocks_time_pair check (
  (start_time is null and end_time is null) or
  (start_time is not null and end_time is not null and end_time > start_time)
 ),
 constraint appointment_date_blocks_work_hours check (
  start_time is null or (start_time >= time '08:00' and end_time <= time '19:00')
 )
);
create index if not exists appointment_date_blocks_date_active_idx on public.appointment_date_blocks (block_date, active);
alter table public.appointment_date_blocks enable row level security;
grant select, insert, update, delete on public.appointment_date_blocks to authenticated;
drop policy if exists appointment_date_blocks_admin_all on public.appointment_date_blocks;
create policy appointment_date_blocks_admin_all on public.appointment_date_blocks for all to authenticated using (public.is_admin()) with check (public.is_admin());

create table if not exists public.calendar_events (
 id uuid primary key default gen_random_uuid(),
 title text not null check (length(trim(title)) > 0),
 event_date date not null,
 start_time time without time zone null,
 end_time time without time zone null,
 description text null,
 color text not null default '#2563eb',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint calendar_events_time_pair check (
  (start_time is null and end_time is null) or
  (start_time is not null and end_time is not null and end_time > start_time)
 ),
 constraint calendar_events_work_hours check (
  start_time is null or (start_time >= time '08:00' and end_time <= time '19:00')
 )
);
create index if not exists calendar_events_date_idx on public.calendar_events (event_date, start_time);
alter table public.calendar_events enable row level security;
grant select, insert, update, delete on public.calendar_events to authenticated;
drop policy if exists calendar_events_admin_all on public.calendar_events;
create policy calendar_events_admin_all on public.calendar_events for all to authenticated using (public.is_admin()) with check (public.is_admin());

create or replace function public.validate_appointment_schedule()
returns trigger language plpgsql security invoker set search_path = public as $$
declare schedule_changed boolean := tg_op = 'INSERT';
begin
 if tg_op = 'UPDATE' then
  schedule_changed := new.appointment_date is distinct from old.appointment_date
   or new.appointment_time is distinct from old.appointment_time
   or new.appointment_end_time is distinct from old.appointment_end_time;
 end if;
 if not schedule_changed then return new; end if;
 if new.appointment_end_time is null then
  raise exception using errcode = '22023', message = 'Informe o horário de término do novo agendamento.';
 end if;
 if new.appointment_end_time <= new.appointment_time then
  raise exception using errcode = '22023', message = 'O término deve ser posterior ao início.';
 end if;
 if new.appointment_time < time '08:00' or new.appointment_end_time > time '19:00' or new.appointment_time >= time '19:00' then
  raise exception using errcode = '22023', message = 'A agenda funciona das 08:00 às 19:00.';
 end if;
 perform pg_advisory_xact_lock(hashtext(new.appointment_date::text));
 if public.appointment_date_is_blocked(new.appointment_date) then
  raise exception using errcode = '23P01', message = 'Data bloqueada pela recorrência da agenda.';
 end if;
 if exists (
  select 1 from public.appointment_date_blocks b
  where b.active and b.block_date = new.appointment_date
   and ((b.start_time is null and b.end_time is null)
    or (new.appointment_time < b.end_time and new.appointment_end_time > b.start_time))
 ) then
  raise exception using errcode = '23P01', message = 'Este dia ou horário está bloqueado na agenda.';
 end if;
 if exists (
  select 1 from public.appointments a
  where a.appointment_date = new.appointment_date and a.status <> 'cancelado'
   and (tg_op = 'INSERT' or a.id <> new.id)
   and ((a.appointment_end_time is null and a.appointment_time = new.appointment_time)
    or (a.appointment_end_time is not null and new.appointment_time < a.appointment_end_time and new.appointment_end_time > a.appointment_time))
 ) then
  raise exception using errcode = '23P01', message = 'Este horário se sobrepõe a outro atendimento ativo.';
 end if;
 return new;
end;
$$;
