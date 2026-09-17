-- O front-end (painel/admin/pre-atendimentos.html) sempre usou os valores
-- 'novo', 'contato', 'convertido', 'arquivado' para o status do lead.
-- A constraint no banco, porém, só permitia 'novo', 'em_contato', 'agendado', 'arquivado'.
-- Isso fazia o UPDATE de status (inclusive ao converter em paciente) falhar com:
-- "new row for relation pre_atendimentos violates check constraint pre_atendimentos_status_check"
ALTER TABLE pre_atendimentos DROP CONSTRAINT pre_atendimentos_status_check;
ALTER TABLE pre_atendimentos ADD CONSTRAINT pre_atendimentos_status_check
  CHECK (status = ANY (ARRAY['novo'::text, 'contato'::text, 'convertido'::text, 'arquivado'::text]));
