-- Não havia nenhum vínculo entre "patients" e "pre_atendimentos", então as
-- respostas que o cliente preenchia no formulário do site (queixa principal,
-- tratamentos anteriores, medicamentos, observações) eram perdidas assim que
-- o lead virava paciente — por isso a ficha do paciente no painel não mostrava nada.
ALTER TABLE patients ADD COLUMN pre_atendimento_id uuid REFERENCES pre_atendimentos(id) ON DELETE SET NULL;
