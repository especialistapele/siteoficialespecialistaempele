-- ============================================================
-- 1) CORREÇÃO ADITIVA: leitura do próprio paciente por user_id
-- ------------------------------------------------------------
-- Desde que patients.user_id passou a poder ser diferente de
-- patients.id (paciente cadastrado primeiro, acesso gerado
-- depois), as policies antigas que comparam "patient_id =
-- auth.uid()" deixaram de valer para esses pacientes: o auth.uid()
-- deles é o user_id, não o id do paciente.
--
-- Isso é aditivo: nada é removido. Pacientes antigos (onde
-- id = user_id) continuam funcionando pelas policies antigas;
-- pacientes novos passam a enxergar os próprios dados também.
-- ============================================================

create policy "appointments_patient_select_by_user_id" on public.appointments
  for select
  using (patient_id in (select id from public.patients where user_id = auth.uid()));

create policy "announcements_patient_select_by_user_id" on public.announcements
  for select
  using (patient_id in (select id from public.patients where user_id = auth.uid()));

create policy "medical_records_patient_select_by_user_id" on public.medical_records
  for select
  using (patient_id in (select id from public.patients where user_id = auth.uid()));

create policy "financial_transactions_patient_select_by_user_id" on public.financial_transactions
  for select
  using (patient_id in (select id from public.patients where user_id = auth.uid()));

create policy "support_documents_patient_select_by_user_id" on public.support_documents
  for select
  using (patient_id in (select id from public.patients where user_id = auth.uid()));

-- Mesmo problema no Storage: os arquivos do paciente ficam em
-- "<patient_id>/...", mas a policy de leitura só comparava a
-- pasta com auth.uid(). Policy aditiva para cobrir o caso novo.
create policy "documentos_paciente_le_proprios_por_user_id" on storage.objects
  for select
  using (
    bucket_id = 'documentos-pacientes'
    and (storage.foldername(name))[1] in (
      select id::text from public.patients where user_id = auth.uid()
    )
  );

-- ============================================================
-- 2) REGISTRO DE ACOMPANHAMENTO FOTOGRÁFICO (Prontuário)
-- ------------------------------------------------------------
-- Fotos de antes/depois vinculadas a um atendimento do paciente,
-- com controle individual de visibilidade no Painel do Paciente.
-- As imagens ficam no bucket privado "documentos-pacientes", na
-- pasta "<patient_id>/fotos/...", então usam o mesmo esquema de
-- permissão dos documentos de apoio (signed URL, não é público).
-- ============================================================

create table if not exists public.photo_records (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  appointment_date date,
  procedure_description text,
  notes text,
  before_image_path text not null,
  after_image_path text not null,
  visible_to_patient boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_photo_records_patient_id on public.photo_records(patient_id);

alter table public.photo_records enable row level security;

create policy "admin_full_access_photo_records" on public.photo_records
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "patient_reads_own_visible_photo_records" on public.photo_records
  for select
  using (
    visible_to_patient = true
    and patient_id in (select id from public.patients where user_id = auth.uid())
  );
