# Auditoria de segurança — Especialista em Pele

**Status:** em andamento; esta documentação registra evidências observadas e não representa certificação de segurança nem conformidade jurídica.
**Repositório:** `especialistapele/siteoficialespecialistaempele`
**Branch de trabalho:** `security/audit-hardening`
**Projeto Supabase verificado:** `clwaotfbqwvxpykruwed` (Especialista)
**Última verificação do banco:** 11/10/2026

## Resumo executivo

A auditoria inicial encontrou uma falha confirmada no direcionamento do login: `resolverDestino()` podia aceitar um resultado sem cadastro de paciente porque só verificava se `acesso_painel` era diferente de `false`. Também foram identificadas melhorias necessárias no tratamento de falhas de consulta, no logout e nas mensagens do login.

As primeiras correções foram aplicadas nesta branch, sem alterar `main` nem executar migrações no banco. A auditoria do Supabase identificou que RLS está habilitado nas tabelas consultadas do schema `public` e nas tabelas de `storage`; isso é positivo, mas não prova por si só que cada política está correta. O Security Advisor reporta proteção contra senhas comprometidas desabilitada e nove funções `SECURITY DEFINER` executáveis por usuários autenticados. As funções devem continuar sob revisão individual: esse alerta não prova, isoladamente, uma exploração, e várias funções verificadas fazem checagens explícitas de administrador ou propriedade.

## Achados

### SEC-001 — Direcionamento de paciente sem cadastro válido
- **Gravidade:** média (controle de acesso no frontend; RLS permanece a barreira de segurança real).
- **Status:** corrigido na branch; aguardando testes automatizados.
- **Evidência:** em `painel/assets/js/painel-auth.js`, a condição anterior `paciente?.acesso_painel !== false` podia ser verdadeira quando `paciente` era nulo.
- **Impacto plausível:** tentativa de encaminhar usuário sem vínculo válido à página do paciente; a exposição de dados dependeria também das políticas RLS e dos controles da página.
- **Correção:** exige identificador de usuário válido, consulta sem erro, cadastro de paciente existente e ausência de bloqueio explícito. Falha de consulta retorna um marcador temporário distinto de `null`, para que o login não encerre a sessão indevidamente; ausência de cadastro/bloqueio retorna `null`.
- **Risco residual:** o navegador não substitui autorização no banco/backend.

### SEC-002 — Guards encerravam a sessão em falhas de consulta
- **Gravidade:** baixa a média (disponibilidade/experiência e tratamento de erro).
- **Status:** corrigido na branch; aguardando testes.
- **Evidência:** as implementações anteriores chamavam `signOut()` para qualquer erro de consulta de perfil/paciente, sem separar indisponibilidade temporária de ausência de autorização.
- **Correção:** os guards agora falham fechados e distinguem erro de consulta (redirecionamento temporário) de perfil ausente/sem papel adequado ou paciente bloqueado. A falha de banco não concede acesso nem encerra automaticamente a sessão.
- **Risco residual:** validar em navegador com sessões de teste e indisponibilidade simulada.

### SEC-003 — Logout e mensagens de autenticação
- **Gravidade:** baixa a média.
- **Status:** endurecimento implementado na branch; aguardando testes.
- **Evidência:** o logout anterior não aguardava nem verificava o resultado de `signOut()`; o login registrava o objeto completo de erro no console e usava mensagens distintas para algumas falhas.
- **Correção:** espera a operação, impede cliques duplicados, tenta encerrar a sessão local em falha, limpa elementos marcados `data-private-content` e redireciona para a tela de login. Mensagens de credenciais são genéricas e erros técnicos não são despejados no console.
- **Risco residual:** páginas privadas devem marcar conteúdo sensível com `data-private-content` quando for necessário limpá-lo antes do redirecionamento; os guards e RLS continuam obrigatórios.

