-- Base documental e de anamneses
-- 2026-10-02
-- Esta migration é idempotente para permitir sincronização do ambiente já provisionado.

alter table public.patients
  add column if not exists cpf text,
  add column if not exists rg text,
  add column if not exists birth_date date,
  add column if not exists address text,
  add column if not exists address_number text,
  add column if not exists address_complement text,
  add column if not exists neighborhood text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists cep text,
  add column if not exists profession text,
  add column if not exists children text,
  add column if not exists blood_type text,
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists patients_cpf_unique_idx
  on public.patients(cpf) where cpf is not null and btrim(cpf) <> '';

create table if not exists public.anamnesis_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.clinical_concepts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  data_type text not null default 'text',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.question_definitions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  clinical_concept_id uuid references public.clinical_concepts(id) on delete set null,
  label text not null,
  help_text text,
  field_type text not null,
  options jsonb,
  validation jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.anamnesis_questions (
  id uuid primary key default gen_random_uuid(),
  anamnesis_type_id uuid not null references public.anamnesis_types(id) on delete cascade,
  question_definition_id uuid not null references public.question_definitions(id) on delete restrict,
  section text,
  position integer not null default 0,
  required boolean not null default true,
  conditional_rule jsonb,
  active boolean not null default true,
  unique(anamnesis_type_id, question_definition_id)
);

create table if not exists public.anamnesis_versions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  anamnesis_type_id uuid not null references public.anamnesis_types(id) on delete restrict,
  version_number integer not null,
  status text not null default 'draft',
  released_at timestamptz,
  submitted_at timestamptz,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  unique(patient_id, anamnesis_type_id, version_number)
);

create table if not exists public.anamnesis_responses (
  id uuid primary key default gen_random_uuid(),
  anamnesis_version_id uuid not null references public.anamnesis_versions(id) on delete cascade,
  question_definition_id uuid not null references public.question_definitions(id) on delete restrict,
  clinical_concept_id uuid references public.clinical_concepts(id) on delete set null,
  value jsonb,
  source text not null default 'anamnese',
  created_at timestamptz not null default now(),
  unique(anamnesis_version_id, question_definition_id)
);

