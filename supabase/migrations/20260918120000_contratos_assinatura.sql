-- ============================================================
-- MÓDULO DE CONTRATOS COM ASSINATURA DIGITAL (desenhada)
-- ------------------------------------------------------------
-- 1) Tabela public.contracts: o admin cria o contrato (texto
--    formatado, igual ao editor de tratamentos) vinculado a um
--    paciente. O paciente lê o contrato dentro do próprio painel
--    e assina desenhando com o mouse/touch num <canvas>.
--
-- 2) A assinatura em si é uma imagem (PNG) guardada no bucket
--    já existente "documentos-pacientes", na pasta
--    "<patient_id>/assinaturas/...", reaproveitando as policies
--    de leitura que já existem para esse bucket.
--
-- 3) Para o paciente não conseguir alterar nada além de assinar
--    (nem o texto do contrato, nem o de outro paciente), a
--    assinatura não é um UPDATE direto na tabela: é feita pela
--    função assinar_contrato(), que roda como SECURITY DEFINER
--    e faz toda a validação manualmente antes de gravar.
--
-- 4) No momento da assinatura, o texto do contrato é copiado
--    para "signed_content_html": isso é a evidência do que foi
--    exatamente assinado, mesmo que o modelo seja editado depois.
-- ============================================================

create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  title text not null,
  content_html text not null,
  status text not null default 'pendente' check (status in ('pendente', 'assinado')),
  created_at timestamptz not null default now(),
  signature_image_path text,
  signed_content_html text,
  signed_at timestamptz,
  signed_user_agent text
);

create index if not exists idx_contracts_patient_id on public.contracts(patient_id);

alter table public.contracts enable row level security;

-- Admin: acesso total (criar, ver, editar, excluir).
create policy "admin_full_access_contracts" on public.contracts
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Paciente: só enxerga os próprios contratos.
create policy "patient_reads_own_contracts" on public.contracts
  for select
  using (patient_id in (select id from public.patients where user_id = auth.uid()));

-- ------------------------------------------------------------
-- Storage: paciente pode enviar a própria assinatura (PNG) para
-- dentro da própria pasta. A leitura já é coberta pela policy
-- "documentos_paciente_le_proprios_por_user_id" criada antes.
-- ------------------------------------------------------------
create policy "documentos_paciente_envia_assinatura" on storage.objects
  for insert
  with check (
    bucket_id = 'documentos-pacientes'
    and (storage.foldername(name))[2] = 'assinaturas'
    and (storage.foldername(name))[1] in (
      select id::text from public.patients where user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- assinar_contrato(): única forma do paciente marcar um contrato
-- como assinado. Confere se o contrato é realmente dele e se
-- ainda está pendente antes de gravar (evita reassinatura e
-- evita assinar contrato de outra pessoa).
-- ------------------------------------------------------------
create or replace function public.assinar_contrato(
  p_contract_id uuid,
  p_signature_path text,
  p_user_agent text default null
)
returns public.contracts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_patient_id uuid;
  v_row public.contracts;
begin
  select id into v_patient_id from public.patients where user_id = auth.uid();
  if v_patient_id is null then
    raise exception 'acesso negado';
  end if;

  select * into v_row from public.contracts
    where id = p_contract_id and patient_id = v_patient_id
    for update;

  if v_row.id is null then
    raise exception 'contrato não encontrado';
  end if;

  if v_row.status <> 'pendente' then
    raise exception 'este contrato já foi assinado anteriormente';
  end if;

  if p_signature_path is null or length(trim(p_signature_path)) = 0 then
    raise exception 'assinatura não informada';
  end if;

  update public.contracts set
    status = 'assinado',
    signature_image_path = p_signature_path,
    signed_content_html = content_html,
    signed_at = now(),
    signed_user_agent = p_user_agent
  where id = p_contract_id
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.assinar_contrato(uuid, text, text) to authenticated;