### SEC-009 — Dados de perfil e caminhos de arquivo inseridos em HTML
- **Gravidade:** baixa a média; sink de XSS potencial identificado e endurecido.
- **Status:** corrigido na branch; aguardando teste.
- **Evidência:** `painel/assets/js/admin-sidebar.js` inseria o nome e as iniciais do perfil diretamente em `innerHTML`; `painel/paciente/painel.html` inseria `support_documents.file_url` em um atributo HTML sem escape e aceitava links externos com protocolo HTTP no botão do prontuário.
- **Correção:** escapar nome/iniciais na sidebar, escapar o caminho do arquivo no atributo e aceitar somente HTTPS para links externos (mantendo URLs relativas/mesma origem).
- **Impacto plausível:** caso valores maliciosos cheguem a esses campos por importação, configuração ou outro fluxo, poderiam alterar o HTML renderizado. A revisão não confirmou um caminho de escrita pública para esses campos; portanto, o achado foi tratado como sink potencial, não como exploração comprovada.
- **Risco residual:** continuar rastreando todos os usos de `innerHTML` e validar as fontes de dados e atributos de URL em cada módulo.

### SEC-004 — Proteção contra senhas comprometidas desabilitada
- **Gravidade:** média (endurecimento de autenticação).
- **Status:** confirmado no Supabase Security Advisor; requer configuração manual/validação no painel Supabase.
- **Evidência:** advisor `auth_leaked_password_protection` indica que a proteção contra senhas vazadas está desabilitada.
- **Impacto:** senhas conhecidas em vazamentos podem ser aceitas, conforme as demais regras de senha.
- **Ação recomendada:** habilitar proteção contra senhas comprometidas no ambiente Supabase após avaliar compatibilidade e fluxo de redefinição. Não foi alterada configuração de produção nesta etapa.
- **Referência:** https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

### SEC-005 — Funções SECURITY DEFINER expostas a authenticated
- **Gravidade:** média, sob revisão; não classificado como exploração confirmada.
- **Status:** alerta do Security Advisor confirmado; revisão de código parcial.
- **Evidência:** o advisor listou `admin_stats()`, `admin_storage_stats()`, duas sobrecargas de `assinar_contrato(...)`, `grant_anamnesis_edit(...)`, `is_admin()`, `release_anamnesis(...)`, `save_anamnesis_draft(...)` e `submit_anamnesis(...)` como funções `SECURITY DEFINER` executáveis por `authenticated`.
- **Observações:** a implementação consultada de `is_admin()` verifica `profiles.id = auth.uid()` e `role = 'admin'`. Os corpos consultados de funções administrativas verificam administrador; as funções de assinatura/envio consultam o vínculo com o próprio paciente. Isso reduz o risco, mas é necessário concluir revisão de todos os corpos, privilégios efetivos, argumentos, retornos e cenários negativos.
- **Ação recomendada:** restringir `EXECUTE` quando a função não precisar ser chamada diretamente por pacientes autenticados; não revogar em bloco sem mapear os fluxos legítimos.
- **Referência:** https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable

### SEC-006 — Limites de upload ausentes no bucket privado
- **Gravidade:** média (abuso de recursos e validação de arquivo).
- **Status:** configuração observada; requer decisão e configuração no Supabase.
- **Evidência:** o bucket `documentos-pacientes` está privado, mas `file_size_limit` e `allowed_mime_types` aparecem como nulos.
- **Impacto plausível:** uploads excessivamente grandes ou tipos de arquivo inesperados podem aumentar risco operacional, de armazenamento e de processamento.
- **Ação recomendada:** definir tamanho máximo e tipos permitidos com base nos documentos e assinaturas realmente aceitos; validar tipo/tamanho também no fluxo de upload. Não alterado em produção.

### SEC-007 — CORS amplo nas Edge Functions
- **Gravidade:** informativa por si só; avaliar em conjunto com autenticação e abuso.
- **Status:** observado em funções consultadas.
- **Evidência:** `create-patient`, `reconciliar-publicacao` e `disparar-publicacao` respondem com `Access-Control-Allow-Origin: *`. As três têm `verify_jwt: true` no inventário de funções e o código consultado verifica usuário autenticado e papel de administrador antes das operações privilegiadas.
- **Interpretação:** CORS não substitui autenticação e o wildcard não comprova, sozinho, acesso indevido. Recomenda-se limitar origens quando compatível com os clientes existentes, sem confiar nisso como controle de autorização.

