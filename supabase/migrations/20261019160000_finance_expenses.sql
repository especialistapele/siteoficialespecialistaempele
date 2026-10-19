-- Despesas administrativas do financeiro: sem alterar os lançamentos atuais.
create table if not exists public.finance_partner_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 120),
  location text,
  calculation_type text not null check (calculation_type in ('percentual','hora')),
  percentage numeric(5,2) check (percentage is null or (percentage >= 0 and percentage <= 100)),
  hourly_rate numeric(12,2) check (hourly_rate is null or hourly_rate >= 0),
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.finance_partner_rules enable row level security;
drop policy if exists finance_partner_rules_admin_manage on public.finance_partner_rules;
create policy finance_partner_rules_admin_manage
  on public.finance_partner_rules for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
grant select, insert, update, delete on public.finance_partner_rules to authenticated;

create table if not exists public.finance_expenses (
  id uuid primary key default gen_random_uuid(),
  description text not null check (char_length(trim(description)) between 2 and 180),
  category text not null default 'outros',
  location text,
  expense_date date not null default current_date,
  amount numeric(12,2) not null check (amount >= 0),
  status text not null default 'pago' check (status in ('pago','pendente')),
  calculation_type text not null default 'manual' check (calculation_type in ('manual','percentual','hora')),
  percentage numeric(5,2) check (percentage is null or (percentage >= 0 and percentage <= 100)),
  hours numeric(8,2) check (hours is null or hours >= 0),
  hourly_rate numeric(12,2) check (hourly_rate is null or hourly_rate >= 0),
  appointment_id uuid references public.appointments(id) on delete set null,
  partner_rule_id uuid references public.finance_partner_rules(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists finance_partner_rules_active_idx on public.finance_partner_rules (active, name);
create index if not exists finance_expenses_date_idx on public.finance_expenses (expense_date desc);
create index if not exists finance_expenses_appointment_idx on public.finance_expenses (appointment_id);
alter table public.finance_expenses enable row level security;

drop policy if exists finance_expenses_admin_manage on public.finance_expenses;
create policy finance_expenses_admin_manage
  on public.finance_expenses for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select, insert, update, delete on public.finance_expenses to authenticated;

create or replace function public.finance_partner_rules_set_updated_at()
returns trigger language plpgsql set search_path = public as $
begin
  new.updated_at = now();
  return new;
end;
$;

drop trigger if exists finance_partner_rules_updated_at on public.finance_partner_rules;
create trigger finance_partner_rules_updated_at
before update on public.finance_partner_rules
for each row execute function public.finance_partner_rules_set_updated_at();

create or replace function public.finance_expenses_set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists finance_expenses_updated_at on public.finance_expenses;
create trigger finance_expenses_updated_at
before update on public.finance_expenses
for each row execute function public.finance_expenses_set_updated_at();
