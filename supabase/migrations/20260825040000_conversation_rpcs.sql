-- =============================================================
-- RPCs de leitura das respostas pela própria pessoa
--
-- Separadas da migration anterior porque usam o valor 'in_app' do
-- enum, que não pode ser referenciado na mesma transação em que foi
-- adicionado.
-- =============================================================

-- Contador de não lidas. Chamado a cada carga do app, por isso é
-- deliberadamente barato: só conta, não traz conteúdo.
CREATE OR REPLACE FUNCTION public.get_my_unread_reply_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_count INTEGER;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN 0;
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM public.relationship_replies
  WHERE recipient_user_id = v_user_id
    AND channel = 'in_app'
    AND read_at IS NULL;

  RETURN COALESCE(v_count, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_unread_reply_count() TO authenticated;

-- =============================================================
-- Conversas: a resposta junto do que a pessoa escreveu.
--
-- Sem o texto original, uma resposta chega sem contexto — a pessoa
-- pode ter escrito semanas antes. Por isso devolvemos os dois.
-- =============================================================

CREATE OR REPLACE FUNCTION public.get_my_conversations()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_result JSONB;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: no authenticated user';
  END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(conv) ORDER BY conv.sent_at DESC), '[]'::jsonb)
  INTO v_result
  FROM (
    SELECT
      r.id,
      r.relationship_type,
      r.relationship_id,
      r.message,
      r.sent_at,
      r.read_at,
      CASE r.relationship_type
        WHEN 'prayer_request' THEN (
          SELECT pr.request FROM public.prayer_requests pr WHERE pr.id = r.relationship_id
        )
        WHEN 'testimonial' THEN (
          SELECT tt.content FROM public.testimonials tt WHERE tt.id = r.relationship_id
        )
      END AS original_message,
      CASE r.relationship_type
        WHEN 'prayer_request' THEN (
          SELECT pr.created_at FROM public.prayer_requests pr WHERE pr.id = r.relationship_id
        )
        WHEN 'testimonial' THEN (
          SELECT tt.created_at FROM public.testimonials tt WHERE tt.id = r.relationship_id
        )
      END AS original_sent_at
    FROM public.relationship_replies r
    WHERE r.recipient_user_id = v_user_id
      AND r.channel = 'in_app'
  ) conv;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_conversations() TO authenticated;

-- =============================================================
-- Marcar como lida.
--
-- Só a própria destinatária pode marcar, e read_at nunca é
-- sobrescrito — a primeira leitura é a que vale.
-- =============================================================

CREATE OR REPLACE FUNCTION public.mark_replies_as_read(
  p_reply_ids UUID[] DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_updated INTEGER;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: no authenticated user';
  END IF;

  UPDATE public.relationship_replies
  SET read_at = NOW()
  WHERE recipient_user_id = v_user_id
    AND channel = 'in_app'
    AND read_at IS NULL
    AND (p_reply_ids IS NULL OR id = ANY(p_reply_ids));

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_replies_as_read(UUID[]) TO authenticated;
