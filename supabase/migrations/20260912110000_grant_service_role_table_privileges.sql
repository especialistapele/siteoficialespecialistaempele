-- ============================================================
-- CORREÇÃO CRÍTICA: service_role sem GRANT nas tabelas
-- ------------------------------------------------------------
-- A role service_role (usada pelas Edge Functions com a chave de
-- serviço) estava sem GRANT de SELECT/INSERT/UPDATE/DELETE em
-- NENHUMA tabela do schema public — só tinha
-- TRIGGER/REFERENCES/TRUNCATE.
--
-- Isso não é um bloqueio de RLS (service_role tem BYPASSRLS, a
-- policy nem chega a ser avaliada) — é permissão de SQL mesmo.
-- Por isso o erro aparecia como "permission denied for table
-- patients" (erro de GRANT), e não como uma mensagem de política.
--
-- O problema afetava TODAS as tabelas do projeto, então qualquer
-- Edge Function que leia/escreva com a chave de serviço estava
-- limitada por isso, não só o create-patient.
--
-- Aditivo: apenas concede permissão, não remove nada de ninguém.
-- ============================================================

grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

-- Garante que tabelas criadas no futuro já nasçam com essa
-- permissão, sem depender de lembrar de conceder de novo.
alter default privileges in schema public grant select, insert, update, delete on tables to service_role;
alter default privileges in schema public grant usage, select on sequences to service_role;
