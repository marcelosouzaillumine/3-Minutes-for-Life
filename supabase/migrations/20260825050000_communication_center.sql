-- =============================================================
-- 3 MINUTES FOR LIFE
-- COMMUNICATION CENTER
-- Migration: 20260825050000
--
-- Responsabilidade:
--   - campanhas
--   - canais de comunicação
--   - audiências
--   - entregas
--   - métricas básicas
--
-- NÃO envia mensagens.
-- O envio será responsabilidade das Edge Functions.
-- =============================================================


-- =============================================================
-- 1. ENUMS
-- =============================================================

DO $$ BEGIN
  CREATE TYPE public.communication_campaign_status AS ENUM (
    'draft',
    'scheduled',
    'sending',
    'completed',
    'cancelled',
    'failed'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;


DO $$ BEGIN
  CREATE TYPE public.communication_campaign_type AS ENUM (
    'devotional_update',
    'project_support',
    'announcement',
    'engagement',
    'custom'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;


DO $$ BEGIN
  CREATE TYPE public.communication_delivery_channel AS ENUM (
    'in_app',
    'email',
    'whatsapp'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;


DO $$ BEGIN
  CREATE TYPE public.communication_delivery_status AS ENUM (
    'pending',
    'queued',
    'sent',
    'delivered',
    'opened',
    'clicked',
    'failed',
    'skipped'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;


-- =============================================================
-- 2. CAMPAIGNS
-- =============================================================

CREATE TABLE IF NOT EXISTS public.communication_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name TEXT NOT NULL,

  type public.communication_campaign_type NOT NULL,

  status public.communication_campaign_status NOT NULL
    DEFAULT 'draft',

  -- Conteúdo editorial
  subject TEXT,
  title TEXT,
  body TEXT,

  -- CTA opcional
  cta_label TEXT,
  cta_url TEXT,

  -- Idioma
  language TEXT NOT NULL DEFAULT 'pt-BR',

  -- Controle editorial
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Agendamento
  scheduled_at TIMESTAMPTZ,

  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT communication_campaigns_language_check
    CHECK (language IN ('pt-BR', 'en', 'es'))
);


CREATE INDEX IF NOT EXISTS idx_campaigns_status
  ON public.communication_campaigns(status);


CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled
  ON public.communication_campaigns(scheduled_at)
  WHERE scheduled_at IS NOT NULL;


CREATE INDEX IF NOT EXISTS idx_campaigns_created_by
  ON public.communication_campaigns(created_by);


-- =============================================================
-- 3. CAMPAIGN CHANNELS
--
-- Uma campanha pode utilizar um ou vários canais.
--
-- Exemplo:
--
-- campanha "Novo devocional"
--   ├── in_app
--   └── email
--
-- WhatsApp poderá ser ativado posteriormente.
-- =============================================================

CREATE TABLE IF NOT EXISTS public.communication_campaign_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  campaign_id UUID NOT NULL
    REFERENCES public.communication_campaigns(id)
    ON DELETE CASCADE,

  channel public.communication_delivery_channel NOT NULL,

  enabled BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(campaign_id, channel)
);


CREATE INDEX IF NOT EXISTS idx_campaign_channels_campaign
  ON public.communication_campaign_channels(campaign_id);


-- =============================================================
-- 4. AUDIÊNCIAS
--
-- A audiência é separada da campanha.
--
-- Isso permite posteriormente reutilizar segmentos.
--
-- Primeira versão:
--   all_users
--   opted_in
--   supporters
--   inactive
--   custom
-- =============================================================

DO $$ BEGIN
  CREATE TYPE public.communication_audience_type AS ENUM (
    'all_users',
    'opted_in',
    'supporters',
    'inactive',
    'custom'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;


CREATE TABLE IF NOT EXISTS public.communication_audiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name TEXT NOT NULL,

  type public.communication_audience_type NOT NULL,

  description TEXT,

  -- Critérios futuros em JSON.
  -- Não usamos SQL dinâmico nesta fase.
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_by UUID REFERENCES auth.users(id)
    ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE INDEX IF NOT EXISTS idx_communication_audiences_type
  ON public.communication_audiences(type);


-- =============================================================
-- 5. CAMPAIGN AUDIENCE
--
-- Permite associar uma ou mais audiências a uma campanha.
-- =============================================================

CREATE TABLE IF NOT EXISTS public.communication_campaign_audiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  campaign_id UUID NOT NULL
    REFERENCES public.communication_campaigns(id)
    ON DELETE CASCADE,

  audience_id UUID NOT NULL
    REFERENCES public.communication_audiences(id)
    ON DELETE CASCADE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(campaign_id, audience_id)
);


CREATE INDEX IF NOT EXISTS idx_campaign_audiences_campaign
  ON public.communication_campaign_audiences(campaign_id);


-- =============================================================
-- 6. DELIVERIES
--
-- Uma linha representa uma tentativa de comunicação para
-- determinado usuário através de determinado canal.
--
-- Exemplo:
--
-- campaign A
-- user X
-- email
-- sent
--
-- campaign A
-- user X
-- in_app
-- delivered
-- =============================================================

CREATE TABLE IF NOT EXISTS public.communication_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  campaign_id UUID NOT NULL
    REFERENCES public.communication_campaigns(id)
    ON DELETE CASCADE,

  user_id UUID NOT NULL
    REFERENCES auth.users(id)
    ON DELETE CASCADE,

  channel public.communication_delivery_channel NOT NULL,

  status public.communication_delivery_status NOT NULL
    DEFAULT 'pending',

  -- Identificador retornado pelo provedor externo.
  provider_message_id TEXT,

  -- Informações técnicas adicionais.
  provider TEXT,

  -- Erro retornado pelo provedor.
  error_code TEXT,
  error_message TEXT,

  queued_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(campaign_id, user_id, channel)
);


CREATE INDEX IF NOT EXISTS idx_deliveries_campaign
  ON public.communication_deliveries(campaign_id);


CREATE INDEX IF NOT EXISTS idx_deliveries_user
  ON public.communication_deliveries(user_id);


CREATE INDEX IF NOT EXISTS idx_deliveries_status
  ON public.communication_deliveries(status);


CREATE INDEX IF NOT EXISTS idx_deliveries_pending
  ON public.communication_deliveries(status)
  WHERE status IN ('pending', 'queued');


-- =============================================================
-- 7. ATUALIZAÇÃO AUTOMÁTICA DE updated_at
-- =============================================================

CREATE OR REPLACE FUNCTION public.set_communication_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS trg_campaigns_updated_at
ON public.communication_campaigns;


CREATE TRIGGER trg_campaigns_updated_at
BEFORE UPDATE ON public.communication_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.set_communication_updated_at();


DROP TRIGGER IF EXISTS trg_audiences_updated_at
ON public.communication_audiences;


CREATE TRIGGER trg_audiences_updated_at
BEFORE UPDATE ON public.communication_audiences
FOR EACH ROW
EXECUTE FUNCTION public.set_communication_updated_at();


DROP TRIGGER IF EXISTS trg_deliveries_updated_at
ON public.communication_deliveries;


CREATE TRIGGER trg_deliveries_updated_at
BEFORE UPDATE ON public.communication_deliveries
FOR EACH ROW
EXECUTE FUNCTION public.set_communication_updated_at();


-- =============================================================
-- 8. RLS
-- =============================================================

ALTER TABLE public.communication_campaigns
ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.communication_campaign_channels
ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.communication_audiences
ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.communication_campaign_audiences
ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.communication_deliveries
ENABLE ROW LEVEL SECURITY;


-- =============================================================
-- 9. ADMIN — CAMPAIGNS
-- =============================================================

DROP POLICY IF EXISTS "Admins can manage communication campaigns"
ON public.communication_campaigns;

CREATE POLICY "Admins can manage communication campaigns"
ON public.communication_campaigns
FOR ALL
USING (
  public.has_role(
    ARRAY['super_admin', 'admin']::public.app_role[]
  )
)
WITH CHECK (
  public.has_role(
    ARRAY['super_admin', 'admin']::public.app_role[]
  )
);


-- =============================================================
-- 10. ADMIN — CHANNELS
-- =============================================================

DROP POLICY IF EXISTS "Admins can manage campaign channels"
ON public.communication_campaign_channels;

CREATE POLICY "Admins can manage campaign channels"
ON public.communication_campaign_channels
FOR ALL
USING (
  public.has_role(
    ARRAY['super_admin', 'admin']::public.app_role[]
  )
)
WITH CHECK (
  public.has_role(
    ARRAY['super_admin', 'admin']::public.app_role[]
  )
);


-- =============================================================
-- 11. ADMIN — AUDIENCES
-- =============================================================

DROP POLICY IF EXISTS "Admins can manage communication audiences"
ON public.communication_audiences;

CREATE POLICY "Admins can manage communication audiences"
ON public.communication_audiences
FOR ALL
USING (
  public.has_role(
    ARRAY['super_admin', 'admin']::public.app_role[]
  )
)
WITH CHECK (
  public.has_role(
    ARRAY['super_admin', 'admin']::public.app_role[]
  )
);


-- =============================================================
-- 12. ADMIN — CAMPAIGN AUDIENCES
-- =============================================================

DROP POLICY IF EXISTS "Admins can manage campaign audiences"
ON public.communication_campaign_audiences;

CREATE POLICY "Admins can manage campaign audiences"
ON public.communication_campaign_audiences
FOR ALL
USING (
  public.has_role(
    ARRAY['super_admin', 'admin']::public.app_role[]
  )
)
WITH CHECK (
  public.has_role(
    ARRAY['super_admin', 'admin']::public.app_role[]
  )
);


-- =============================================================
-- 13. ADMIN — DELIVERIES
--
-- Usuário comum NÃO acessa diretamente.
-- O sistema de envio / RPC controlará isso.
-- =============================================================

DROP POLICY IF EXISTS "Admins can view communication deliveries"
ON public.communication_deliveries;

CREATE POLICY "Admins can view communication deliveries"
ON public.communication_deliveries
FOR SELECT
USING (
  public.has_role(
    ARRAY['super_admin', 'admin']::public.app_role[]
  )
);


-- =============================================================
-- 14. VIEW DE RESUMO DE CAMPANHAS
-- =============================================================

CREATE OR REPLACE VIEW public.communication_campaign_stats AS
SELECT
  c.id AS campaign_id,

  c.name,
  c.type,
  c.status,

  COUNT(d.id) AS total,

  COUNT(d.id) FILTER (
    WHERE d.status = 'pending'
  ) AS pending,

  COUNT(d.id) FILTER (
    WHERE d.status = 'queued'
  ) AS queued,

  COUNT(d.id) FILTER (
    WHERE d.status = 'sent'
  ) AS sent,

  COUNT(d.id) FILTER (
    WHERE d.status = 'delivered'
  ) AS delivered,

  COUNT(d.id) FILTER (
    WHERE d.status = 'opened'
  ) AS opened,

  COUNT(d.id) FILTER (
    WHERE d.status = 'clicked'
  ) AS clicked,

  COUNT(d.id) FILTER (
    WHERE d.status = 'failed'
  ) AS failed,

  COUNT(d.id) FILTER (
    WHERE d.status = 'skipped'
  ) AS skipped

FROM public.communication_campaigns c

LEFT JOIN public.communication_deliveries d
  ON d.campaign_id = c.id

GROUP BY
  c.id,
  c.name,
  c.type,
  c.status;


-- =============================================================
-- 15. COMENTÁRIOS
-- =============================================================

COMMENT ON TABLE public.communication_campaigns IS
'Campanhas de comunicação do 3 Minutes for Life. Não realiza envio diretamente.';

COMMENT ON TABLE public.communication_campaign_channels IS
'Canais habilitados para cada campanha: in_app, email ou whatsapp.';

COMMENT ON TABLE public.communication_audiences IS
'Segmentos reutilizáveis de usuários para campanhas.';

COMMENT ON TABLE public.communication_deliveries IS
'Registro auditável de cada entrega/tentativa de comunicação.';


-- =============================================================
-- FIM
-- =============================================================