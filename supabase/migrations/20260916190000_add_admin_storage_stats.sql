-- ============================================================
-- admin_storage_stats() — status do Storage para o painel admin
-- ------------------------------------------------------------
-- Expõe, via RPC, um resumo do uso do Supabase Storage do
-- projeto: total de arquivos, total de imagens, espaço usado
-- (bytes) e espaço usado somente por imagens (bytes).
--
-- Os dados vêm da tabela de sistema storage.objects, que guarda
-- em metadata->>'size' (bytes) e metadata->>'mimetype' cada
-- arquivo enviado para qualquer bucket do projeto.
--
-- SECURITY DEFINER + checagem manual de role = 'admin' (mesmo
-- padrão usado nas demais rotinas administrativas): a função
-- roda com privilégios elevados para conseguir ler
-- storage.objects, mas primeiro confirma que quem chamou é um
-- admin autenticado — senão, nega o acesso.
-- ============================================================

create or replace function public.admin_storage_stats()
returns json
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  is_admin boolean;
begin
  select (role = 'admin') into is_admin
  from public.profiles
  where id = auth.uid();

  if not coalesce(is_admin, false) then
    raise exception 'acesso negado';
  end if;

  return (
    select json_build_object(
      'total_arquivos', count(*),
      'total_imagens', count(*) filter (
        where (metadata->>'mimetype') like 'image/%'
      ),
      'total_bytes', coalesce(sum((metadata->>'size')::bigint), 0),
      'total_bytes_imagens', coalesce(
        sum((metadata->>'size')::bigint) filter (
          where (metadata->>'mimetype') like 'image/%'
        ), 0
      )
    )
    from storage.objects
  );
end;
$$;

grant execute on function public.admin_storage_stats() to authenticated;
