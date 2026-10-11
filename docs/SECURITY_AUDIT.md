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
- **Status:** corrigido na branch; testes estáticos aprovados; validação manual no navegador pendente.
- **Evidência:** em `painel/assets/js/painel-auth.js`, a condição anterior `paciente?.acesso_painel !== false` podia ser verdadeira quando `paciente` era nulo.
- **Impacto plausível:** tentativa de encaminhar usuário sem vínculo válido à página do paciente; a exposição de dados dependeria também das políticas RLS e dos controles da página.
- **Correção:** exige identificador de usuário válido, consulta sem erro, cadastro de paciente existente e ausência de bloqueio explícito. Falha de consulta retorna um marcador temporário distinto de `null`, para que o login não encerre a sessão indevidamente; ausência de cadastro/bloqueio retorna `null`.
- **Risco residual:** o navegador não substitui autorização no banco/backend.

### SEC-002 — Guards encerravam a sessão em falhas de consulta
- **Gravidade:** baixa a média (disponibilidade/experiência e tratamento de erro).
- **Status:** corrigido na branch; testes estáticos aprovados; validação manual pendente.
- **Evidência:** as implementações anteriores chamavam `signOut()` para qualquer erro de consulta de perfil/paciente, sem separar indisponibilidade temporária de ausência de autorização.
- **Correção:** os guards agora falham fechados e distinguem erro de consulta (redirecionamento temporário) de perfil ausente/sem papel adequado ou paciente bloqueado. A falha de banco não concede acesso nem encerra automaticamente a sessão.
- **Risco residual:** validar em navegador com sessões de teste e indisponibilidade simulada.

### SEC-003 — Logout e mensagens de autenticação
- **Gravidade:** baixa a média.
- **Status:** endurecimento implementado na branch; testes estáticos aprovados; validação manual pendente.
- **Evidência:** o logout anterior não aguardava nem verificava o resultado de `signOut()`; o login registrava o objeto completo de erro no console e usava mensagens distintas para algumas falhas.
- **Correção:** espera a operação, impede cliques duplicados, tenta encerrar a sessão local em falha, limpa elementos marcados `data-private-content` e redireciona para a tela de login. Mensagens de credenciais são genéricas e erros técnicos não são despejados no console.
- **Risco residual:** páginas privadas devem marcar conteúdo sensível com `data-private-content` quando for necessário limpá-lo antes do redirecionamento; os guards e RLS continuam obrigatórios.

### SEC-009 — Dados de perfil e caminhos de arquivo inseridos em HTML
- **Gravidade:** baixa a média; sink de XSS potencial identificado e endurecido.
- **Status:** corrigido na branch; testes estáticos aprovados; validação manual pendente.
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
- **Evidência:** a consulta encontrou 87 políticas em `public` e múltiplas políticas permissivas de SELECT em cinco tabelas: `anamnesis_attachments`, `announcements`, `financial_transactions`, `medical_records` e `support_documents`. Em quatro delas existem predicados `patient_id = auth.uid()` além de políticas que relacionam `patient_id` ao registro em `patients`. A consulta agregada encontrou cinco registros em que `patients.id = patients.user_id`; isso não significa que todos os pacientes tenham essa igualdade. Não foi feito teste de acesso cruzado.
- **Impacto plausível:** políticas permissivas combinam-se por OR; duplicações podem causar confusão futura e uma política simplificada pode ampliar acesso se a relação de IDs mudar.
- **Ação recomendada:** testar com duas contas fictícias e simplificar apenas após confirmar todos os fluxos e chaves de propriedade. Nenhum teste de acesso cruzado foi executado contra contas reais e nenhuma política foi alterada.

