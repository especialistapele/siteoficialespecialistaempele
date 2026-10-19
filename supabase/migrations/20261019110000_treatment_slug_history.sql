-- Histórico de slugs de tratamentos para manter URLs antigas acessíveis.
-- Não altera o slug atual nem os caminhos publicados existentes.
alter table public.treatments
  add column if not exists previous_slugs text[] not null default '{}';
