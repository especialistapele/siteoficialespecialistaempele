import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const auth = readFileSync("painel/assets/js/painel-auth.js", "utf8");
const loginHtml = readFileSync("painel/index.html", "utf8");
const sidebar = readFileSync("painel/assets/js/admin-sidebar.js", "utf8");
const patientPanel = readFileSync("painel/paciente/painel.html", "utf8");
const sharedSanitize = readFileSync("assets/js/sanitize.js", "utf8");
const richTextSanitize = readFileSync("assets/js/rich-text.js", "utf8");
const publicArticlePage = readFileSync("blog/artigos/artigo-data.js", "utf8");
const publicTreatmentPage = readFileSync("tratamentos/tratamento-data.js", "utf8");
const adminPolicyMigration = readFileSync("supabase/migrations/20261011150000_scope_admin_rls_policies_to_authenticated.sql", "utf8");
const contractAdmin = readFileSync("painel/admin/contratos.html", "utf8");
const contractPdf = readFileSync("painel/assets/js/contrato-pdf.js", "utf8");
const signaturePathMigration = readFileSync("supabase/migrations/20261011170000_constrain_patient_signature_paths.sql", "utf8");
const anamnesisConceptMigration = readFileSync("supabase/migrations/20261011180000_enforce_anamnesis_response_concepts.sql", "utf8");
const submitAnamnesisMigration = readFileSync("supabase/migrations/20261011210000_harden_submit_anamnesis_concept_mapping.sql", "utf8");
const botSource = readFileSync("assets/js/bot-triagem.js", "utf8");
const botLoggingMigration = readFileSync("supabase/migrations/20261011200000_harden_public_bot_logging.sql", "utf8");
const intakeValidationMigration = readFileSync("supabase/migrations/20261011230000_validate_public_pre_atendimento.sql", "utf8");
const anamnesisWriteMigration = readFileSync("supabase/migrations/20261011240000_revoke_direct_anamnesis_writes.sql", "utf8");
const attachmentPolicyMigration = readFileSync("supabase/migrations/20261011250000_harden_anamnesis_attachment_writes.sql", "utf8");
const adminAnamnesisDraft = readFileSync("painel/admin/anamnese-rascunho.html", "utf8");
const patientAnamnesis = readFileSync("painel/paciente/anamnese.html", "utf8");
const publicSupabaseClient = readFileSync("assets/js/supabase-client.js", "utf8");
const edgeFunctionSources = [
  readFileSync("supabase/functions/create-patient/index.ts", "utf8"),
  readFileSync("supabase/functions/disparar-publicacao/index.ts", "utf8"),
  readFileSync("supabase/functions/reconciliar-publicacao/index.ts", "utf8"),
];
const chartPages = [
  readFileSync("painel/admin/dashboard.html", "utf8"),
  readFileSync("painel/admin/paciente.html", "utf8"),
  readFileSync("painel/admin/configuracoes.html", "utf8"),
];
const inlineScript = loginHtml.match(/<script>([\s\S]*?)<\/script>/i)?.[1];

assert.ok(inlineScript, "login precisa manter o script de autenticação");
new vm.Script(inlineScript, { filename: "painel/index.html:inline-script" });

const resolver = auth.match(/export async function resolverDestino\(userId\) \{([\s\S]*?)\n\}/)?.[1];
assert.ok(resolver, "resolverDestino deve existir");
assert.match(resolver, /if \(typeof userId !== "string" \|\| !userId\.trim\(\)\) return null/);
assert.match(resolver, /if \(erroPerfil\) return \{ erro: "temporario" \}/);
assert.match(resolver, /if \(erroPaciente\) return \{ erro: "temporario" \}/);
assert.match(resolver, /if \(!paciente \|\| paciente\.acesso_painel === false\) return null/);
assert.match(resolver, /\.maybeSingle\(\)/);
assert.doesNotMatch(resolver, /acesso_painel !== false/, "cadastro ausente nunca pode ser interpretado como paciente autorizado");

