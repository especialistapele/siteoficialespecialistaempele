-- Até aqui, patients.id sempre era EXATAMENTE o id do usuário em auth.users
-- (o mesmo id era usado em profiles, patients e em todo o login/resolução de
-- destino). Isso obrigava a criar o login já no momento da conversão de um
-- pré-atendimento em paciente.
--
-- Esta migration separa as duas coisas:
--   - patients.id continua sendo o identificador estável do paciente,
--     referenciado por appointments, announcements, financial_transactions,
--     medical_records, support_documents e pre_atendimentos (nada muda aqui).
--   - patients.user_id passa a guardar o vínculo com auth.users, e só é
--     preenchido quando o acesso ao Painel do Paciente é de fato gerado.
--
-- Pacientes já existentes foram criados com id = auth.users.id, então o
-- backfill abaixo preserva o funcionamento deles sem exigir nenhuma ação.

alter table public.patients add column if not exists user_id uuid references auth.users(id) on delete set null;

update public.patients set user_id = id where user_id is null;

create unique index if not exists idx_patients_user_id on public.patients(user_id) where user_id is not null;

-- Políticas ADITIVAS (não substituem nem removem nenhuma policy existente).
-- Isso garante que o paciente continue enxergando o próprio registro mesmo
-- quando patients.id não for mais igual ao auth.uid() (caso de pacientes
-- convertidos que ainda não tinham acesso gerado no momento do cadastro).
drop policy if exists "patients_select_own_by_user_id" on public.patients;
create policy "patients_select_own_by_user_id" on public.patients
  for select
  using (auth.uid() = user_id);