### SEC-010 — Privilégios de tabela excessivos para anon e authenticated
- **Gravidade:** média, com impacto potencial elevado; exploração direta por API REST não confirmada.
- **Status:** configuração confirmada; script de correção proposto para revisão, não executado.
- **Evidência:** consulta de privilégios efetivos encontrou `TRUNCATE` concedido a `anon` e `authenticated` nas 38 tabelas de `public`. A ACL de `patients`, `profiles` e `medical_records` também inclui `REFERENCES`, `TRIGGER` e `MAINTAIN` para ambas as roles. Além disso, `SELECT/INSERT/UPDATE/DELETE` estão concedidos amplamente a ambas as roles nas tabelas; no momento, RLS restringe as linhas e as políticas observadas não mostram leitura pública de prontuários. Uma consulta separada confirmou que as permissões são concessões explícitas às roles, não apenas herdadas de `PUBLIC`. Os privilégios padrão de criação de tabelas para `postgres` e `supabase_admin` também concedem esse conjunto de privilégios às roles cliente.
- **Impacto:** RLS não restringe `TRUNCATE`; `TRIGGER`, `REFERENCES` e `MAINTAIN` são privilégios administrativos de tabela desnecessários para o uso normal do frontend. Não foi identificado caminho de API REST que permita executar `TRUNCATE` diretamente, então não classifico o achado como exploração confirmada.
- **Correção proposta:** `docs/sql/REVIEW_ONLY_revoke_excessive_client_table_privileges.sql` propõe revogar somente `TRUNCATE`, `REFERENCES`, `TRIGGER` e `MAINTAIN` de `anon` e `authenticated` nas tabelas atuais de `public`, ajustar os privilégios padrão para tabelas futuras criadas por `postgres` e `supabase_admin` e retirar `EXECUTE` padrão de novas funções criadas por `supabase_admin`. Privilégios DML que dependem de RLS são preservados.
- **Validação necessária antes de executar:** revisar em ambiente de teste, validar os fluxos legítimos e conferir as permissões pós-aplicação. Nenhum privilégio foi alterado no banco conectado.
- **Risco residual:** a proposta ainda não foi aplicada nem testada em ambiente de homologação; as mudanças de privilégios padrão devem ser validadas com os responsáveis pela administração do projeto.

### SEC-015 — Dependências externas com versões flutuantes
- **Gravidade:** baixa (risco de cadeia de suprimentos e reprodutibilidade).
- **Status:** corrigido na branch; teste automatizado incluído.
- **Evidência:** três páginas administrativas carregavam `https://cdn.jsdelivr.net/npm/chart.js@4`; o cliente público importava `@supabase/supabase-js@2/+esm`; e as três Edge Functions importavam `jsr:@supabase/supabase-js@2`, deixando a versão variar dentro da linha major.
- **Correção:** referências do Chart.js alteradas para `4.5.1` em `painel/admin/dashboard.html`, `painel/admin/paciente.html` e `painel/admin/configuracoes.html`; o SDK Supabase foi fixado em `2.117.3` no cliente público, no painel e nas três Edge Functions. O workflow desta branch usa versões de release específicas de `actions/checkout` e `actions/setup-node` e testa os pins.
- **Referências upstream:** https://github.com/chartjs/Chart.js/releases ; https://jsr.io/@supabase/supabase-js/versions ; https://github.com/supabase/supabase-js/blob/master/packages/core/supabase-js/CHANGELOG.md ; https://github.com/actions/checkout/releases ; https://github.com/actions/setup-node/releases
- **Risco residual:** não foi possível concluir uma varredura de todos os scripts externos no repositório nem auditar todos os workflows existentes; pinning por versão não substitui SRI ou revisão da cadeia de suprimentos.

### SEC-016 — Formulário público de pré-atendimento sem controle de abuso no servidor
- **Gravidade:** média (risco de spam/abuso e tratamento de dados pessoais sensíveis).
- **Status:** risco potencial confirmado na implementação; correção depende de arquitetura/backend.
- **Evidência:** `pre-atendimento/index.html` grava diretamente na tabela `pre_atendimentos` via Supabase client. A política RLS permite `INSERT` para `public` com `WITH CHECK (true)`. O formulário solicita queixa de pele, tratamentos anteriores, medicamentos e condições de saúde; não foram encontrados CAPTCHA, rate limit ou limites explícitos de comprimento nos campos, nem validação de entrada no servidor no caminho observado.
- **Impacto plausível:** envio automatizado em massa, registros muito grandes ou lixo e coleta de dados de saúde sem salvaguardas suficientes. Não foi identificado acesso público de leitura aos registros nessa revisão.
- **Correção recomendada:** migrar a inserção para uma Edge Function com validação server-side, limites de comprimento/tipo, proteção antiabuso e rate limit; avaliar honeypot/CAPTCHA conforme o risco. Revisar aviso de privacidade e base legal para dados de saúde com assessoria adequada. Não foi alterada a política pública nem publicada função nova.
- **Risco residual:** o cliente pode ser contornado; validação HTML sozinha não resolve o abuso.

