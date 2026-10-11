-- REVIEW ONLY — NÃO EXECUTAR EM PRODUÇÃO SEM REVISÃO E AUTORIZAÇÃO.
-- Projeto observado: clwaotfbqwvxpykruwed (PostgreSQL 17).
--
-- Evidência: anon e authenticated possuem privilégios explícitos
-- TRUNCATE, REFERENCES, TRIGGER e MAINTAIN nas 38 tabelas do schema public.
-- RLS não restringe TRUNCATE. As roles também possuem SELECT/INSERT/UPDATE/DELETE
-- nas tabelas atuais; este script preserva DML por ora porque a aplicação depende
-- de acessos diferentes por tabela. RLS filtra linhas, mas uma futura etapa deve
-- mapear e reduzir DML por tabela sem quebrar os fluxos legítimos.
--
-- Antes de aprovar:
-- 1. Conferir o diff de privilégios no ambiente-alvo.
-- 2. Executar em ambiente de teste e rodar testes de regressão.
-- 3. Confirmar que nenhum cliente autorizado usa esses privilégios (não esperado).
-- 4. Planejar rollback controlado, sem restaurar privilégios excessivos em bloco.
--
-- Proposta; não foi executada contra o banco.
BEGIN;

REVOKE TRUNCATE, REFERENCES, TRIGGER, MAINTAIN
ON ALL TABLES IN SCHEMA public
FROM anon, authenticated;

-- Também evitar que novas tabelas herdem esses privilégios excessivos.
-- Os ACLs padrão observados concedem os privilégios às roles anon e
-- authenticated para objetos criados por postgres e supabase_admin.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
REVOKE TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLES FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public
REVOKE TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLES FROM anon, authenticated;

-- O ACL padrão observado para funções criadas por supabase_admin concede
-- EXECUTE a anon/authenticated. Revogar para novas funções exige GRANT
-- explícito em cada RPC que deva ser acessível pelo frontend.
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public
REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated;

COMMIT;

-- Verificação pós-aplicação (esperado: 0 em ambas as colunas):
-- SELECT
--   count(*) FILTER (
--     WHERE has_table_privilege('anon', format('%I.%I', schemaname, tablename), 'TRUNCATE')
--   ) AS anon_still_can_truncate,
--   count(*) FILTER (
--     WHERE has_table_privilege('authenticated', format('%I.%I', schemaname, tablename), 'TRUNCATE')
--   ) AS authenticated_still_can_truncate
-- FROM pg_tables
-- WHERE schemaname = 'public';
