alter table public.appointments
  add column if not exists taxa_agendamento numeric(12,2) not null default 0 check (taxa_agendamento >= 0),
  add column if not exists taxa_status text not null default 'pendente' check (taxa_status in ('pendente','pago')),
  add column if not exists taxa_forma_pagamento text;

update public.appointments
set taxa_agendamento = 0,
    taxa_status = 'pendente'
where taxa_agendamento is null or taxa_status is null;

create index if not exists idx_appointments_taxa_status on public.appointments(taxa_status);