const adminGuard = auth.match(/export async function exigirAdmin\(\) \{([\s\S]*?)\n\}/)?.[1];
const patientGuard = auth.match(/export async function exigirPaciente\(\) \{([\s\S]*?)\n\}/)?.[1];
assert.ok(adminGuard && patientGuard, "os dois guards devem existir");
assert.match(adminGuard, /if \(error\) \{\s*redirecionar\(TEMPORARY_ERROR_URL\)/);
assert.match(adminGuard, /perfil\.role !== "admin"/);
assert.doesNotMatch(adminGuard, /auth\.signOut/, "falha temporária do guard administrativo não encerra a sessão");
assert.match(patientGuard, /if \(error\) \{\s*redirecionar\(TEMPORARY_ERROR_URL\)/);
assert.match(patientGuard, /!paciente \|\| paciente\.acesso_painel === false/);
assert.doesNotMatch(patientGuard, /auth\.signOut/, "falha temporária do guard de paciente não encerra a sessão");

const logout = auth.match(/export function configurarBotaoSair\([\s\S]*?(?=\nexport function mostrarFlash)/)?.[0];
assert.ok(logout, "logout deve existir");
assert.match(logout, /await supabase\.auth\.signOut\(\)/);
assert.match(logout, /logoutPending/);
assert.match(logout, /signOut\(\{ scope: "local" \}\)/);
assert.match(logout, /data-private-content/);

assert.match(loginHtml, /signInWithPassword/);
assert.match(loginHtml, /destino\?\.erro === "temporario"/, "falha temporária de consulta não deve disparar logout local");
assert.match(loginHtml, /destino\?\.erro === "temporario"/, "falha temporária de consulta não deve disparar logout local");
assert.match(loginHtml, /destino\?\.erro === "temporario"/, "falha temporária de consulta não deve disparar logout local");
assert.match(loginHtml, /Não foi possível entrar com essas credenciais/);
assert.match(loginHtml, /botao\.disabled = false/);
assert.match(loginHtml, /sistema de login não conseguiu carregar/);
assert.doesNotMatch(loginHtml, /console\.error\(/, "login não deve despejar objetos de erro no console");
assert.doesNotMatch(auth, /SUPABASE_SERVICE_ROLE_KEY\s*=|sb_secret_[A-Za-z0-9]+/i, "segredos privilegiados não podem aparecer no frontend");
assert.ok(sidebar.includes('import { escapeHtml } from "/painel/assets/js/sanitize.js";'));
assert.ok(sidebar.includes('${escapeHtml(nome)}'), "nome de perfil não deve entrar cru em innerHTML");
assert.ok(patientPanel.includes('data-baixar="${escapeHtml(d.file_url)}"'), "caminho do arquivo deve ser escapado no atributo HTML");
assert.ok(patientPanel.includes('u.origin === window.location.origin || u.protocol === "https:"'), "URLs externas HTTP não devem ser aceitas como links de prontuário");
assert.ok(publicSupabaseClient.includes("@supabase/supabase-js@2.117.3/+esm"), "SDK Supabase deve usar uma versão exata");
assert.ok(!publicSupabaseClient.includes("@supabase/supabase-js@2/+esm"), "SDK Supabase não deve usar versão flutuante");
assert.ok(auth.includes("@supabase/supabase-js@2.117.3/+esm"), "SDK Supabase do painel deve usar versão exata");
assert.ok(edgeFunctionSources.every((source) => source.includes("jsr:@supabase/supabase-js@2.117.3")), "Edge Functions devem usar versão exata do SDK");
assert.ok(edgeFunctionSources[2].includes("const MANIFEST_URLS = ["), "reconciliar-publicacao deve manter fallback de manifesto");
assert.ok(edgeFunctionSources[2].includes("const normalizarPath ="), "reconciliar-publicacao deve normalizar caminhos do manifesto");
assert.ok(edgeFunctionSources[2].includes("httpStatus >= 200 && httpStatus < 400"), "reconciliação publicada deve validar o status HTTP");
assert.ok(edgeFunctionSources[2].includes("manifest_errors: manifestErrors"), "falha em todos os manifestos deve expor diagnóstico sem confirmar publicação");
assert.ok(edgeFunctionSources.every((source) => !source.includes("jsr:@supabase/supabase-js@2\"")), "Edge Functions não devem usar versão flutuante");
assert.ok(sharedSanitize.includes("raw.startsWith('//')"), "safeUrl deve rejeitar URLs protocol-relative antes de resolver a URL");
assert.ok(sharedSanitize.includes("url.origin === window.location.origin || url.protocol === 'https:'"), "safeUrl deve rejeitar HTTP externo");
assert.ok(richTextSanitize.indexOf("limparNo(filho);") < richTextSanitize.indexOf("while (filho.firstChild)"), "sanitizador deve limpar descendentes antes de desanexá-los");
assert.ok(adminPolicyMigration.includes("ALTER POLICY %I ON %I.%I TO authenticated"), "políticas administrativas devem ser limitadas a authenticated");
assert.ok(adminPolicyMigration.includes("admin_full_access_testimonials"), "migração deve corrigir a política administrativa de depoimentos");
assert.ok(adminPolicyMigration.includes("documentos_admin_gerencia"), "migração deve limitar política administrativa do bucket privado");
assert.ok(adminPolicyMigration.includes("documentos_paciente_le_anamnese"), "migração deve limitar leitura/admin do bucket privado a authenticated");
assert.ok(adminPolicyMigration.includes("site_media_admin_gerencia"), "migração deve limitar política administrativa do bucket público");
assert.ok(adminPolicyMigration.includes("schemaname IN ("), "migração deve abranger os schemas public e storage");
const expectedAdminPolicyNames = [
  "admin_full_access_announcements", "admin_full_access_appointments", "admin_gerencia_configuracoes",
  "admin_read_content_ids", "admin_full_access_contracts", "admin_reads_consents",
  "admin_full_access_financial_transactions", "admin_full_access_medical_records", "admin_full_access_patients",
  "admin_full_access_photo_records", "admin_gerencia_pre_atendimentos", "admin_full_access_profiles",
  "admin_insert_publication_requests", "admin_read_publication_requests", "admin_update_publication_requests",
  "admin_full_access_documents", "support_documents_admin_all", "admin_full_access_testimonials",
  "documentos_admin_gerencia", "documentos_paciente_le_anamnese", "site_media_admin_gerencia",
];
for (const policyName of expectedAdminPolicyNames) {
  assert.ok(adminPolicyMigration.includes(policyName), "migration deve cobrir política administrativa: " + policyName);
}
assert.ok(adminPolicyMigration.includes("admin_gerencia_pre_atendimentos"), "migração deve corrigir a política administrativa de pré-atendimentos");
assert.ok(contractAdmin.includes("editor.innerHTML = sanitizeRichHtml(substituirDadosPaciente(modelo.content_html || \"\", paciente));"), "modelo de contrato deve ser sanitizado antes de entrar no editor");
assert.ok(contractPdf.includes('import { sanitizeRichHtml } from "/assets/js/rich-text.js";'), "PDF deve usar o sanitizador compartilhado");
assert.ok(contractPdf.includes("div.innerHTML = sanitizeRichHtml(String(html ?? \"\"));"), "PDF deve sanitizar snapshot antes de analisar HTML");
assert.ok(signaturePathMigration.includes("contracts_signature_path_own_patient_check"), "migration deve restringir assinatura de contrato ao paciente dono");
assert.ok(signaturePathMigration.includes("length(signed_content_html) <= 100000"), "snapshot assinado deve ter limite no banco");
assert.ok(signaturePathMigration.includes("anamnesis_signatures_signature_path_own_patient_check"), "migration deve restringir assinatura de anamnese ao paciente dono");
assert.ok(anamnesisConceptMigration.includes("NEW.clinical_concept_id := v_concept_id;"), "conceito clínico deve ser derivado da pergunta cadastrada");
assert.ok(anamnesisConceptMigration.includes("BEFORE INSERT ON public.anamnesis_responses"), "trigger deve validar toda nova resposta de anamnese");
assert.ok(submitAnamnesisMigration.includes("select v_target_version_id,qd.id,qd.clinical_concept_id"), "RPC deve derivar o conceito da pergunta cadastrada");
assert.ok(!submitAnamnesisMigration.includes("nullif(r->>'clinical_concept_id','')::uuid"), "RPC não deve confiar no conceito enviado pelo navegador");
assert.ok(submitAnamnesisMigration.includes("qd.clinical_concept_id is not null"), "invalidação de conceitos atuais deve usar o mapeamento confiável");
assert.ok(submitAnamnesisMigration.includes("Caminho de assinatura inválido"), "RPC deve validar caminho da assinatura do próprio paciente");
assert.ok(submitAnamnesisMigration.includes("octet_length(p_responses::text) > 200000"), "payload da anamnese deve ter limite de tamanho");
assert.ok(submitAnamnesisMigration.includes("octet_length(coalesce(r->'value', 'null'::jsonb)::text) > 10000"), "cada resposta deve ter limite de tamanho");
assert.ok(botSource.includes('client.rpc("create_bot_conversation"'), "bot público deve criar conversas pela RPC");
assert.ok(!botSource.includes('.from("bot_conversations")\n        .insert('), "bot não deve depender de INSERT com SELECT em tabela sem policy pública de leitura");
assert.ok(botLoggingMigration.includes("REVOKE INSERT ON public.bot_conversations FROM PUBLIC, anon, authenticated"), "migration deve bloquear INSERT direto em conversas");
assert.ok(botLoggingMigration.includes("public.bot_session_matches(conversation_id, session_id)"), "mensagens devem validar a sessão associada à conversa");
assert.ok(botLoggingMigration.includes("CHECK (length(message) <= 4000)"), "mensagens do bot devem ter tamanho máximo no banco");
assert.ok(botLoggingMigration.includes("CHECK (sender IN ('visitor', 'bot', 'system'))"), "sender do bot deve aceitar apenas valores conhecidos");
assert.ok(intakeValidationMigration.includes("NEW.status := 'novo';"), "status de pré-atendimento deve ser definido no servidor");
assert.ok(intakeValidationMigration.includes("NEW.created_at := now();"), "timestamp do pré-atendimento deve ser definido no servidor");
assert.ok(intakeValidationMigration.includes("length(NEW.observacoes) > 4000"), "campos públicos do pré-atendimento devem ter limite de tamanho");
assert.ok(intakeValidationMigration.includes("SET search_path TO pg_catalog, public"), "trigger do pré-atendimento deve fixar search_path");
assert.ok(anamnesisWriteMigration.includes('DROP POLICY IF EXISTS "patient writes own responses"'), "pacientes devem gravar respostas somente pelo RPC");
assert.ok(anamnesisWriteMigration.includes('DROP POLICY IF EXISTS "patient signs own anamnesis"'), "pacientes devem gravar assinaturas somente pelo RPC");
assert.ok(patientAnamnesis.includes('supabase.rpc("submit_anamnesis"'), "formulário de anamnese deve usar RPC autorizada");
assert.ok(!patientAnamnesis.includes('supabase.from("anamnesis_responses").insert'), "formulário não deve inserir respostas diretamente");
assert.ok(!patientAnamnesis.includes('supabase.from("anamnesis_signatures").insert'), "formulário não deve inserir assinaturas diretamente");
assert.ok(attachmentPolicyMigration.includes("v.status = 'draft'"), "anexos do paciente devem exigir versão editável");
assert.ok(attachmentPolicyMigration.includes("ep.status = 'active'"), "anexos após submissão exigem permissão ativa");
assert.ok(attachmentPolicyMigration.includes('"admin uploads anamnesis attachments"'), "painel administrativo deve poder anexar a uma versão existente");
assert.ok(adminAnamnesisDraft.includes('supabase.from("anamnesis_attachments").insert'), "fluxo administrativo de anexos deve ser preservado");
assert.ok(botLoggingMigration.includes("SET search_path TO pg_catalog, public"), "RPCs do bot devem fixar search_path");
assert.ok(botLoggingMigration.includes("position(chr(92) in p_page_path) > 0"), "RPC do bot deve rejeitar barra invertida no caminho");
assert.ok(botLoggingMigration.includes("p_page_path ~ '[[:cntrl:]]'"), "RPC do bot deve rejeitar caracteres de controle no caminho");
assert.ok(anamnesisConceptMigration.includes("SET search_path TO pg_catalog, public"), "trigger SECURITY DEFINER deve fixar search_path seguro");
assert.ok(contractAdmin.includes("const signatureUrl = safeUrl(data?.signedUrl);"), "URL da assinatura deve ser validada antes da interpolação");
assert.ok(contractAdmin.includes('src="${escapeHtml(signatureUrl)}"'), "URL da assinatura deve ser escapada no atributo HTML");
assert.ok(!adminPolicyMigration.includes("anyone_can_insert_consent"), "migração não deve remover o INSERT público legítimo de consentimento");
assert.ok(adminPolicyMigration.includes("roles @> ARRAY["), "migração deve alterar somente políticas atualmente destinadas a PUBLIC");
assert.ok(publicArticlePage.includes("const imagemConteudo = safeUrl(data.cover_image_url);"), "página pública de artigo deve validar URL da imagem");
assert.ok(publicTreatmentPage.includes("const imagemConteudo = safeUrl(data.cover_image_url);"), "página pública de tratamento deve validar URL da imagem");
assert.ok(!publicArticlePage.includes('src="${data.cover_image_url}"'), "artigo não deve interpolar URL de imagem crua");
assert.ok(!publicTreatmentPage.includes('src="${data.cover_image_url}"'), "tratamento não deve interpolar URL de imagem crua");
assert.ok(publicArticlePage.includes('escapeHtml(data.treatments.name)'), "nome do tratamento no artigo deve ser escapado");
assert.ok(publicArticlePage.includes('href="${escapeHtml(ctaUrl)}"'), "CTA do artigo deve escapar URL no atributo HTML");
assert.ok(publicTreatmentPage.includes('href="${escapeHtml(ctaUrl)}"'), "CTA do tratamento deve escapar URL no atributo HTML");

for (const page of chartPages) {
  assert.ok(page.includes("https://cdn.jsdelivr.net/npm/chart.js@4.5.1"), "Chart.js deve usar uma versão exata");
  assert.doesNotMatch(page, /chart\.js@4"/, "não deve permanecer uma referência flutuante do Chart.js");
}

console.log("Segurança estática da autenticação: OK — guards, fail-closed, login, logout e ausência de chaves privilegiadas.");
