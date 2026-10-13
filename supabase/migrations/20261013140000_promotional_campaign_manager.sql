-- Promotional campaign manager and reusable creative library.
create table if not exists public.promotional_assets (
 id uuid primary key default gen_random_uuid(), title text not null, alt_text text not null default '',
 storage_path text not null unique, mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp','image/gif')),
 file_size bigint not null check (file_size > 0 and file_size <= 10485760),
 created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.promotional_campaigns (
 id uuid primary key default gen_random_uuid(), name text not null, headline text not null default '', body text not null default '',
 cta_label text not null default 'Saiba mais', cta_url text not null default '/pre-atendimento/',
 discount_type text not null default 'none' check (discount_type in ('none','percent','fixed')),
 discount_value numeric(10,2) check (discount_value is null or discount_value >= 0),
 starts_at timestamptz, ends_at timestamptz, active boolean not null default false,
 position text not null default 'bottom-right' check (position in ('center','top-left','top-right','bottom-left','bottom-right')),
 frequency_days integer not null default 7 check (frequency_days between 0 and 365),
 max_spots integer check (max_spots is null or max_spots > 0), editor_config jsonb not null default '{}'::jsonb,
 created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 constraint promotional_campaign_dates check (ends_at is null or starts_at is null or ends_at > starts_at),
 constraint promotional_campaign_discount check ((discount_type='none' and discount_value is null) or (discount_type='percent' and discount_value>0 and discount_value<=100) or (discount_type='fixed' and discount_value>0))
);
create table if not exists public.promotional_campaign_assets (
 campaign_id uuid not null references public.promotional_campaigns(id) on delete cascade,
 asset_id uuid not null references public.promotional_assets(id) on delete restrict, sort_order integer not null default 0, primary key(campaign_id,asset_id)
);
create table if not exists public.promotional_campaign_pages (
 campaign_id uuid not null references public.promotional_campaigns(id) on delete cascade,
 page_path text not null check (page_path like '/%' and page_path !~ '^//'), primary key(campaign_id,page_path)
);
create index if not exists promotional_campaigns_public_active_idx on public.promotional_campaigns(active,starts_at,ends_at);
create or replace function public.promotional_campaign_touch_updated_at() returns trigger language plpgsql set search_path=public as $$ begin new.updated_at=now(); return new; end; $$;
drop trigger if exists promotional_assets_touch_updated_at on public.promotional_assets;
create trigger promotional_assets_touch_updated_at before update on public.promotional_assets for each row execute function public.promotional_campaign_touch_updated_at();
drop trigger if exists promotional_campaigns_touch_updated_at on public.promotional_campaigns;
create trigger promotional_campaigns_touch_updated_at before update on public.promotional_campaigns for each row execute function public.promotional_campaign_touch_updated_at();
alter table public.promotional_assets enable row level security;
alter table public.promotional_campaigns enable row level security;
alter table public.promotional_campaign_assets enable row level security;
alter table public.promotional_campaign_pages enable row level security;
create policy promotional_assets_admin_all on public.promotional_assets for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy promotional_campaigns_admin_all on public.promotional_campaigns for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy promotional_campaigns_public_read_active on public.promotional_campaigns for select to anon,authenticated using(active and (starts_at is null or starts_at<=now()) and (ends_at is null or ends_at>now()));
create policy promotional_campaign_assets_admin_all on public.promotional_campaign_assets for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy promotional_campaign_assets_public_read on public.promotional_campaign_assets for select to anon,authenticated using(exists(select 1 from public.promotional_campaigns c where c.id=campaign_id and c.active and (c.starts_at is null or c.starts_at<=now()) and (c.ends_at is null or c.ends_at>now())));
create policy promotional_campaign_pages_admin_all on public.promotional_campaign_pages for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy promotional_campaign_pages_public_read on public.promotional_campaign_pages for select to anon,authenticated using(exists(select 1 from public.promotional_campaigns c where c.id=campaign_id and c.active and (c.starts_at is null or c.starts_at<=now()) and (c.ends_at is null or c.ends_at>now())));
grant select on public.promotional_campaigns,public.promotional_campaign_assets,public.promotional_campaign_pages to anon,authenticated;
grant select,insert,update,delete on public.promotional_assets,public.promotional_campaigns,public.promotional_campaign_assets,public.promotional_campaign_pages to authenticated;
