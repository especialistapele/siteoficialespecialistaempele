-- SkinMap: armazenamento isolado de solicitações, com leitura e gestão restritas a administradores.
create table if not exists public.skinmap_leads (
 id uuid primary key default gen_random_uuid(),
 full_name text not null check (char_length(trim(full_name)) between 2 and 120),
 whatsapp text not null check (char_length(trim(whatsapp)) between 8 and 40),
 email text not null check (char_length(trim(email)) between 5 and 254),
 city text, interest text, indication text, other_indication text, skin_type text,
 assessment jsonb not null default '{}'::jsonb,
 skin_profile jsonb not null default '{}'::jsonb,
 questionnaire jsonb not null default '{}'::jsonb,
 consent boolean not null default false check (consent = true),
 consent_text_version text not null default 'skinmap-consent-v1',
 consented_at timestamptz not null default now(),
 status text not null default 'novo' check (status in ('novo','contato','convertido','arquivado')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.skinmap_leads enable row level security;
revoke all on public.skinmap_leads from anon, authenticated;
grant insert (full_name, whatsapp, email, city, interest, indication, other_indication, skin_type, assessment, skin_profile, questionnaire, consent, consent_text_version) on public.skinmap_leads to anon, authenticated;
grant select, update, delete on public.skinmap_leads to authenticated;
drop policy if exists skinmap_leads_public_submit on public.skinmap_leads;
create policy skinmap_leads_public_submit on public.skinmap_leads for insert to anon, authenticated with check (
 consent = true and char_length(trim(full_name)) between 2 and 120 and char_length(trim(whatsapp)) between 8 and 40
 and char_length(trim(email)) between 5 and 254 and email ~* '^[^[:space:]@]+@[^[:space:]@]+\\.[^[:space:]@]+$'
);
drop policy if exists skinmap_leads_admin_read on public.skinmap_leads;
create policy skinmap_leads_admin_read on public.skinmap_leads for select to authenticated using (is_admin());
drop policy if exists skinmap_leads_admin_update on public.skinmap_leads;
create policy skinmap_leads_admin_update on public.skinmap_leads for update to authenticated using (is_admin()) with check (is_admin());
drop policy if exists skinmap_leads_admin_delete on public.skinmap_leads;
create policy skinmap_leads_admin_delete on public.skinmap_leads for delete to authenticated using (is_admin());
create index if not exists skinmap_leads_created_at_idx on public.skinmap_leads (created_at desc);
create index if not exists skinmap_leads_status_idx on public.skinmap_leads (status);
