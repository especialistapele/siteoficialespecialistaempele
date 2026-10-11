-- Corrige a criação de conversas pelo bot público.
-- O cliente usava INSERT ... SELECT id em bot_conversations, mas não existe
-- política SELECT para anon; além disso, a policy de bot_messages fazia um
-- EXISTS sobre bot_conversations sujeito a RLS, o que não é uma validação
-- confiável de sessão para o papel anon.
--
-- Esta migration é proposta na branch e NÃO foi aplicada em produção.
CREATE OR REPLACE FUNCTION public.create_bot_conversation(
  p_session_id uuid,
  p_treatment_context text DEFAULT NULL,
  p_treatment_name text DEFAULT NULL,
  p_page_path text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO pg_catalog, public
AS $function$
DECLARE
  v_id uuid;
BEGIN
  IF p_session_id IS NULL THEN
    RAISE EXCEPTION 'Sessão do bot inválida';
  END IF;

  IF length(coalesce(p_treatment_context, '')) > 100
     OR length(coalesce(p_treatment_name, '')) > 200
     OR length(coalesce(p_page_path, '')) > 500 THEN
    RAISE EXCEPTION 'Metadados da conversa excedem o limite permitido';
  END IF;

  IF p_page_path IS NOT NULL
     AND (left(p_page_path, 1) <> '/' OR left(p_page_path, 2) = '//') THEN
    RAISE EXCEPTION 'Caminho da página inválido';
  END IF;

  INSERT INTO public.bot_conversations (
    session_id, treatment_context, treatment_name, page_path
  )
  VALUES (
    p_session_id,
    nullif(trim(p_treatment_context), ''),
    nullif(trim(p_treatment_name), ''),
    nullif(trim(p_page_path), '')
  )
  ON CONFLICT (session_id) DO NOTHING;

  SELECT c.id
    INTO v_id
  FROM public.bot_conversations AS c
  WHERE c.session_id = p_session_id;

  IF v_id IS NULL THEN
    RAISE EXCEPTION 'Não foi possível abrir a conversa';
  END IF;

  RETURN v_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_bot_conversation(uuid, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_bot_conversation(uuid, text, text, text) TO anon, authenticated;

-- A função retorna apenas um booleano para o par de IDs enviado; ela não
-- devolve mensagens, nomes nem metadados da conversa.
CREATE OR REPLACE FUNCTION public.bot_session_matches(
  p_conversation_id uuid,
  p_session_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO pg_catalog, public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.bot_conversations AS c
    WHERE c.id = p_conversation_id
      AND c.session_id = p_session_id
  );
$function$;

REVOKE ALL ON FUNCTION public.bot_session_matches(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bot_session_matches(uuid, uuid) TO anon, authenticated;

-- Obriga a criação de conversas via RPC validada; elimina o INSERT direto que
-- não consegue retornar o id sem expor uma política SELECT pública.
REVOKE INSERT ON public.bot_conversations FROM PUBLIC, anon, authenticated;
DROP POLICY IF EXISTS "Bot can create conversations" ON public.bot_conversations;

-- A validação da relação conversa/sessão passa por função SECURITY DEFINER,
-- em vez de subconsulta sujeita às políticas SELECT de bot_conversations.
DROP POLICY IF EXISTS "Bot can create messages" ON public.bot_messages;
CREATE POLICY "Bot can create messages"
  ON public.bot_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (public.bot_session_matches(conversation_id, session_id));
