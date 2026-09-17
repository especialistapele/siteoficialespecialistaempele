-- O formulário de cadastro/edição de tratamentos (painel/admin/tratamentos.html)
-- passou a permitir configurar um botão personalizável ao final da orientação
-- (texto livre + URL de destino, que pode ser página interna, externa ou
-- WhatsApp). Sem estas colunas o botão não teria onde ser persistido.
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS cta_label text;
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS cta_url text;
