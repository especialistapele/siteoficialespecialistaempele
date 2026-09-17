alter table public.patients add column if not exists acesso_painel boolean not null default true;
create index if not exists idx_patients_acesso_painel on public.patients(acesso_painel);
