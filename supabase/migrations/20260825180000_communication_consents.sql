-- =============================================================
-- FASE 1 — CAMADA DE CONSENTIMENTO
--
-- Pré-requisito para qualquer comunicação ativa (campanhas) e para
-- registrar de forma auditável a autorização de cada pessoa.
--
-- DECISÃO DE MODELAGEM: a tabela é APPEND-ONLY. Cada linha é um
-- evento ("concedeu" ou "revogou"), nunca um UPDATE. Isso preserva o
-- histórico completo, que é o que dá prova de quando a autorização
-- foi dada — exigência da LGPD. O estado atual sai da view
-- current_communication_consents, que pega o evento mais recente de
-- cada combinação usuário/canal/finalidade.
-- =============================================================

DO $$ BEGIN
  CREATE TYPE public.consent_channel AS ENUM ('email', 'whatsapp');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.consent_purpose AS ENUM (
    'devotional_updates',   -- novo devocional publicado
    'project_support',      -- convites de apoio ao projeto
    'relationship_reply'    -- resposta a pedido de oração / testemunho
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.communication_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  channel public.consent_channel NOT NULL,
  purpose public.consent_purpose NOT NULL,

  -- TRUE = concedeu, FALSE = revogou
  granted BOOLEAN NOT NULL,

  -- Versão do texto aceito. Se a política mudar, é possível saber
  -- quem aceitou qual redação.
  policy_version TEXT NOT NULL DEFAULT 'v1',

  -- Onde o ato aconteceu: 'signup', 'profile', 'unsubscribe_link'
  source TEXT NOT NULL,

  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consents_user
  ON public.communication_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_consents_lookup
  ON public.communication_consents(user_id, channel, purpose, occurred_at DESC);

-- Estado atual = evento mais recente de cada combinação.
CREATE OR REPLACE VIEW public.current_communication_consents AS
SELECT DISTINCT ON (user_id, channel, purpose)
  user_id,
  channel,
  purpose,
  granted,
  policy_version,
  source,
  occurred_at
FROM public.communication_consents
ORDER BY user_id, channel, purpose, occurred_at DESC;

ALTER TABLE public.communication_consents ENABLE ROW LEVEL SECURITY;

-- A pessoa vê o próprio histórico.
DROP POLICY IF EXISTS "Users can view own consents" ON public.communication_consents;
CREATE POLICY "Users can view own consents" ON public.communication_consents
  FOR SELECT USING (auth.uid() = user_id);

-- Admins leem para saber a quem podem enviar.
DROP POLICY IF EXISTS "Admins can view consents" ON public.communication_consents;
CREATE POLICY "Admins can view consents" ON public.communication_consents
  FOR SELECT
  USING (public.has_role(ARRAY['super_admin', 'admin']::public.app_role[]));

-- Ninguém escreve direto: só pela RPC abaixo, que valida e carimba
-- a origem. Sem INSERT/UPDATE/DELETE policy, a tabela fica fechada.

-- =============================================================
-- RPC: registrar consentimento
-- =============================================================

CREATE OR REPLACE FUNCTION public.set_communication_consent(
  p_channel TEXT,
  p_purpose TEXT,
  p_granted BOOLEAN,
  p_source TEXT DEFAULT 'profile',
  p_policy_version TEXT DEFAULT 'v1'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_current BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: no authenticated user';
  END IF;

  IF p_source NOT IN ('signup', 'profile', 'unsubscribe_link') THEN
    RAISE EXCEPTION 'Invalid consent source: %', p_source;
  END IF;

  -- Evita gravar evento redundante se o estado já é o pedido.
  SELECT granted INTO v_current
  FROM public.current_communication_consents
  WHERE user_id = v_user_id
    AND channel = p_channel::public.consent_channel
    AND purpose = p_purpose::public.consent_purpose;

  IF v_current IS NOT NULL AND v_current = p_granted THEN
    RETURN jsonb_build_object('success', TRUE, 'changed', FALSE, 'granted', p_granted);
  END IF;

  INSERT INTO public.communication_consents
    (user_id, channel, purpose, granted, policy_version, source)
  VALUES
    (v_user_id, p_channel::public.consent_channel, p_purpose::public.consent_purpose,
     p_granted, p_policy_version, p_source);

  RETURN jsonb_build_object('success', TRUE, 'changed', TRUE, 'granted', p_granted);
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_communication_consent(TEXT, TEXT, BOOLEAN, TEXT, TEXT) TO authenticated;

-- =============================================================
-- RPC: consultar os próprios consentimentos
-- =============================================================

CREATE OR REPLACE FUNCTION public.get_my_communication_consents()
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

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'channel', channel,
    'purpose', purpose,
    'granted', granted,
    'occurred_at', occurred_at
  )), '[]'::jsonb)
  INTO v_result
  FROM public.current_communication_consents
  WHERE user_id = v_user_id;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_communication_consents() TO authenticated;