create table if not exists public.patient_clinical_data (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  clinical_concept_id uuid not null references public.clinical_concepts(id) on delete restrict,
  value jsonb not null,
  source_anamnesis_response_id uuid references public.anamnesis_responses(id) on delete set null,
  valid_from timestamptz not null default now(),
  valid_to timestamptz,
  is_current boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.anamnesis_signatures (
  id uuid primary key default gen_random_uuid(),
  anamnesis_version_id uuid not null unique references public.anamnesis_versions(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  signature_image_path text not null,
  signed_at timestamptz not null default now(),
  signed_user_agent text
);

create table if not exists public.anamnesis_attachments (
  id uuid primary key default gen_random_uuid(),
  anamnesis_version_id uuid not null references public.anamnesis_versions(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  file_path text not null,
  file_name text,
  mime_type text,
  file_size bigint,
  created_at timestamptz not null default now()
);

create table if not exists public.anamnesis_releases (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  anamnesis_type_id uuid not null references public.anamnesis_types(id) on delete restrict,
  target_version integer,
  released_at timestamptz not null default now(),
  released_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz,
  status text not null default 'released'
);

create table if not exists public.anamnesis_edit_permissions (
  id uuid primary key default gen_random_uuid(),
  anamnesis_version_id uuid not null references public.anamnesis_versions(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  granted_at timestamptz not null default now(),
  granted_by uuid references auth.users(id) on delete set null,
  used_at timestamptz,
  expires_at timestamptz,
  status text not null default 'active'
);

create table if not exists public.document_fields (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  source_path text not null,
  format text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.document_templates (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  document_type text not null,
  version integer not null default 1,
  content_html text not null,
  structured_schema jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  template_id uuid references public.document_templates(id) on delete set null,
  title text not null,
  document_type text not null,
  content_html text not null,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  issued_at timestamptz,
  signed_at timestamptz
);

create table if not exists public.document_snapshots (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null unique references public.documents(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  template_version integer,
  rendered_content_html text not null,
  field_values jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.document_signatures (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null unique references public.documents(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  signature_image_path text not null,
  signed_at timestamptz not null default now(),
  signed_user_agent text
);

create index if not exists anamnesis_versions_patient_idx
  on public.anamnesis_versions(patient_id, anamnesis_type_id, created_at desc);
create index if not exists anamnesis_responses_version_idx
  on public.anamnesis_responses(anamnesis_version_id);
create index if not exists patient_clinical_data_current_idx
  on public.patient_clinical_data(patient_id, clinical_concept_id, is_current);
create index if not exists documents_patient_idx
  on public.documents(patient_id, created_at desc);

-- RLS: nenhuma tabela nova fica exposta sem política.
do $$
declare t text;
begin
  foreach t in array array[
    'anamnesis_types','clinical_concepts','question_definitions','anamnesis_questions',
    'anamnesis_versions','anamnesis_responses','patient_clinical_data',
    'anamnesis_signatures','anamnesis_attachments','anamnesis_releases',
    'anamnesis_edit_permissions','document_fields','document_templates',
    'documents','document_snapshots','document_signatures'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Dados de catálogo.
insert into public.anamnesis_types(code,name,description) values
('FACIAL','Anamnese Facial','Anamnese clínica facial completa'),
('FACIAL_ONLINE','Anamnese Facial Online','Anamnese facial completa com módulo de consultoria online'),
('CORPORAL','Anamnese Corporal','Anamnese clínica corporal e sistêmica'),
('CLAREAMENTO_CORPORAL','Anamnese de Clareamento Corporal','Avaliação específica para clareamento corporal'),
('ESTRIAS','Anamnese de Estrias','Avaliação específica para estrias'),
('REMOCAO','Anamnese de Remoção Facial e Corporal','Avaliação específica para remoções faciais e corporais')
on conflict (code) do update set name=excluded.name,description=excluded.description,active=true;

insert into public.document_fields(code,label,source_path,format) values
('NOME_COMPLETO','Nome completo','patients.full_name',null),
('CPF','CPF','patients.cpf',null),
('RG','RG','patients.rg',null),
('DATA_NASCIMENTO','Data de nascimento','patients.birth_date','date'),
('IDADE','Idade','calculated.age',null),
('ENDERECO','Endereço','patients.address',null),
('NUMERO','Número','patients.address_number',null),
('COMPLEMENTO','Complemento','patients.address_complement',null),
('BAIRRO','Bairro','patients.neighborhood',null),
('CIDADE','Cidade','patients.city',null),
('ESTADO','Estado','patients.state',null),
('CEP','CEP','patients.cep',null),
('TELEFONE','Telefone','patients.phone',null),
('EMAIL','E-mail','patients.email',null),
('PROFISSAO','Profissão','patients.profession',null),
('FILHOS','Filhos','patients.children',null),
('TIPO_SANGUINEO','Tipo sanguíneo','patients.blood_type',null),
('DATA_DOCUMENTO','Data do documento','system.document_date','date'),
('DATA_ATENDIMENTO','Data do atendimento','system.appointment_date','date'),
('PROCEDIMENTO','Procedimento','system.procedure',null),
('PROFISSIONAL','Profissional','system.professional',null)
on conflict (code) do update set label=excluded.label,source_path=excluded.source_path,format=excluded.format,active=true;

insert into public.clinical_concepts(code,name,data_type) values
('MEDICAMENTOS_ATUAIS','Medicamentos atuais','json'),
('ALERGIA_COSMETICOS','Alergia a cosméticos','boolean'),
('GESTACAO','Gestação','boolean'),
('TIPO_SANGUINEO','Tipo sanguíneo','text'),
('ULTIMO_PROC_FACIAL','Último procedimento facial','text'),
('ULTIMO_PROC_CORPORAL','Último procedimento corporal','text'),
('ROTINA_SKINCARE','Rotina de skincare','text'),
('CONSUMO_AGUA','Consumo de água','text'),
('TABAGISMO','Tabagismo','json'),
('ATIVIDADE_FISICA','Atividade física','json'),
('ACOMPANHAMENTO_DERMATOLOGICO','Acompanhamento dermatológico','text'),
('SUPLEMENTOS_ATUAIS','Suplementos atuais','json'),
('ALERGIAS','Alergias','json'),
('PRESSAO_ALTA','Pressão alta','boolean'),
('DIABETES','Diabetes','json'),
('HISTORICO_CIRURGICO','Histórico cirúrgico','text'),
('PROCEDIMENTOS_ANTERIORES','Procedimentos anteriores','json')
on conflict (code) do update set name=excluded.name,data_type=excluded.data_type;