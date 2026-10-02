-- Security and performance hardening for the anamnesis/document model.

drop index if exists public.idx_attachments_version;
drop index if exists public.idx_anamnesis_responses_version;

create index if not exists idx_anamnesis_attachments_patient on public.anamnesis_attachments(patient_id);
create index if not exists idx_anamnesis_edit_permissions_patient on public.anamnesis_edit_permissions(patient_id);
create index if not exists idx_anamnesis_edit_permissions_granted_by on public.anamnesis_edit_permissions(granted_by);
create index if not exists idx_anamnesis_questions_definition on public.anamnesis_questions(question_definition_id);
create index if not exists idx_anamnesis_releases_type on public.anamnesis_releases(anamnesis_type_id);
create index if not exists idx_anamnesis_releases_released_by on public.anamnesis_releases(released_by);
create index if not exists idx_anamnesis_responses_concept on public.anamnesis_responses(clinical_concept_id);
create index if not exists idx_anamnesis_signatures_patient on public.anamnesis_signatures(patient_id);
create index if not exists idx_anamnesis_versions_type on public.anamnesis_versions(anamnesis_type_id);
create index if not exists idx_document_signatures_patient on public.document_signatures(patient_id);
create index if not exists idx_document_snapshots_patient on public.document_snapshots(patient_id);
create index if not exists idx_documents_template on public.documents(template_id);
create index if not exists idx_patient_clinical_data_concept on public.patient_clinical_data(clinical_concept_id);
create index if not exists idx_patient_clinical_data_source_response on public.patient_clinical_data(source_anamnesis_response_id);
create index if not exists idx_question_definitions_concept on public.question_definitions(clinical_concept_id);

revoke execute on function public.release_anamnesis(uuid, uuid, timestamptz) from anon;
revoke execute on function public.grant_anamnesis_edit(uuid, timestamptz) from anon;
revoke execute on function public.submit_anamnesis(uuid, jsonb, text, text) from anon;