### SEC-017 — Objetos sem referência em bucket público de mídia
- **Gravidade:** média potencial, sem exposição indevida confirmada.
- **Status:** inventário agregado concluído; revisão do conteúdo e destino pendente. Nenhum objeto foi aberto, movido ou excluído.
- **Evidência:** o bucket `site-media` é público. A contagem agregada encontrou 91 objetos sob `resultados/`, dos quais 87 são referenciados pelos campos legados de resultados ou por `result_images`; 4 não têm referência encontrada. Sob `tratamentos/`, 19 de 26 objetos são referenciados e 7 não têm referência encontrada. Os registros de resultados que referenciam os 87 objetos verificados estavam publicados e com consentimento confirmado.
- **Impacto plausível:** objetos órfãos continuam acessíveis publicamente enquanto estiverem no bucket público, mesmo sem referência atual no banco. Os metadados não revelam se os 11 objetos sem referência são material público antigo ou imagens de pacientes.
- **Correção recomendada:** revisar visualmente e documentalmente os objetos órfãos; confirmar consentimento e finalidade. Remover somente após confirmação de que não são necessários, ou mover imagens não públicas para o bucket privado com política de acesso adequada.
- **Risco residual:** URLs antigas podem continuar circulando; não foi possível confirmar conteúdo/consentimento dos objetos órfãos sem inspecioná-los.

### SEC-018 — Histórico de migrations do Supabase não reconciliado com o repositório
- **Gravidade:** média (integridade/reprodutibilidade de implantação).
- **Status:** divergência de nomes/quantidade confirmada; equivalência de conteúdo ainda não determinada.
- **Evidência:** o repositório contém 34 arquivos `supabase/migrations/*.sql`; o histórico consultado no Supabase contém 39 entradas. Apenas 15 nomes de migrations coincidem após remover o prefixo de timestamp; nos 15 casos, o timestamp versionado também difere do timestamp aplicado. Vinte e quatro nomes aplicados não têm arquivo com o mesmo nome no repositório e 19 arquivos do repositório não têm nome correspondente no histórico. Isso é uma divergência de rastreabilidade, não prova de que 19 mudanças nunca foram aplicadas ou que 24 arquivos estejam ausentes em conteúdo: algumas alterações podem ter sido renomeadas, combinadas, divididas ou aplicadas manualmente. Exemplos de migrations aplicadas sem arquivo de mesmo nome incluem `revoke_is_admin_anon_execute`, `fix_treatments_admin_policy_roles` e `fix_result_images_rls_for_public_read`. Algumas diferenças podem ser equivalências semânticas/renomeações; isso ainda precisa ser comparado pelo conteúdo.
- **Impacto plausível:** reconstruções, novos ambientes ou futuras implantações podem não reproduzir o estado atual do banco ou deixar de incluir correções de segurança que foram aplicadas diretamente.
- **Correção recomendada:** reconciliar cada entrada aplicada com o SQL versionado, registrar equivalências e criar migrações incrementais revisáveis para alterações ausentes; não reexecutar migrations históricas automaticamente nem marcar versões como aplicadas sem revisão.
- **Risco residual:** não foi possível recuperar o corpo SQL histórico apenas a partir da tabela de versões; nenhuma migração foi executada ou alterada no banco.

