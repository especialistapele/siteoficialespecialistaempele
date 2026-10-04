-- Termo de Direito de Imagem + assinatura das escolhas feitas pelo paciente.
-- Não altera tabelas existentes; apenas adiciona/atualiza um modelo e amplia
-- a função de assinatura com uma nova sobrecarga compatível com a anterior.

do $$
declare
  v_id uuid;
  v_html text := $html$
<p>Eu, abaixo identificado(a), autorizo, de forma livre e espontânea, o uso de minha imagem, registrada durante ou em decorrência dos procedimentos e atendimentos estéticos realizados por <strong>Danielle Queiroz Marcião Brito</strong>, profissional responsável pelo atendimento.</p>
<h2>2. FINALIDADE DO USO DA IMAGEM</h2>
<p>Autorizo a utilização das imagens para as seguintes finalidades, mediante marcação das opções desejadas:</p>
<p><span class="contrato-opcao" data-contract-choice data-contract-group="finalidade" data-contract-value="registro"><span data-contract-mark>○</span> <strong>Somente registro interno do atendimento e acompanhamento da evolução do procedimento.</strong></span></p>
<p><span class="contrato-opcao" data-contract-choice data-contract-group="finalidade" data-contract-value="divulgacao"><span data-contract-mark>○</span> <strong>Divulgação profissional</strong>, incluindo materiais impressos e/ou digitais relacionados aos serviços estéticos.</span></p>
<p><span class="contrato-opcao" data-contract-choice data-contract-group="finalidade" data-contract-value="redes-sociais"><span data-contract-mark>○</span> <strong>Redes sociais</strong>, como Instagram, Facebook, TikTok e outras plataformas utilizadas profissionalmente.</span></p>
<p><span class="contrato-opcao" data-contract-choice data-contract-group="finalidade" data-contract-value="site"><span data-contract-mark>○</span> <strong>Site e materiais de divulgação profissional.</strong></span></p>
<p><span class="contrato-opcao" data-contract-choice data-contract-group="finalidade" data-contract-value="antes-depois"><span data-contract-mark>○</span> <strong>Antes e depois do procedimento</strong>, exclusivamente para fins de demonstração dos resultados estéticos.</span></p>
<p><span class="contrato-opcao" data-contract-choice data-contract-group="finalidade" data-contract-value="outros"><span data-contract-mark>○</span> <strong>Outros:</strong> <span data-contract-other>_______________________________________________</span></span></p>
<h2>3. IDENTIFICAÇÃO DA IMAGEM</h2>
<p>Quando houver divulgação de imagens de antes e depois, autorizo que as fotografias sejam utilizadas exclusivamente para as finalidades expressamente assinaladas neste termo.</p>
<p>Estou ciente de que a divulgação poderá ocorrer com ou sem identificação nominal, conforme opção abaixo:</p>
<p><span class="contrato-opcao" data-contract-choice data-contract-group="identificacao" data-contract-value="sem-nome"><span data-contract-mark>○</span> <strong>Autorizo a divulgação sem meu nome ou outros dados pessoais identificáveis.</strong></span></p>
<p><span class="contrato-opcao" data-contract-choice data-contract-group="identificacao" data-contract-value="com-nome"><span data-contract-mark>○</span> <strong>Autorizo a divulgação com meu nome.</strong></span></p>
<p><strong>Observação:</strong> A autorização para uso da imagem não implica autorização para divulgação de informações pessoais, dados de saúde ou informações do meu atendimento que não sejam necessárias à finalidade autorizada.</p>
<h2>4. PROTEÇÃO DA IDENTIDADE</h2>
<p>Quando possível, e especialmente em imagens destinadas à divulgação de resultados estéticos, poderão ser utilizados recursos para preservar minha identidade, tais como enquadramento apenas da região tratada ou ocultação do rosto.</p>
<p>Caso o rosto ou outra característica que permita minha identificação apareça na imagem, a utilização ficará condicionada à autorização correspondente indicada neste termo.</p>
<h2>5. GRATUIDADE DA AUTORIZAÇÃO</h2>
<p>A presente autorização é concedida de forma <strong>gratuita</strong>, não sendo devido qualquer pagamento, remuneração ou indenização pela utilização das imagens dentro das finalidades expressamente autorizadas neste documento.</p>
<h2>6. PRAZO E REVOGAÇÃO</h2>
<p>A autorização é concedida pelo período de:</p>
<p><span class="contrato-opcao" data-contract-choice data-contract-group="prazo" data-contract-value="10-anos"><span data-contract-mark>○</span> 10 anos.</span></p>
<p><span class="contrato-opcao" data-contract-choice data-contract-group="prazo" data-contract-value="indeterminado"><span data-contract-mark>○</span> <strong>Prazo indeterminado, até eventual revogação.</strong></span></p>
<p>O(A) cliente/paciente poderá solicitar a revogação da autorização para <strong>novos usos</strong> de sua imagem, mediante solicitação à profissional responsável.</p>
<p>A revogação não prejudicará utilizações que tenham sido realizadas legitimamente antes do recebimento da solicitação, nem implicará necessariamente a retirada imediata de materiais que já tenham sido impressos ou reproduzidos por terceiros.</p>
<h2>7. DECLARAÇÃO</h2>
<p>Declaro que fui informado(a) sobre a finalidade do uso da minha imagem e que tive oportunidade de esclarecer minhas dúvidas.</p>
<p>Compreendo que <strong>a autorização para uso de imagem é independente da realização do procedimento estético</strong>, podendo optar por não autorizar a divulgação de minhas imagens sem que isso impeça a realização do atendimento ou procedimento contratado.</p>
<p>Por estar de acordo, assino o presente termo de forma livre e consciente.</p>
$html$;
  v_id := gen_random_uuid();
  select id into v_id from public.document_templates where code = 'TERMO_DIREITO_IMAGEM' limit 1;
  if v_id is null then
    insert into public.document_templates (code,title,document_type,version,content_html,structured_schema,active)
    values (
      'TERMO_DIREITO_IMAGEM',
      'Termo de Direito de Imagem',
      'contrato',
      1,
      v_html,
      '{"interactive":true,"groups":{"finalidade":{"type":"multi"},"identificacao":{"type":"single"},"prazo":{"type":"single"}}}'::jsonb,
      true
    );
  else
    update public.document_templates
       set title='Termo de Direito de Imagem',
           document_type='contrato',
           version=1,
           content_html=v_html,
           structured_schema='{"interactive":true,"groups":{"finalidade":{"type":"multi"},"identificacao":{"type":"single"},"prazo":{"type":"single"}}}'::jsonb,
           active=true,
           updated_at=now()
     where id=v_id;
  end if;
