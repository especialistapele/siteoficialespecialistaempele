-- Pacientes devem gravar respostas/assinaturas pelo RPC submit_anamnesis,
-- que valida versão, propriedade, autorização de edição e assinatura. As policies
-- INSERT diretas permitiam contornar parte dessas validações via REST.
-- SECURITY DEFINER RPCs continuam podendo gravar; a migration não foi aplicada
-- ao Supabase de produção.
DROP POLICY IF EXISTS "patient writes own responses" ON public.anamnesis_responses;
DROP POLICY IF EXISTS "patient signs own anamnesis" ON public.anamnesis_signatures;
