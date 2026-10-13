# RBAC rollout plan — Especialista em Pele

Status: preparation only; production database and main branch have not been changed.

## Existing state verified
- Supabase project: clwaotfbqwvxpykruwed (PostgreSQL 17).
- public.profiles.role currently permits only admin and paciente.
- Login module routes only admin to /painel/admin/dashboard.html and patient to /painel/paciente/painel.html.
- Existing admin-only policies and SECURITY DEFINER RPCs must be preserved until each affected table/function is reviewed.
- RLS is enabled on the inspected public tables.

## Target model
- admin: full administrative access.
- equipe: access by explicit per-user permissions; no user administration or critical settings by default.
- paciente: only own patient workflow and records, subject to existing patient-specific policies.

## Files in this branch
- Migration adds role=equipe, a JSONB permissions object and a SECURITY INVOKER helper. It grants no permissions to existing users and does not modify existing RLS policies.
- SQL verification script checks the schema/helper/grants on a disposable database.
- No production migration has been run.

## Required next stages before production
1. Map every admin page to a module permission and replace guards only after confirming its data dependencies.
2. Review each table's policies, including clinical and finance data, for admin/team/patient separation and least privilege.
3. Audit SECURITY DEFINER functions, Storage policies and RPC grants; do not blanket-grant team access.
4. Implement the team landing page and login routing; preserve patient portal and public pages.
5. Run migration and RLS tests on a Supabase development branch with test identities for admin, team with/without each permission, patient owner, other patient, and anonymous.
6. Run Security Advisor, manual route tests and existing workflow regressions.
7. Present results for approval. Do not merge or apply to production until approved.
