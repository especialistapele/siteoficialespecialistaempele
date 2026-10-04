-- Remove inherited PUBLIC/anon execution from authenticated-only contract/admin RPCs.
-- Their function bodies already enforce the authenticated patient/admin checks.
revoke execute on function public.admin_storage_stats() from public;
revoke execute on function public.admin_storage_stats() from anon;

revoke execute on function public.assinar_contrato(uuid, text, text) from public;
revoke execute on function public.assinar_contrato(uuid, text, text) from anon;
revoke execute on function public.assinar_contrato(uuid, text, text, text) from public;
revoke execute on function public.assinar_contrato(uuid, text, text, text) from anon;