### SEC-008 — Políticas RLS redundantes em tabelas de pacientes
- **Gravidade:** baixa a média, revisão pendente.
- **Status:** observado; não foi feita alteração no banco.
- **Evidência:** há políticas permissivas sobrepostas em tabelas como `medical_records`, `financial_transactions`, `announcements` e `support_documents`, algumas com predicados `patient_id = auth.uid()` além de políticas que relacionam `patient_id` ao registro em `patients`. A contagem agregada atual mostra 5/5 pacientes com `id = user_id`, sem registros divergentes.
- **Impacto plausível:** políticas permissivas combinam-se por OR; duplicações podem causar confusão futura e uma política simplificada pode ampliar acesso se a relação de IDs mudar.
- **Ação recomendada:** testar com duas contas fictícias e simplificar apenas após confirmar todos os fluxos e chaves de propriedade. Nenhum teste de acesso cruzado foi executado contra contas reais e nenhuma política foi alterada.

### SEC-010 — Privilégios de tabela excessivos para anon e authenticated
- **Gravidade:** média, com impacto potencial elevado; exploração direta por API REST não confirmada.
- **Status:** configuração confirmada; script de correção proposto para revisão, não executado.
- **Evidência:** consulta de privilégios efetivos encontrou `TRUNCATE` concedido a `anon` e `authenticated` nas 38 tabelas de `public`. A ACL de `patients`, `profiles` e `medical_records` também inclui `REFERENCES`, `TRIGGER` e `MAINTAIN` para ambas as roles. Uma consulta separada confirmou que as permissões são concessões explícitas às roles, não apenas herdadas de `PUBLIC`. Os privilégios padrão de criação de tabelas para `postgres` e `supabase_admin` também concedem esse conjunto de privilégios às roles cliente.
- **Impacto:** RLS não restringe `TRUNCATE`; `TRIGGER`, `REFERENCES` e `MAINTAIN` são privilégios administrativos de tabela desnecessários para o uso normal do frontend. Não foi identificado caminho de API REST que permita executar `TRUNCATE` diretamente, então não classifico o achado como exploração confirmada.
- **Correção proposta:** `docs/sql/REVIEW_ONLY_revoke_excessive_client_table_privileges.sql` propõe revogar somente `TRUNCATE`, `REFERENCES`, `TRIGGER` e `MAINTAIN` de `anon` e `authenticated` nas tabelas atuais de `public`, ajustar os privilégios padrão para tabelas futuras criadas por `postgres` e `supabase_admin` e retirar `EXECUTE` padrão de novas funções criadas por `supabase_admin`. Privilégios DML que dependem de RLS são preservados.
- **Validação necessária antes de executar:** revisar em ambiente de teste, validar os fluxos legítimos e conferir as permissões pós-aplicação. Nenhum privilégio foi alterado no banco conectado.
- **Risco residual:** a proposta ainda não foi aplicada nem testada em ambiente de homologação; as mudanças de privilégios padrão devem ser validadas com os responsáveis pela administração do projeto.

## Escopo verificado até aqui

