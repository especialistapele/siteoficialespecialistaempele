-- ============================================================================
-- Páginas estáticas individuais para Blog e Resultados
--
-- O que esta migração faz (tudo ADITIVO: nenhuma coluna, linha ou imagem
-- existente é removida ou alterada de valor):
--
--  1. IDs estáveis  -> BLOG-000001 / RESULTADO-000001, gerados por SEQUENCE
--     (uma sequence nunca devolve um número já usado, mesmo depois de DELETE).
--  2. Slugs         -> gerados automaticamente a partir do título, únicos por
--     tipo, com sufixo -2, -3… em caso de conflito. Slugs antigos ficam
--     reservados (para o redirecionamento não ser sobrescrito por outro conteúdo).
--  3. Registro      -> tabela content_ids guarda o histórico de cada ID
--     (slug atual, slugs anteriores, status, remoção). Nunca é apagada.
--  4. Resultados    -> ganham título, slug, texto do caso, published_at,
--     updated_at e a tabela result_images (fotos extras além de antes/depois).
--  5. published_at  -> passa a ser a data da PRIMEIRA publicação (antes o painel
--     a sobrescrevia a cada edição, o que bagunçaria datePublished no Schema).
--
-- O painel antigo continua funcionando: tudo o que é novo é preenchido por
-- triggers quando o painel não envia.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 0. Função de slug (mesma regra dos scripts Node: minúsculas, sem acentos,
--    só a-z 0-9 e hífen, sem hífens duplicados/nas pontas, curta).
-- ---------------------------------------------------------------------------
create or replace function public.slugify_conteudo(txt text, max_len int default 70)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  s text;
begin
  s := translate(
         coalesce(txt, ''),
         'ÁÀÂÃÄÅÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑÝáàâãäåéèêëíìîïóòôõöúùûüçñýÿ',
         'AAAAAAEEEEIIIIOOOOOUUUUCNYaaaaaaeeeeiiiiooooouuuucnyy'
       );
  s := lower(s);
  s := regexp_replace(s, '[^a-z0-9]+', '-', 'g');
  s := regexp_replace(s, '^-+|-+$', '', 'g');
  if length(s) > max_len then
    -- corta em fronteira de palavra sempre que possível
    if substr(s, max_len + 1, 1) <> '-' and position('-' in left(s, max_len)) > 0 then
      s := regexp_replace(left(s, max_len), '-[^-]*$', '');
    else
      s := left(s, max_len);
    end if;
    s := regexp_replace(s, '-+$', '');
  end if;
  return s;
end;
$$;

-- ---------------------------------------------------------------------------
-- 1. Sequences dos IDs públicos (nunca reutilizam número)
-- ---------------------------------------------------------------------------
create sequence if not exists public.seq_id_blog start 1;
create sequence if not exists public.seq_id_resultado start 1;

-- ---------------------------------------------------------------------------
-- 2. Novas colunas
-- ---------------------------------------------------------------------------
alter table public.articles add column if not exists public_id text;

alter table public.results add column if not exists public_id    text;
alter table public.results add column if not exists title        text;
alter table public.results add column if not exists slug         text;
alter table public.results add column if not exists content      text;
alter table public.results add column if not exists published_at timestamptz;
alter table public.results add column if not exists updated_at   timestamptz not null default now();

-- ---------------------------------------------------------------------------
-- 3. Registro permanente de IDs (histórico; nunca apagar linhas daqui)
-- ---------------------------------------------------------------------------
create table if not exists public.content_ids (
  public_id        text primary key,
  tipo             text not null check (tipo in ('blog', 'resultado')),
  conteudo_id      uuid,                       -- nulo depois que o conteúdo é excluído
  slug_atual       text,
  slugs_anteriores text[] not null default '{}',
  status           text not null default 'rascunho'
                   check (status in ('rascunho', 'publicado', 'despublicado', 'removido')),
  ja_publicado     boolean not null default false,
  criado_em        timestamptz not null default now(),
  atualizado_em    timestamptz not null default now(),
  removido_em      timestamptz
);
alter table public.content_ids enable row level security;
drop policy if exists admin_read_content_ids on public.content_ids;
create policy admin_read_content_ids on public.content_ids
  for select using (public.is_admin());
-- (sem policy de INSERT/UPDATE/DELETE: só os triggers, que são SECURITY DEFINER, escrevem aqui)

