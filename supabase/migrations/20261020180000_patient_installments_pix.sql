-- Parcelamento de atendimentos com vencimento manual por parcela e recebimento via Pix.
alter table public.appointments
  add column if not exists payment_plan_enabled boolean not null default false;

create table if not exists public.appointment_installments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  installment_number integer not null check (installment_number > 0),
  installment_count integer not null check (installment_count > 0),
  amount numeric(12,2) not null check (amount > 0),
  due_date date not null,
  status text not null default 'pendente' check (status in ('pendente','pago')),
  paid_at date,
  payment_method text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointment_installments_number_unique unique (appointment_id, installment_number),
  constraint appointment_installments_number_count check (installment_number <= installment_count)
);

create index if not exists appointment_installments_patient_due_idx
  on public.appointment_installments (patient_id, due_date);
create index if not exists appointment_installments_appointment_idx
  on public.appointment_installments (appointment_id, installment_number);
create index if not exists appointment_installments_status_due_idx
  on public.appointment_installments (status, due_date);

alter table public.appointment_installments enable row level security;
drop policy if exists appointment_installments_admin_manage on public.appointment_installments;
create policy appointment_installments_admin_manage
  on public.appointment_installments for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
grant select, insert, update, delete on public.appointment_installments to authenticated;

create or replace function public.appointment_installments_set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists appointment_installments_updated_at on public.appointment_installments;
create trigger appointment_installments_updated_at
before update on public.appointment_installments
for each row execute function public.appointment_installments_set_updated_at();