- Branch principal identificada como `main`; branch de auditoria criada separadamente.
- Arquivos revisados: `painel/assets/js/painel-auth.js`, `painel/index.html`, `painel/assets/js/sanitize.js`, `painel/assets/js/admin-sidebar.js`, `painel/assets/js/notifications.js`, `assets/js/rich-text.js`, `painel/admin/dashboard.html`, `painel/admin/pacientes.html`, `painel/admin/documentos.html`, `painel/admin/agenda.html`, `painel/admin/financeiro.html`, `painel/admin/paciente.html`, `painel/paciente/painel.html`, `painel/paciente/anamnese.html`, `robots.txt`.
- `sanitize.js` oferece `escapeHtml()` e `safeUrl()`; ainda falta rastrear o uso de ambos em todos os renderizadores.
- Supabase: listagem de tabelas, status RLS, políticas relevantes, buckets, grants efetivos para roles cliente e Security Advisor; inspeção parcial de três Edge Functions e dos corpos de funções SQL selecionadas.
- Todas as tabelas listadas nos schemas `public` e `storage` retornaram RLS habilitado na consulta de metadados. Isso não é uma prova de que cada política seja correta, nem testa privilégios reais por role.
- Bucket `documentos-pacientes`: privado. Bucket `site-media`: público, comportamento compatível com mídia pública se intencional.
- O SDK Supabase é importado de CDN com versão especificada `@2.117.2`. A integridade da cadeia de suprimentos e a disponibilidade/versionamento efetivo da CDN ainda precisam ser avaliados.
- `robots.txt` bloqueia rastreamento de `/painel/`; isso não é controle de acesso.
- A chave `anon` presente no frontend é pública por desenho e não foi classificada como segredo privilegiado. Não foi encontrado uso de `service_role` no arquivo de autenticação revisado.

## Testes

- **Adicionado:** `tests/painel-auth-security.mjs`, com verificações estáticas de fail-closed, guards, logout, mensagens genéricas, parsing do script inline, ausência de chave privilegiada no frontend e escaping dos sinks identificados.
- **Pendente de execução:** o teste estático no CI e testes manuais no navegador com contas fictícias.
- **Pendente:** teste real de isolamento A/B via RLS, tentativas de modificar papel, validação de upload e testes de falha de conexão. Não foram executadas operações de escrita no banco.
- **Proposta SQL de revisão:** `docs/sql/REVIEW_ONLY_revoke_excessive_client_table_privileges.sql`; não é uma migração aplicada nem deve ser executada antes de revisão e autorização.

## Matriz de riscos pendentes

| ID | Prioridade | Item | Próximo passo |
|---|---|---|---|
| SEC-004 | Média | Proteção de senha vazada desabilitada | Configurar no Supabase após validar fluxo |
| SEC-005 | Média | Funções SECURITY DEFINER | Revisar grants e cenários negativos função a função |
| SEC-006 | Média | Limites de upload ausentes | Definir limites e tipos permitidos |
| SEC-007 | Informativo | CORS amplo nas Edge Functions | Restringir origens se compatível, mantendo autenticação como controle real |
| SEC-008 | Média | Políticas RLS redundantes | Testes de isolamento com contas fictícias e proposta de migração |
| SEC-009 | Baixa/média | Sinks de HTML potencialmente inseguros | Correções aplicadas; aguardar teste e continuar rastreamento |
| SEC-010 | Média / impacto potencial elevado | TRUNCATE/TRIGGER/REFERENCES/MAINTAIN concedidos às roles cliente | Revisar e testar o SQL proposto antes de aplicar
| SEC-011 | Alta potencial | Auditoria de todas as páginas privadas | Inventariar guards e consultas em todo o repositório |
| SEC-012 | Média | Segredos no histórico Git | Executar varredura dedicada e documentar rotação se necessário |
| SEC-013 | Média | Cabeçalhos/HTTPS/cache | Confirmar hospedagem e configuração efetiva fora do repositório |
| SEC-014 | Média | Dependências e Actions | Inventariar workflows, versões de actions, lockfiles e executar scanners |

## Limitações e próximos passos

- Não foram aplicadas migrações nem alterações de configuração ao banco de produção.
- A listagem de metadados e o advisor não substituem testes de autorização usando identidades distintas.
- Ainda é necessário completar o inventário de todas as páginas, scripts, workflows, dependências e histórico Git, bem como revisar os demais endpoints.
- Avaliar juridicamente retenção, consentimento, compartilhamento e procedimentos de incidentes LGPD; esta auditoria técnica não certifica conformidade legal.
- As alterações desta branch devem permanecer em revisão até que os testes e o relatório sejam concluídos.
