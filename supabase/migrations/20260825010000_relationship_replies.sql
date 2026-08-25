-- =============================================================
-- FASE 2 — RESPOSTA INDIVIDUAL
--
-- Fecha o ciclo do relacionamento: hoje o admin marca um pedido de
-- oração como "orado" e a pessoa nunca sabe.
--
-- ESCOPO DELIBERADO: esta fase NÃO integra API de WhatsApp. O admin
-- responde pelo próprio WhatsApp/e-mail (a interface gera o link
-- pronto) e o sistema REGISTRA que a resposta foi enviada. Isso
-- entrega o valor sem custo de infraestrutura nem homologação de
-- template. A integração via API fica para a Fase 3, se necessária.
--
-- NOTA DE PRIVACIDADE: diferente de relationship_audit_log — que
-- deliberadamente não guarda conteúdo pessoal — esta tabela guarda o
-- texto enviado, porque histórico de conversa é a função dela. Por
-- isso a leitura é restrita a super_admin/admin e a pessoa destinatária.
-- =============================================================

DO $$ BEGIN
  CREATE TYPE public.reply_channel AS ENUM ('whatsapp', 'email');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.relationship_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  relationship_type TEXT NOT NULL
    CHECK (relationship_type IN ('testimonial', 'prayer_request')),
  relationship_id UUID NOT NULL,

  recipient_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  channel public.reply_channel NOT NULL,
  message TEXT NOT NULL,

  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_replies_rel
  ON public.relationship_replies(relationship_type, relationship_id);
CREATE INDEX IF NOT EXISTS idx_replies_recipient
  ON public.relationship_replies(recipient_user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_replies_admin
  ON public.relationship_replies(admin_user_id, sent_at DESC);

ALTER TABLE public.relationship_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view replies" ON public.relationship_replies;
CREATE POLICY "Admins can view replies" ON public.relationship_replies
  FOR SELECT
  USING (public.has_role(ARRAY['super_admin', 'admin']::public.app_role[]));

-- A pessoa pode ver o que lhe foi respondido.
DROP POLICY IF EXISTS "Users can view replies addressed to them" ON public.relationship_replies;
CREATE POLICY "Users can view replies addressed to them" ON public.relationship_replies
  FOR SELECT
  USING (auth.uid() = recipient_user_id);

-- Escrita apenas pela RPC abaixo.

-- =============================================================
-- RPC: registrar uma resposta enviada
--
-- Além de gravar, avança o status do item para 'prayed'/'reviewed'
-- reaproveitando update_relationship_status — assim a transição
-- continua validada pela matriz existente e o audit log continua
-- sendo alimentado, sem duplicar regra.
-- =============================================================

CREATE OR REPLACE FUNCTION public.record_relationship_reply(
  p_relationship_type TEXT,
  p_relationship_id UUID,
  p_channel TEXT,
  p_message TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
  v_recipient UUID;
  v_reply_id UUID;
  v_target_status TEXT;
  v_current_status TEXT;
BEGIN
  v_admin_id := auth.uid();
  IF v_admin_id IS NULL OR NOT public.has_role(ARRAY['super_admin', 'admin']::public.app_role[]) THEN
    RAISE EXCEPTION 'Unauthorized: User is not an authorized administrator';
  END IF;

  IF p_relationship_type NOT IN ('testimonial', 'prayer_request') THEN
    RAISE EXCEPTION 'Invalid relationship type: %', p_relationship_type;
  END IF;

  IF p_message IS NULL OR length(trim(p_message)) = 0 THEN
    RAISE EXCEPTION 'Message cannot be empty';
  END IF;

  -- Descobre o destinatário e o status atual
  IF p_relationship_type = 'testimonial' THEN
    SELECT user_id, status::text INTO v_recipient, v_current_status
    FROM public.testimonials WHERE id = p_relationship_id;
    v_target_status := 'reviewed';
  ELSE
    SELECT user_id, status INTO v_recipient, v_current_status
    FROM public.prayer_requests WHERE id = p_relationship_id;
    v_target_status := 'prayed';
  END IF;

  IF v_recipient IS NULL THEN
    RAISE EXCEPTION 'Relationship item not found: %', p_relationship_id;
  END IF;

  INSERT INTO public.relationship_replies
    (relationship_type, relationship_id, recipient_user_id, admin_user_id, channel, message)
  VALUES
    (p_relationship_type, p_relationship_id, v_recipient, v_admin_id,
     p_channel::public.reply_channel, p_message)
  RETURNING id INTO v_reply_id;

  -- Avança o status reaproveitando a função existente (que valida a
  -- transição e escreve no audit log). Se já estiver no status alvo,
  -- a própria função trata como no-op.
  IF v_current_status IS DISTINCT FROM v_target_status
     AND v_current_status <> 'archived' THEN
    PERFORM public.update_relationship_status(
      p_relationship_type, p_relationship_id, v_target_status
    );
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'reply_id', v_reply_id,
    'recipient_user_id', v_recipient,
    'status_advanced_to', v_target_status
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_relationship_reply(TEXT, UUID, TEXT, TEXT) TO authenticated;

-- =============================================================
-- RPC: dados de contato para responder
--
-- Devolve nome, e-mail e telefone de uma pessoa APENAS no contexto de
-- um item de relacionamento que ela mesma criou, e apenas para admin.
-- Evita expor a tabela de contatos inteira via RLS ampla.
-- Informa também se há consentimento no canal, para a interface poder
-- avisar quando o envio for de resposta (permitido) versus quando
-- houver restrição.
-- =============================================================

CREATE OR REPLACE FUNCTION public.get_relationship_contact(
  p_relationship_type TEXT,
  p_relationship_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recipient UUID;
  v_result JSONB;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(ARRAY['super_admin', 'admin']::public.app_role[]) THEN
    RAISE EXCEPTION 'Unauthorized: User is not an authorized administrator';
  END IF;

  IF p_relationship_type = 'testimonial' THEN
    SELECT user_id INTO v_recipient FROM public.testimonials WHERE id = p_relationship_id;
  ELSIF p_relationship_type = 'prayer_request' THEN
    SELECT user_id INTO v_recipient FROM public.prayer_requests WHERE id = p_relationship_id;
  ELSE
    RAISE EXCEPTION 'Invalid relationship type: %', p_relationship_type;
  END IF;

  IF v_recipient IS NULL THEN
    RAISE EXCEPTION 'Relationship item not found: %', p_relationship_id;
  END IF;

  SELECT jsonb_build_object(
    'user_id', p.id,
    'full_name', p.full_name,
    'phone', p.phone,
    'email', u.email,
    'consent_whatsapp', COALESCE(
      (SELECT granted FROM public.current_communication_consents c
       WHERE c.user_id = p.id AND c.channel = 'whatsapp'
         AND c.purpose = 'relationship_reply'), NULL),
    'consent_email', COALESCE(
      (SELECT granted FROM public.current_communication_consents c
       WHERE c.user_id = p.id AND c.channel = 'email'
         AND c.purpose = 'relationship_reply'), NULL)
  )
  INTO v_result
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE p.id = v_recipient;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_relationship_contact(TEXT, UUID) TO authenticated;
