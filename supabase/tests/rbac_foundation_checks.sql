-- RBAC migration verification checks.
-- Run only against a disposable/local database or a Supabase development branch.
begin;

do $test$
declare
  role_check text;
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='profiles' and column_name='permissions'
      and data_type='jsonb' and is_nullable='NO'
  ) then
    raise exception 'FAIL: profiles.permissions jsonb NOT NULL missing';
  end if;

  select pg_get_constraintdef(oid) into role_check
  from pg_constraint
  where conrelid='public.profiles'::regclass and conname='profiles_role_check';

  if role_check is null or position('equipe' in role_check) = 0 then
    raise exception 'FAIL: role constraint does not allow equipe';
  end if;

  if to_regprocedure('public.has_panel_permission(text)') is null then
    raise exception 'FAIL: has_panel_permission(text) missing';
  end if;

  if has_function_privilege('anon', 'public.has_panel_permission(text)', 'EXECUTE') then
    raise exception 'FAIL: anon can execute has_panel_permission';
  end if;

  if not has_function_privilege('authenticated', 'public.has_panel_permission(text)', 'EXECUTE') then
    raise exception 'FAIL: authenticated cannot execute has_panel_permission';
  end if;

  if (select public.has_panel_permission('__rbac_test_unknown_permission__')) is distinct from false
     and auth.uid() is null then
    raise exception 'FAIL: unauthenticated call should not grant permission';
  end if;

  raise notice 'PASS: role constraint, permission storage, helper function and grants verified';
end
$test$;

rollback;
