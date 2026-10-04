-- Harden public trigger/event-trigger functions and the content ID protection trigger.
-- Keep authenticated access only where the function is an intentional application RPC.
revoke execute on function public.admin_storage_stats() from anon;

revoke execute on function public.assinar_contrato(uuid, text, text) from anon;
revoke execute on function public.assinar_contrato(uuid, text, text, text) from anon;

revoke execute on function public.bot_messages_after_insert() from public;
revoke execute on function public.bot_messages_after_insert() from anon, authenticated;

revoke execute on function public.conteudo_after_write() from public;
revoke execute on function public.conteudo_after_write() from anon, authenticated;

revoke execute on function public.conteudo_before_write() from public;
revoke execute on function public.conteudo_before_write() from anon, authenticated;

revoke execute on function public.content_ids_protege() from public;
revoke execute on function public.content_ids_protege() from anon, authenticated;

revoke execute on function public.rls_auto_enable() from public;
revoke execute on function public.rls_auto_enable() from anon, authenticated;

create or replace function public.content_ids_protege()
returns trigger
language plpgsql
set search_path = public
as $function$
begin
  if TG_OP = 'DELETE' then
    raise exception 'content_ids é o histórico permanente de IDs e não pode ter linhas apagadas';
  end if;

  if new.public_id <> old.public_id then
    raise exception 'public_id não pode ser alterado';
  end if;

  return new;
end;
$function$;
