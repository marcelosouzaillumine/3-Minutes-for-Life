
-- =============================================================
-- FASE 2 — EXECUÇÃO DE CAMPANHAS
-- =============================================================

-- -------------------------------------------------------------
-- 1. GERAR DELIVERIES
-- -------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.prepare_communication_campaign(
  p_campaign_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_campaign RECORD;
  v_created INTEGER := 0;
BEGIN

  SELECT *
  INTO v_campaign
  FROM public.communication_campaigns
  WHERE id = p_campaign_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Campanha não encontrada.';
  END IF;

  IF v_campaign.status NOT IN ('draft', 'scheduled') THEN
    RAISE EXCEPTION 'Campanha não pode ser preparada no status atual: %',
      v_campaign.status;
  END IF;

  -- ===========================================================
  -- IN-APP
  -- ===========================================================

  IF EXISTS (
    SELECT 1
    FROM public.communication_campaign_channels
    WHERE campaign_id = p_campaign_id
      AND channel = 'in_app'
      AND enabled = TRUE
  ) THEN

    INSERT INTO public.communication_deliveries (
      campaign_id,
      user_id,
      channel,
      status
    )
    SELECT DISTINCT
      p_campaign_id,
      p.id,
      'in_app',
      'pending'
    FROM public.profiles p
    INNER JOIN public.communication_campaign_audiences ca
      ON ca.campaign_id = p_campaign_id
    INNER JOIN public.communication_audiences a
      ON a.id = ca.audience_id
    WHERE
      (
        a.type = 'all_users'
        OR a.type = 'opted_in'
        OR (
          a.type = 'supporters'
          AND EXISTS (
            SELECT 1
            FROM public.subscriptions s
            WHERE s.user_id = p.id
              AND s.status = 'active'
          )
        )
      )
    ON CONFLICT (campaign_id, user_id, channel)
    DO NOTHING;

  END IF;


  -- ===========================================================
  -- EMAIL
  -- Somente usuários com consentimento vigente.
  -- ===========================================================

  IF EXISTS (
    SELECT 1
    FROM public.communication_campaign_channels
    WHERE campaign_id = p_campaign_id
      AND channel = 'email'
      AND enabled = TRUE
  ) THEN

    INSERT INTO public.communication_deliveries (
      campaign_id,
      user_id,
      channel,
      status
    )
    SELECT DISTINCT
      p_campaign_id,
      p.id,
      'email',
      'pending'
    FROM public.profiles p
    INNER JOIN public.communication_campaign_audiences ca
      ON ca.campaign_id = p_campaign_id
    INNER JOIN public.communication_audiences a
      ON a.id = ca.audience_id

    INNER JOIN public.current_communication_consents cc
      ON cc.user_id = p.id
      AND cc.channel = 'email'
      AND cc.granted = TRUE

    WHERE
      p.email IS NOT NULL
      AND (
        a.type = 'all_users'
        OR a.type = 'opted_in'
        OR (
          a.type = 'supporters'
          AND EXISTS (
            SELECT 1
            FROM public.subscriptions s
            WHERE s.user_id = p.id
            AND s.status = 'active'
          )
        )
      )

    ON CONFLICT (campaign_id, user_id, channel)
    DO NOTHING;

  END IF;


  -- ===========================================================
  -- MARCA COMO SENDING
  -- ===========================================================

  UPDATE public.communication_campaigns
  SET
    status = 'sending',
    started_at = NOW()
  WHERE id = p_campaign_id;


  SELECT COUNT(*)
  INTO v_created
  FROM public.communication_deliveries
  WHERE campaign_id = p_campaign_id;


  RETURN jsonb_build_object(
    'success', TRUE,
    'campaign_id', p_campaign_id,
    'deliveries', v_created
  );

END;
$$;


GRANT EXECUTE ON FUNCTION
public.prepare_communication_campaign(UUID)
TO service_role;


-- =============================================================
-- 2. PROCESSAR CAMPANHAS AGENDADAS
-- =============================================================

CREATE OR REPLACE FUNCTION public.process_scheduled_communication_campaigns()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_campaign RECORD;
  v_processed INTEGER := 0;
BEGIN

  FOR v_campaign IN
    SELECT id
    FROM public.communication_campaigns
    WHERE status = 'scheduled'
      AND scheduled_at IS NOT NULL
      AND scheduled_at <= NOW()
    ORDER BY scheduled_at ASC
    LIMIT 20
  LOOP

    PERFORM public.prepare_communication_campaign(
      v_campaign.id
    );

    v_processed := v_processed + 1;

  END LOOP;


  RETURN jsonb_build_object(
    'success', TRUE,
    'processed', v_processed
  );

END;
$$;


GRANT EXECUTE ON FUNCTION
public.process_scheduled_communication_campaigns()
TO service_role;


-- =============================================================
-- 3. ÍNDICE
-- =============================================================

CREATE INDEX IF NOT EXISTS
idx_communication_campaigns_ready
ON public.communication_campaigns (
  scheduled_at
)
WHERE status = 'scheduled';


-- =============================================================
-- 4. CRON
-- =============================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.unschedule('communication-campaign-scheduler')
WHERE EXISTS (
  SELECT 1
  FROM cron.job
  WHERE jobname = 'communication-campaign-scheduler'
);

SELECT cron.schedule(
  'communication-campaign-scheduler',
  '* * * * *',
  $$
  SELECT public.process_scheduled_communication_campaigns();
  $$
);