### SEC-019 — Validação de URLs aceitava HTTP externo e URLs protocol-relative
- **Gravidade:** baixa a média (validação de URL/mixed content).
- **Status:** corrigido na branch; teste estático aprovado.
- **Evidência:** `assets/js/sanitize.js` aceitava URLs `http:` externas e, quando `allowRelative` estava ativo, retornava qualquer valor iniciado por `/`, incluindo URLs protocol-relative e caminhos com barra invertida.
- **Correção:** URLs externas agora precisam usar HTTPS; URLs da mesma origem continuam permitidas; caminhos relativos só são retornados se forem relativos à raiz, não começarem com `//` e não contiverem barra invertida.
- **Risco residual:** cada chamador ainda precisa escapar a URL no contexto HTML e avaliar se URLs externas são permitidas para aquele campo.

### SEC-020 — Código de Edge Function implantada diverge do repositório
- **Gravidade:** média (risco de regressão e falta de reprodutibilidade).
- **Status:** reconciliado no código versionado da branch com os comportamentos implantados; SDK permanece fixado em `2.117.3`; sem deploy.
- **Evidência:** comparação do código implantado com `main` mostrou `create-patient` idêntica; `disparar-publicacao` difere apenas em comentário; `reconciliar-publicacao` diverge funcionalmente. A versão implantada usa uma lista de URLs alternativas para o manifesto, normaliza caminhos e valida o status HTTP do item; esses comportamentos não aparecem no arquivo versionado.
- **Impacto plausível:** um redeploy baseado no repositório poderia substituir a versão implantada por uma implementação menos resiliente e remover comportamentos já presentes em produção.
- **Correção na branch:** o código versionado agora preserva a lista de URLs de fallback, normalização de caminhos, diagnóstico de erros do manifesto e validação do status HTTP, mantendo o SDK fixado em `2.117.3`. Foram adicionadas verificações estáticas para esses comportamentos. Não fiz deploy nem sobrescrevi o código implantado.
- **Risco residual:** a correspondência de código foi feita por comparação do arquivo implantado com a versão versionada, mas a função não foi implantada nem testada com chamadas funcionais; validar em homologação antes de qualquer redeploy.

### SEC-022 — Sanitizador de HTML podia preservar descendentes ativos de tags rejeitadas
- **Gravidade:** média (possível XSS armazenado caso conteúdo malicioso seja salvo no editor).
- **Status:** corrigido na branch; teste estático de regressão adicionado; execução do CI pendente.
- **Evidência:** em `assets/js/rich-text.js`, ao encontrar uma tag não permitida, `limparNo()` removia o wrapper e movia os nós filhos diretamente para o documento, sem sanitizá-los recursivamente. Um wrapper não permitido contendo descendentes HTML ativos poderia contornar a limpeza de atributos.
- **Correção:** sanitizar os descendentes antes de desanexá-los do wrapper não permitido; o teste estático confirma que a limpeza ocorre antes da operação de unwrap.
- **Impacto plausível:** conteúdo persistido no editor de contratos/artigos/tratamentos poderia manter nós ou atributos ativos se uma sequência de tags aninhadas explorasse o caminho de unwrap.
- **Risco residual:** a regressão é verificada estaticamente, não por teste dinâmico de navegador; realizar testes com payloads de HTML inofensivos em ambiente de homologação antes de encerrar a auditoria.

### SEC-023 — URLs de imagem e texto dinâmico sem validação/escape nas páginas públicas
- **Gravidade:** baixa a média; sinks HTML confirmados, sem exploração demonstrada.
- **Status:** corrigido na branch; testes estáticos de regressão adicionados; execução do CI pendente.
- **Evidência:** `blog/artigos/artigo-data.js` e `tratamentos/tratamento-data.js` interpolavam `cover_image_url` diretamente em atributo `src`; a página dinâmica de artigo também inseria `treatments.name` sem escape. As URLs de CTA já passavam por `safeUrl`, mas eram interpoladas sem escape explícito do atributo.
- **Correção:** validar a URL de imagem com `safeUrl()`, escapar a URL validada e o CTA no contexto do atributo HTML, e escapar o nome do tratamento no artigo. A URL usada nas metatags de imagem também passa por `safeUrl()` com fallback estático.
- **Impacto plausível:** um valor malformado ou controlado no banco poderia alterar o HTML renderizado; a revisão não demonstrou que usuários públicos possam escrever diretamente nesses campos.
- **Risco residual:** revisar os demais atributos dinâmicos e manter a validação/escape em todo caminho de publicação.

