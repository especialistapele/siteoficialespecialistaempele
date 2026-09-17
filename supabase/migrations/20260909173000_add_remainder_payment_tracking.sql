-- Fase 8: acompanhamento do pagamento do restante do atendimento
alter table public.appointments add column if not exists restante_pago numeric(12,2) not null default 0 check (restante_pago >= 0);
alter table public.appointments add column if not exists restante_status text not null default 'pendente' check (restante_status in ('pendente','parcial','pago'));
alter table public.appointments add column if not exists restante_data_pagamento date;
alter table public.appointments add column if not exists restante_forma_pagamento text;
create index if not exists idx_appointments_restante_status on public.appointments(restante_status);
