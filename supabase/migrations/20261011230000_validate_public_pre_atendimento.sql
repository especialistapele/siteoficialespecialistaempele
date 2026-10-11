-- Valida e limita os dados recebidos pelo formulário público de pré-atendimento.
-- O INSERT público continua existindo; rate limit/CAPTCHA server-side ainda precisa
-- de um endpoint dedicado. Esta trigger impede payloads enormes e status forjado.
-- Migration proposta na branch; NÃO aplicada em produção.
CREATE OR REPLACE FUNCTION public.enforce_pre_atendimento_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO pg_catalog, public
AS $function$
BEGIN
  NEW.full_name := btrim(coalesce(NEW.full_name, ''));
  NEW.phone := btrim(coalesce(NEW.phone, ''));
  NEW.email := nullif(btrim(coalesce(NEW.email, '')), '');
  NEW.queixa_principal := btrim(coalesce(NEW.queixa_principal, ''));
  NEW.tratamentos_anteriores := btrim(coalesce(NEW.tratamentos_anteriores, ''));
  NEW.usa_medicamentos := btrim(coalesce(NEW.usa_medicamentos, ''));
  NEW.observacoes := btrim(coalesce(NEW.observacoes, ''));

  IF length(NEW.full_name) < 2 OR length(NEW.full_name) > 200 THEN
    RAISE EXCEPTION 'Nome deve ter entre 2 e 200 caracteres';
  END IF;
  IF length(NEW.phone) < 8 OR length(NEW.phone) > 40 THEN
    RAISE EXCEPTION 'Telefone inválido';
  END IF;
  IF NEW.email IS NOT NULL AND (
    length(NEW.email) > 254
    OR NEW.email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
  ) THEN
    RAISE EXCEPTION 'E-mail inválido';
  END IF;
  IF NEW.idade IS NOT NULL AND (NEW.idade < 1 OR NEW.idade > 120) THEN
    RAISE EXCEPTION 'Idade fora do intervalo permitido';
  END IF;
  IF length(NEW.queixa_principal) < 1 OR length(NEW.queixa_principal) > 4000
     OR length(NEW.tratamentos_anteriores) > 4000
     OR length(NEW.usa_medicamentos) > 4000
     OR length(NEW.observacoes) > 4000 THEN
    RAISE EXCEPTION 'Uma resposta excede o limite permitido';
  END IF;

  -- O visitante não pode definir o status nem retrodatá-lo.
  NEW.status := 'novo';
  NEW.created_at := now();
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.enforce_pre_atendimento_submission() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS enforce_pre_atendimento_submission ON public.pre_atendimentos;
CREATE TRIGGER enforce_pre_atendimento_submission
  BEFORE INSERT ON public.pre_atendimentos
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_pre_atendimento_submission();
