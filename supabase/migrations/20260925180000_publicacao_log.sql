-- Histórico durável das solicitações feitas pelo painel.
begin;

create table if not exists public.publication_requests (
  request_id      uuid primary key default gen_random_uuid(),
  requested_by    uuid references auth.users(id) on delete set null,
  path            text,
  content_id      text,
  publicado       boolean,
  status          text not null default 'requested'
                  check (status in ('requested','dispatched','confirmed','timeout','error')),
  error_message   text,
  requested_at    timestamptz not null default now(),
  dispatched_at   timestamptz,
  confirmed_at    timestamptz,
  updated_at      timestamptz not null default now()
);

create index if not exists publication_requests_requested_at_idx
  on public.publication_requests (requested_at desc);
create index if not exists publication_requests_path_idx
  on public.publication_requests (path);

alter table public.publication_requests enable row level security;

drop policy if exists admin_read_publication_requests on public.publication_requests;
create policy admin_read_publication_requests
  on public.publication_requests
  for select using (public.is_admin());

drop policy if exists admin_insert_publication_requests on public.publication_requests;
create policy admin_insert_publication_requests
  on public.publication_requests
  for insert with check (public.is_admin());

drop policy if exists admin_update_publication_requests on public.publication_requests;
create policy admin_update_publication_requests
  on public.publication_requests
  for update using (public.is_admin()) with check (public.is_admin());

commit;
