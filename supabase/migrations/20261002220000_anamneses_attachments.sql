-- Anexos de anamneses e permissões de upload
-- 2026-10-02

drop policy if exists anamnesis_attachments_patient_insert on public.anamnesis_attachments;
create policy anamnesis_attachments_patient_insert on public.anamnesis_attachments
for insert to authenticated
with check (
  patient_id in (select id from public.patients where user_id=auth.uid())
  and anamnesis_version_id in (
    select id from public.anamnesis_versions where patient_id=public.anamnesis_attachments.patient_id
  )
);

drop policy if exists anamnesis_attachments_patient_select on public.anamnesis_attachments;
create policy anamnesis_attachments_patient_select on public.anamnesis_attachments
for select to authenticated
using (
  patient_id in (select id from public.patients where user_id=auth.uid())
  or public.is_admin()
);

drop policy if exists documentos_paciente_envia_anamnese on storage.objects;
create policy documentos_paciente_envia_anamnese on storage.objects
for insert to public
with check (
  bucket_id='documentos-pacientes'
  and (storage.foldername(name))[1] in (
    select patients.id::text from public.patients where patients.user_id=auth.uid()
  )
  and (storage.foldername(name))[2] in ('anamneses','assinaturas')
);

drop policy if exists documentos_paciente_le_anamnese on storage.objects;
create policy documentos_paciente_le_anamnese on storage.objects
for select to public
using (
  bucket_id='documentos-pacientes'
  and (
    (storage.foldername(name))[1] in (
      select patients.id::text from public.patients where patients.user_id=auth.uid()
    )
    or public.is_admin()
  )
);