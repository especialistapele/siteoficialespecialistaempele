-- REVIEW ONLY — NÃO EXECUTAR EM PRODUÇÃO SEM REVISÃO E AUTORIZAÇÃO.
-- Projeto observado: clwaotfbqwvxpykruwed (PostgreSQL 17).
--
-- Evidência: anon e authenticated possuem privilégios explícitos
-- TRUNCATE, REFERENCES, TRIGGER e MAINTAIN nas 38 tabelas do schema public.
-- RLS não restringe TRUNCATE. Este script preserva SELECT/INSERT/UPDATE/DELETE
-- porque a aplicação depende deles e o acesso por linha deve continuar sob RLS.
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
