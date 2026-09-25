-- FAQ estruturado dos artigos do blog.
alter table public.articles
  add column if not exists faq jsonb not null default '[]'::jsonb;

alter table public.articles
  drop constraint if exists articles_faq_array_check;

alter table public.articles
  add constraint articles_faq_array_check
  check (jsonb_typeof(faq) = 'array');
