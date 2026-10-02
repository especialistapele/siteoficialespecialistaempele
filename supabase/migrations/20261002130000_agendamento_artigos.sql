-- Agendamento de publicação de artigos do blog.
alter table public.articles
  add column if not exists scheduled_at timestamptz;

create index if not exists idx_articles_scheduled_at
  on public.articles (scheduled_at)
  where scheduled_at is not null and published = false;

create or replace function public.publicar_artigos_agendados()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  update public.articles
     set published = true,
         updated_at = now()
   where published = false
     and scheduled_at is not null
     and scheduled_at <= now();

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.publicar_artigos_agendados() from public;
grant execute on function public.publicar_artigos_agendados() to service_role;

-- O job é criado na infraestrutura do projeto e executa a cada 5 minutos.
-- A criação é idempotente para ambientes em que a extensão pg_cron já esteja ativa.
create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'publicar-artigos-agendados',
  '*/5 * * * *',
  $$ select public.publicar_artigos_agendados(); $$
)
where not exists (
  select 1 from cron.job where jobname = 'publicar-artigos-agendados'
);