### SEC-024 — Políticas administrativas em PUBLIC chamam função sem EXECUTE para anon
- **Gravidade:** alta para disponibilidade dos fluxos públicos afetados; sem evidência de leitura indevida.
- **Status:** falha reproduzida em consulta read-only; migração proposta na branch, não aplicada.
- **Evidência dinâmica:** dentro de transação read-only, com `SET LOCAL ROLE anon`, a consulta a `public.testimonials` falhou com `permission denied for function is_admin`. A consulta de privilégios confirmou `anon` sem `EXECUTE` em `public.is_admin()`, enquanto `authenticated` tem `EXECUTE`. Em testes read-only como `anon`, a leitura de conteúdo publicado funcionou para `articles` (5 registros), `treatments` (20) e `results` com consentimento (39), mas a leitura de `testimonials` falhou com a mensagem de permissão. Um `EXPLAIN INSERT` em `pre_atendimentos` foi analisado sem execução e sem erro de planejamento; isso não confirma que a inserção seja bem-sucedida, e o INSERT real não foi testado para evitar qualquer escrita.
- **Evidência de configuração:** 18 políticas administrativas no schema `public` ainda estão destinadas ao papel `public` e chamam `is_admin()`. Como `public` inclui `anon`, o planejador pode tentar avaliar a função sem permissão e interromper consultas. O teste confirma o problema em `testimonials`; os demais fluxos afetados precisam de validação específica.
- **Correção proposta:** `supabase/migrations/20261011150000_scope_admin_rls_policies_to_authenticated.sql` muda apenas essas políticas administrativas para `authenticated`, preservando políticas públicas separadas, como leitura publicada e inserções públicas explicitamente previstas. Não foi aplicada no Supabase.
- **Risco residual:** não aplicar em produção antes de validar consultas públicas de artigos, tratamentos, resultados, depoimentos, consentimentos e pré-atendimento; confirmar também que contas administrativas continuam funcionando. As leituras públicas de artigos, tratamentos e resultados passaram; depoimentos falhou; INSERT de pré-atendimento continua sem teste.

### SEC-025 — Modelo de contrato inserido no editor sem sanitização prévia
- **Gravidade:** média (XSS potencial no contexto administrativo).
- **Status:** corrigido na branch; teste estático adicionado; CI pendente.
- **Evidência:** `painel/admin/contratos.html` inseria `document_templates.content_html` no `contenteditable` por `innerHTML` após substituir placeholders. Diferentemente dos editores de artigos/tratamentos, o conteúdo não passava por `sanitizeRichHtml()` antes de entrar no DOM. A URL de assinatura gerada pelo Storage também era interpolada diretamente em atributo `src`.
- **Correção:** sanitizar o modelo já com os dados do paciente substituídos antes de injetar no editor; validar a URL assinada com `safeUrl()` e escapar no atributo.
- **Risco residual:** templates de contrato precisam ser validados funcionalmente porque o sanitizador restringe tags/atributos a uma allowlist; testar opções interativas, assinatura, edição e geração do PDF em homologação.

## Escopo verificado até aqui

