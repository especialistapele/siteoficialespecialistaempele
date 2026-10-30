-- Identificação visual da unidade de atendimento por data na agenda.
-- Mantém os agendamentos independentes e não altera registros existentes.
create table if not exists public.appointment_unit_days (
  appointment_date date primary key,
  service_unit text not null
    check (service_unit in ('Araruama', 'Cabo Frio', 'Copacabana')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.appointment_unit_days enable row level security;

grant select, insert, update, delete
  on table public.appointment_unit_days
  to authenticated;

drop policy if exists appointment_unit_days_admin_all
  on public.appointment_unit_days;

create policy appointment_unit_days_admin_all
  on public.appointment_unit_days
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
