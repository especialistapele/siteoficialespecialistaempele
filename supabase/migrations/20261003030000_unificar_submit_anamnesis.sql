-- Remove a assinatura legada do RPC. Sem esta limpeza, o PostgreSQL mantém duas sobrecargas
-- e uma chamada sem parâmetros nomeados pode resolver para a implementação antiga.
DROP FUNCTION IF EXISTS public.submit_anamnesis(uuid, jsonb, text, text);

REVOKE ALL ON FUNCTION public.submit_anamnesis(uuid, jsonb, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_anamnesis(uuid, jsonb, text, text, jsonb) TO authenticated;