- Branch principal identificada como `main`; branch de auditoria criada separadamente.
- Inventário de páginas privadas: 17 páginas administrativas e 2 páginas de paciente (19 no total) foram examinadas; todas chamam o guard correspondente antes da primeira consulta direta observada, e não foi identificado caminho de consulta sensível antes do guard nessa varredura estática.
- Arquivos revisados em detalhe: `painel/assets/js/painel-auth.js`, `painel/index.html`, `painel/assets/js/sanitize.js`, `painel/assets/js/admin-sidebar.js`, `painel/assets/js/notifications.js`, `painel/admin/contratos.html`, `assets/js/sanitize.js`, `assets/js/supabase-client.js`, `assets/js/rich-text.js`, `blog/artigos/artigo-data.js`, `tratamentos/tratamento-data.js`, `painel/admin/dashboard.html`, `painel/admin/pacientes.html`, `painel/admin/documentos.html`, `painel/admin/agenda.html`, `painel/admin/financeiro.html`, `painel/admin/paciente.html`, `painel/paciente/painel.html`, `painel/paciente/anamnese.html`, `pre-atendimento/index.html`, `robots.txt`.
- `sanitize.js` oferece `escapeHtml()` e `safeUrl()`; foi corrigido o caminho de unwrap em `rich-text.js`, mas ainda falta rastrear o uso de ambos em todos os renderizadores.
- Supabase: listagem de tabelas, status RLS, 87 políticas em `public`, grants efetivos para `anon`/`authenticated`, privilégios padrão, Security Advisor, histórico de migrations e comparação entre código implantado e versionado de três Edge Functions; consulta read-only executada como `anon` reproduziu erro de permissão em `testimonials`.
- Todas as tabelas dos schemas `public` e `storage` retornaram RLS habilitado: 38/38 e 8/8, respectivamente. Não há views no schema `public` na consulta feita. Todas as funções `SECURITY DEFINER` consultadas têm `search_path` configurado; `anon` e `authenticated` não têm privilégio `CREATE` no schema `public`. Isso não prova que cada política seja correta nem substitui testes com roles reais.
- Bucket `documentos-pacientes`: privado. Bucket `site-media`: público; 11 objetos sem referência atual foram identificados (4 em `resultados/`, 7 em `tratamentos/`) e exigem revisão antes de qualquer exclusão/movimentação.
- O SDK Supabase foi fixado em `2.117.3` no cliente público, no painel e nas três Edge Functions. Chart.js foi fixado em `4.5.1` nas três páginas administrativas encontradas. A integridade/SRI e o inventário de todas as dependências externas ainda precisam ser avaliados.
- `robots.txt` bloqueia rastreamento de `/painel/`; isso não é controle de acesso.
- A chave `anon` presente no frontend é pública por desenho e não foi classificada como segredo privilegiado. Não foi encontrado uso de `service_role` no arquivo de autenticação revisado.

## Testes

- **Adicionado:** `tests/painel-auth-security.mjs`, com verificações estáticas de fail-closed, guards, logout, mensagens genéricas, parsing do script inline, ausência de chave privilegiada no frontend e escaping dos sinks identificados.
- **Executado com sucesso no GitHub Actions:** workflow `Security audit checks` run #62 (checagem de sintaxe dos módulos e testes estáticos, incluindo SDKs e URLs); `Validação de sintaxe dos HTML` run #82; `Bot triagem — validação` run #260. A validação do bot também passou usando `actions/checkout@v7.0.1` e `actions/setup-node@v7.1.0`. Os testes estáticos verificam padrões de segurança, não substituem testes dinâmicos de autorização.
- **Pendente:** teste real de isolamento A/B via RLS, tentativas de modificar papel, validação de upload, teste dinâmico do sanitizador com HTML aninhado, teste da migration em homologação, teste funcional dos modelos de contrato/assinatura/PDF e da Edge Function reconciliada, testes de falha de conexão e revisão completa dos atributos dinâmicos. Não foram executadas operações de escrita no banco nem testes destrutivos.
- **Propostas SQL de revisão:** `docs/sql/REVIEW_ONLY_revoke_excessive_client_table_privileges.sql` e `supabase/migrations/20261011150000_scope_admin_rls_policies_to_authenticated.sql`; nenhum dos arquivos foi aplicado. A migration de RLS requer teste específico em ambiente de homologação antes de qualquer implantação.

## Matriz de riscos pendentes

