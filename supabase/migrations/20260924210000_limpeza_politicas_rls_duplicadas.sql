-- ============================================================
-- Limpeza de políticas de RLS duplicadas (sobra de uma migração
-- antiga que coexistia com uma mais nova). Nenhuma regra de acesso
-- muda: as condições duplicadas são só unificadas numa política por
-- tabela/comando. Onde havia duas condições DIFERENTES (id direto vs.
-- via patients.user_id), elas são mescladas com OR — exatamente o
-- mesmo efeito de ter as duas políticas separadas, só que mais claro.
--
-- Antes / depois (nenhuma política nova ganha acesso que não existia):
--   appointments      5 políticas -> 2 (admin + select do paciente, mesclada)
--   patients          5 políticas -> 2 (admin + select do próprio paciente, mesclada)
--   profiles          4 políticas -> 2 (condições eram idênticas, só duplicadas)
--   pre_atendimentos  4 políticas -> 2 (admin duplicado + insert público duplicado)
-- ============================================================

begin;

-- appointments
drop policy if exists appointments_admin_all on public.appointments;
drop policy if exists appointments_patient_select on public.appointments;
drop policy if exists appointments_patient_select_by_user_id on public.appointments;
drop policy if exists patient_reads_own_appointments on public.appointments;
create policy patient_reads_own_appointments on public.appointments
  for select using (
    patient_id = auth.uid()
    or patient_id in (select patients.id from public.patients where patients.user_id = auth.uid())
  );

-- patients
drop policy if exists patients_admin_all on public.patients;
drop policy if exists patients_self_select on public.patients;
drop policy if exists patients_select_own_by_user_id on public.patients;
drop policy if exists patient_reads_own_record on public.patients;
create policy patient_reads_own_record on public.patients
  for select using (auth.uid() = id or auth.uid() = user_id);

-- profiles
drop policy if exists profiles_admin_all on public.profiles;
drop policy if exists profiles_self_select on public.profiles;

-- pre_atendimentos
drop policy if exists pre_atendimentos_admin_all on public.pre_atendimentos;
drop policy if exists pre_atendimentos_public_insert on public.pre_atendimentos;

commit;
