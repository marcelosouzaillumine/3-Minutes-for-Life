-- =============================================================
-- 3 MINUTES FOR LIFE
-- Communication Center
-- Delivery Hardening
-- =============================================================

-- =============================================================
-- 1. STATUS DE E-MAIL
-- =============================================================

DO $$ BEGIN
  ALTER TYPE public.communication_delivery_status
    ADD VALUE IF NOT EXISTS 'bounced';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.communication_delivery_status
    ADD VALUE IF NOT EXISTS 'complained';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;


-- =============================================================
-- 2. CTA POR IDIOMA
-- =============================================================

ALTER TABLE public.communication_campaign_translations
ADD COLUMN IF NOT EXISTS cta_url TEXT;


-- =============================================================
-- 3. SNAPSHOT DO DELIVERY
--
-- Preserva exatamente o conteúdo enviado.
-- Alterações posteriores na campanha não alteram o histórico.
-- =============================================================

ALTER TABLE public.communication_deliveries
ADD COLUMN IF NOT EXISTS language TEXT;

ALTER TABLE public.communication_deliveries
ADD COLUMN IF NOT EXISTS subject TEXT;

ALTER TABLE public.communication_deliveries
ADD COLUMN IF NOT EXISTS title TEXT;

ALTER TABLE public.communication_deliveries
ADD COLUMN IF NOT EXISTS body TEXT;

ALTER TABLE public.communication_deliveries
ADD COLUMN IF NOT EXISTS cta_label TEXT;

ALTER TABLE public.communication_deliveries
ADD COLUMN IF NOT EXISTS cta_url TEXT;


-- =============================================================
-- 4. IDENTIFICAÇÃO DO DESTINATÁRIO
-- =============================================================

ALTER TABLE public.communication_deliveries
ADD COLUMN IF NOT EXISTS recipient_email TEXT;

ALTER TABLE public.communication_deliveries
ADD COLUMN IF NOT EXISTS recipient_phone TEXT;


-- =============================================================
-- 5. TENTATIVAS
-- =============================================================

ALTER TABLE public.communication_deliveries
ADD COLUMN IF NOT EXISTS attempt_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.communication_deliveries
ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMPTZ;


-- =============================================================
-- 6. PROVIDER EVENT
-- =============================================================

ALTER TABLE public.communication_deliveries
ADD COLUMN IF NOT EXISTS provider_event_type TEXT;

ALTER TABLE public.communication_deliveries
ADD COLUMN IF NOT EXISTS provider_event_at TIMESTAMPTZ;


-- =============================================================
-- 7. ÍNDICES
-- =============================================================

CREATE INDEX IF NOT EXISTS
  idx_communication_deliveries_email
ON public.communication_deliveries(recipient_email)
WHERE recipient_email IS NOT NULL;


CREATE INDEX IF NOT EXISTS
  idx_communication_deliveries_provider_message
ON public.communication_deliveries(provider_message_id)
WHERE provider_message_id IS NOT NULL;


CREATE INDEX IF NOT EXISTS
  idx_communication_deliveries_retry
ON public.communication_deliveries(status, attempt_count)
WHERE status IN ('pending', 'queued', 'failed');


-- =============================================================
-- 8. COMENTÁRIOS
-- =============================================================

COMMENT ON COLUMN public.communication_deliveries.language IS
'Idioma efetivamente utilizado no envio.';

COMMENT ON COLUMN public.communication_deliveries.subject IS
'Snapshot do assunto efetivamente enviado.';

COMMENT ON COLUMN public.communication_deliveries.title IS
'Snapshot do título efetivamente enviado.';

COMMENT ON COLUMN public.communication_deliveries.body IS
'Snapshot do conteúdo efetivamente enviado.';

COMMENT ON COLUMN public.communication_deliveries.cta_label IS
'Snapshot do texto do CTA.';

COMMENT ON COLUMN public.communication_deliveries.cta_url IS
'Snapshot da URL do CTA.';

COMMENT ON COLUMN public.communication_deliveries.attempt_count IS
'Quantidade de tentativas de envio.';

COMMENT ON COLUMN public.communication_deliveries.provider_event_type IS
'Último evento recebido do provider.';

