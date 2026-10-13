-- RBAC groundwork: support admin, equipe and paciente without granting new access by default.
-- This migration is prepared on a feature branch only; do not apply to production until reviewed.
begin;

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role = any (array['admin'::text, 'equipe'::text, 'paciente'::text]));

alter table public.profiles
  add column if not exists permissions jsonb not null default '{}'::jsonb;

alter table public.profiles
  drop constraint if exists profiles_permissions_object_check;

alter table public.profiles
  add constraint profiles_permissions_object_check
  check (jsonb_typeof(permissions) = 'object');

create or replace function public.has_panel_permission(permission_key text)
returns boolean
language sql
stable
security invoker
set search_path = public
as $function$
  select coalesce((
    select p.role = 'admin'
      or (
        p.role = 'equipe'
        and (p.permissions -> permission_key) = 'true'::jsonb
      )
    from public.profiles p
    where p.id = (select auth.uid())
  ), false);
$function$;

revoke all on function public.has_panel_permission(text) from public;
revoke all on function public.has_panel_permission(text) from anon;
grant execute on function public.has_panel_permission(text) to authenticated;

comment on column public.profiles.permissions is
  'Permissões explícitas por módulo para usuários com role=equipe. Somente administradores devem editar este campo. Ex.: {"patients":true,"appointments":true,"clinical_records":false,"finance":false}.';

commit;