| ID | Prioridade | Item | Próximo passo |
|---|---|---|---|
| SEC-004 | Média | Proteção de senha vazada desabilitada | Configurar no Supabase após validar fluxo |
| SEC-005 | Média | Funções SECURITY DEFINER | Revisar grants e cenários negativos função a função |
| SEC-006 | Média | Limites de upload ausentes | Definir limites e tipos permitidos |
| SEC-007 | Informativo | CORS amplo nas Edge Functions | Restringir origens se compatível, mantendo autenticação como controle real |
| SEC-008 | Média | Políticas RLS redundantes | Testes de isolamento com contas fictícias e proposta de migração |
| SEC-009 | Baixa/média | Sinks de HTML potencialmente inseguros | Correções e teste estático aprovados; continuar rastreamento e teste manual |
| SEC-010 | Média / impacto potencial elevado | TRUNCATE/TRIGGER/REFERENCES/MAINTAIN concedidos às roles cliente | Revisar e testar o SQL proposto antes de aplicar |
| SEC-011 | Média | Inventário estático das páginas privadas concluído; rastreamento de sinks e fluxos ainda incompleto | Rastrear renderizadores, fontes de dados e fluxos restantes; realizar teste dinâmico de autorização |
| SEC-012 | Média | Segredos no histórico Git | Executar varredura dedicada e documentar rotação se necessário |
| SEC-013 | Média | Cabeçalhos/HTTPS/cache | Confirmar hospedagem e configuração efetiva fora do repositório |
| SEC-014 | Média | Dependências e Actions | Chart.js e o workflow novo foram fixados; auditar todos os workflows e dependências restantes |
| SEC-015 | Baixa | Versão flutuante do Chart.js | Chart.js e Supabase JS fixados e verificados pelo CI; rastrear outras dependências |
| SEC-016 | Média | Formulário público sem antiabuso/validação server-side | Projetar Edge Function com limites e rate limit; validar base legal para dados sensíveis |
| SEC-017 | Média potencial | Objetos órfãos em bucket público | Revisar conteúdo/consentimento de 11 objetos antes de decidir remoção ou migração |
| SEC-018 | Média | Histórico de migrations não reconciliado | Comparar SQL aplicado com arquivos versionados antes de novas implantações |
| SEC-019 | Baixa/média | URLs externas HTTP e protocol-relative | Corrigido; teste estático e checagem de sintaxe aprovados; revisar todos os chamadores |
| SEC-020 | Média | Código de Edge Function divergia do repositório | Comportamentos reconciliados na branch e teste estático adicionado; validar em homologação antes de redeploy |
| SEC-021 | Média | Drift de migrations e políticas RLS permissivas redundantes | Mapear equivalências por conteúdo e testar isolamento com contas fictícias antes de simplificar políticas |
| SEC-022 | Média | Sanitizador de HTML podia preservar descendentes ativos de tags rejeitadas | Corrigido na branch; aguardar CI e fazer teste dinâmico de homologação |
| SEC-023 | Baixa/média | URLs de imagem e texto dinâmico sem validação/escape nas páginas públicas | Corrigido na branch; aguardar CI e continuar rastreamento de atributos dinâmicos |
| SEC-024 | Alta para disponibilidade pública | Políticas administrativas em `PUBLIC` chamam `is_admin()` sem EXECUTE para `anon` | Migração proposta na branch; validar fluxos públicos e administrativos em homologação antes de aplicar |
| SEC-025 | Média | Modelo de contrato inserido no editor sem sanitização prévia | Corrigido na branch; testar opções, assinatura e PDF em homologação |

## Limitações e próximos passos

- Não foram aplicadas migrações nem alterações de configuração ao banco de produção.
- A listagem de metadados e o advisor não substituem testes de autorização usando identidades distintas.
- Ainda é necessário completar o inventário de todas as páginas, scripts, workflows, dependências e histórico Git, bem como revisar os demais endpoints.
- A configuração do projeto na Vercel não pôde ser inspecionada: a API retornou `403 forbidden` para o escopo `especialista-em-pele`. Assim, cabeçalhos, redirects e cache configurados no painel externo permanecem não verificados.
- O formulário público `/pre-atendimento/` continua aceitando inserções diretas na tabela; o endurecimento real exige backend/rate limiting e validação jurídica/operacional.
- Avaliar juridicamente retenção, consentimento, compartilhamento e procedimentos de incidentes LGPD; esta auditoria técnica não certifica conformidade legal.
- As alterações desta branch devem permanecer em revisão até que os testes e o relatório sejam concluídos.