end $$;

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
  if v_patient_id is null then raise exception 'acesso negado'; end if;
  select * into v_row from public.contracts where id=p_contract_id and patient_id=v_patient_id for update;
  if v_row.id is null then raise exception 'contrato não encontrado'; end if;
  if v_row.status <> 'pendente' then raise exception 'este contrato já foi assinado anteriormente'; end if;
  if p_signature_path is null or length(trim(p_signature_path))=0 then raise exception 'assinatura não informada'; end if;
  update public.contracts set status='assinado',signature_image_path=p_signature_path,
    signed_content_html=content_html,signed_at=now(),signed_user_agent=p_user_agent
    where id=p_contract_id returning * into v_row;
  return v_row;
end;
$$;

create or replace function public.assinar_contrato(
  p_contract_id uuid,
  p_signature_path text,
  p_user_agent text,
  p_signed_content_html text
)
returns public.contracts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_patient_id uuid;
  v_row public.contracts;
  v_snapshot text;
begin
  select id into v_patient_id from public.patients where user_id = auth.uid();
  if v_patient_id is null then raise exception 'acesso negado'; end if;
  select * into v_row from public.contracts where id=p_contract_id and patient_id=v_patient_id for update;
  if v_row.id is null then raise exception 'contrato não encontrado'; end if;
  if v_row.status <> 'pendente' then raise exception 'este contrato já foi assinado anteriormente'; end if;
  if p_signature_path is null or length(trim(p_signature_path))=0 then raise exception 'assinatura não informada'; end if;
  v_snapshot := nullif(trim(p_signed_content_html), '');
  if v_snapshot is null then v_snapshot := v_row.content_html; end if;
  update public.contracts set status='assinado',signature_image_path=p_signature_path,
    signed_content_html=v_snapshot,signed_at=now(),signed_user_agent=p_user_agent
    where id=p_contract_id returning * into v_row;
  return v_row;
end;
$$;

grant execute on function public.assinar_contrato(uuid,text,text,text) to authenticated;
