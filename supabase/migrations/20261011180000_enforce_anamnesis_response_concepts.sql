-- Evita que o cliente escolha um clinical_concept_id diferente daquele
-- associado pelo profissional à pergunta. submit_anamnesis é SECURITY DEFINER
-- e recebia esse UUID do JSON enviado pelo navegador; a validação atual confere
-- a pergunta, mas não compara o conceito recebido com question_definitions.
--
-- A consulta read-only da auditoria encontrou 294 respostas existentes e zero
-- divergências entre anamnesis_responses.clinical_concept_id e o mapeamento da
-- pergunta. Esta migration é proposta e NÃO foi aplicada em produção.

CREATE OR REPLACE FUNCTION public.enforce_anamnesis_response_concept()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO pg_catalog, public
AS $function$
DECLARE
  v_concept_id uuid;
BEGIN
  SELECT qd.clinical_concept_id
    INTO v_concept_id
  FROM public.question_definitions AS qd
  WHERE qd.id = NEW.question_definition_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pergunta inválida para a resposta';
  END IF;

  NEW.clinical_concept_id := v_concept_id;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.enforce_anamnesis_response_concept() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS enforce_anamnesis_response_concept ON public.anamnesis_responses;
CREATE TRIGGER enforce_anamnesis_response_concept
  BEFORE INSERT ON public.anamnesis_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_anamnesis_response_concept();