-- ---------------------------------------------------------------------------
-- 4. Fotos extras dos resultados (além do antes/depois que já existe)
-- ---------------------------------------------------------------------------
create table if not exists public.result_images (
  id         uuid primary key default gen_random_uuid(),
  result_id  uuid not null references public.results(id) on delete cascade,
  url        text not null,
  alt        text,
  caption    text,
  position   int  not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists result_images_result_idx on public.result_images (result_id, position);
alter table public.result_images enable row level security;
drop policy if exists admin_full_access_result_images on public.result_images;
create policy admin_full_access_result_images on public.result_images
  for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists public_reads_published_result_images on public.result_images;
create policy public_reads_published_result_images on public.result_images
  for select using (
    exists (
      select 1 from public.results r
      where r.id = result_images.result_id and r.published = true and r.consent_confirmed = true
    )
  );

-- ---------------------------------------------------------------------------
-- 5. BACKFILL dos conteúdos que já existem (ordem de criação)
--    Feito ANTES de criar os triggers, para não passar pela lógica de insert.
-- ---------------------------------------------------------------------------
update public.articles a
   set public_id = 'BLOG-' || lpad(nextval('public.seq_id_blog')::text, 6, '0')
  from (select id from public.articles where public_id is null order by created_at, id) o
 where a.id = o.id and a.public_id is null;

with ordenados as (
  select r.id,
         coalesce(t.name, 'tratamento') as trat,
         row_number() over (partition by r.treatment_id order by r.created_at, r.id) as n
    from public.results r
    left join public.treatments t on t.id = r.treatment_id
   where r.title is null
)
update public.results r
   set title = 'Resultado de ' || o.trat || ' — caso ' || lpad(o.n::text, 2, '0')
  from ordenados o
 where r.id = o.id;

update public.results r
   set public_id = 'RESULTADO-' || lpad(nextval('public.seq_id_resultado')::text, 6, '0')
  from (select id from public.results where public_id is null order by created_at, id) o
 where r.id = o.id and r.public_id is null;

update public.results
   set slug = public.slugify_conteudo(title)
 where slug is null;

-- garante unicidade caso dois títulos gerem o mesmo slug
update public.results r
   set slug = r.slug || '-' || (d.rn)::text
  from (
    select id, row_number() over (partition by slug order by created_at, id) as rn
      from public.results
  ) d
 where r.id = d.id and d.rn > 1;

update public.results set published_at = created_at where published = true and published_at is null;

alter table public.articles alter column public_id set not null;
alter table public.results  alter column public_id set not null;
alter table public.results  alter column title     set not null;
alter table public.results  alter column slug      set not null;
create unique index if not exists articles_public_id_key on public.articles (public_id);
create unique index if not exists results_public_id_key  on public.results  (public_id);
create unique index if not exists results_slug_key       on public.results  (slug);

-- registro dos conteúdos já existentes
insert into public.content_ids (public_id, tipo, conteudo_id, slug_atual, status, ja_publicado, criado_em)
select public_id, 'blog', id, slug,
       case when published then 'publicado' else 'rascunho' end,
       published, created_at
  from public.articles
on conflict (public_id) do nothing;

insert into public.content_ids (public_id, tipo, conteudo_id, slug_atual, status, ja_publicado, criado_em)
select public_id, 'resultado', id, slug,
       case when published and consent_confirmed then 'publicado' else 'rascunho' end,
       (published and consent_confirmed), created_at
  from public.results
on conflict (public_id) do nothing;

-- ---------------------------------------------------------------------------
-- 6. Triggers
-- ---------------------------------------------------------------------------

-- 6a. ANTES de gravar: ID, slug único, título padrão, data da 1ª publicação
create or replace function public.conteudo_before_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tipo      text := case TG_TABLE_NAME when 'articles' then 'blog' else 'resultado' end;
  v_base      text;
  v_slug      text;
  v_i         int := 2;
  v_n         int;
  v_titulo    text;
  v_trat      text;
  v_reservado text[] := case TG_TABLE_NAME when 'articles' then array['index', 'artigos', '404']
                                           else array['index', '404'] end;
  v_ocupado   boolean;
begin
  -- ID: sempre do servidor; nunca muda em UPDATE
  if TG_OP = 'INSERT' then
    new.public_id := case v_tipo
      when 'blog' then 'BLOG-' || lpad(nextval('public.seq_id_blog')::text, 6, '0')
      else 'RESULTADO-' || lpad(nextval('public.seq_id_resultado')::text, 6, '0')
    end;
  else
    new.public_id := old.public_id;
  end if;

  -- Resultado sem título: "Resultado de <tratamento> — caso NN" (sem repetir título existente)
  if TG_TABLE_NAME = 'results' and (new.title is null or btrim(new.title) = '') then
    select name into v_trat from public.treatments where id = new.treatment_id;
    select count(*) + 1 into v_n from public.results
     where treatment_id is not distinct from new.treatment_id and id <> new.id;
    loop
      v_titulo := 'Resultado de ' || coalesce(v_trat, 'tratamento') || ' — caso ' || lpad(v_n::text, 2, '0');
      exit when not exists (select 1 from public.results where title = v_titulo and id <> new.id);
      v_n := v_n + 1;
    end loop;
    new.title := v_titulo;
  end if;

  -- Slug: mantém o atual se não mudou; senão normaliza e garante unicidade
  if TG_OP = 'UPDATE' and new.slug is not distinct from old.slug and btrim(coalesce(new.slug, '')) <> '' then
    null;
  else
    v_base := public.slugify_conteudo(coalesce(nullif(btrim(new.slug), ''), new.title));
    if v_base = '' then
      v_base := lower(v_tipo) || '-' || regexp_replace(new.public_id, '^\D+-', '');
    end if;
    v_slug := v_base;
    loop
      execute format('select exists (select 1 from public.%I where slug = $1 and id <> $2)', TG_TABLE_NAME)
        into v_ocupado using v_slug, new.id;
      if not v_ocupado then
        -- slugs (atuais, anteriores ou de conteúdos removidos) de OUTRO id ficam reservados
        select exists (
          select 1 from public.content_ids c
           where c.tipo = v_tipo
             and c.public_id <> new.public_id
             and (c.slug_atual = v_slug or v_slug = any (c.slugs_anteriores))
        ) into v_ocupado;
      end if;
      exit when not v_ocupado and not (v_slug = any (v_reservado));
      v_slug := v_base || '-' || v_i;
      v_i := v_i + 1;
    end loop;
    new.slug := v_slug;
  end if;

  -- Data da PRIMEIRA publicação (não é sobrescrita por edições posteriores)
  if new.published then
    if TG_OP = 'UPDATE' then
      new.published_at := coalesce(old.published_at, new.published_at, now());
    else
      new.published_at := coalesce(new.published_at, now());
    end if;
  elsif TG_OP = 'UPDATE' then
    new.published_at := coalesce(old.published_at, new.published_at);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_articles_conteudo_before on public.articles;
create trigger trg_articles_conteudo_before
  before insert or update on public.articles
  for each row execute function public.conteudo_before_write();

drop trigger if exists trg_results_conteudo_before on public.results;
create trigger trg_results_conteudo_before
  before insert or update on public.results
  for each row execute function public.conteudo_before_write();

drop trigger if exists trg_results_updated_at on public.results;
create trigger trg_results_updated_at
  before update on public.results
  for each row execute function public.set_updated_at();

-- 6b. DEPOIS de gravar: mantém o registro permanente (content_ids)
create or replace function public.conteudo_after_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tipo text := case TG_TABLE_NAME when 'articles' then 'blog' else 'resultado' end;
  v_pub  boolean;
begin
  if TG_OP = 'DELETE' then
    update public.content_ids
       set status = 'removido', conteudo_id = null, removido_em = now(), atualizado_em = now()
     where public_id = old.public_id;
    return old;
  end if;

  -- (não dá para referenciar new.consent_confirmed em articles: o campo não existe lá)
  if TG_TABLE_NAME = 'results' then
    v_pub := new.published and coalesce((to_jsonb(new) ->> 'consent_confirmed')::boolean, false);
  else
    v_pub := new.published;
  end if;

  if TG_OP = 'INSERT' then
    insert into public.content_ids (public_id, tipo, conteudo_id, slug_atual, status, ja_publicado)
    values (new.public_id, v_tipo, new.id, new.slug,
            case when v_pub then 'publicado' else 'rascunho' end, v_pub);
  else
    update public.content_ids c
       set conteudo_id      = new.id,
           slug_atual       = new.slug,
           slugs_anteriores = case
                                when old.slug is distinct from new.slug
                                  then array_append(array_remove(c.slugs_anteriores, new.slug), old.slug)
                                else c.slugs_anteriores
                              end,
           ja_publicado     = c.ja_publicado or v_pub,
           status           = case when v_pub then 'publicado'
                                   when c.ja_publicado then 'despublicado'
                                   else 'rascunho' end,
           atualizado_em    = now()
     where c.public_id = new.public_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_articles_conteudo_after on public.articles;
create trigger trg_articles_conteudo_after
  after insert or update or delete on public.articles
  for each row execute function public.conteudo_after_write();

drop trigger if exists trg_results_conteudo_after on public.results;
create trigger trg_results_conteudo_after
  after insert or update or delete on public.results
  for each row execute function public.conteudo_after_write();

-- 6c. Guarda-costas: um ID registrado em content_ids nunca pode ser apagado
create or replace function public.content_ids_protege()
returns trigger
language plpgsql
as $$
begin
  if TG_OP = 'DELETE' then
    raise exception 'content_ids é o histórico permanente de IDs e não pode ter linhas apagadas';
  end if;
  if new.public_id <> old.public_id then
    raise exception 'public_id não pode ser alterado';
  end if;
  return new;
end;
$$;
drop trigger if exists trg_content_ids_protege on public.content_ids;
create trigger trg_content_ids_protege
  before update or delete on public.content_ids
  for each row execute function public.content_ids_protege();

commit;
