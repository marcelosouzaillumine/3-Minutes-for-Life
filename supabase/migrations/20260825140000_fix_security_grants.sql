-- =============================================================
-- SECURITY FIX — 3 Minutes for Life
-- Remove privilégios excessivos de anon/authenticated
-- em funções e tabelas administrativas.
-- =============================================================

-- -------------------------------------------------------------
-- relationship_replies
-- -------------------------------------------------------------

REVOKE ALL
ON public.relationship_replies
FROM anon;

REVOKE ALL
ON public.relationship_replies
FROM authenticated;

GRANT SELECT
ON public.relationship_replies
TO authenticated;

-- -------------------------------------------------------------
-- record_relationship_reply
-- -------------------------------------------------------------

REVOKE ALL
ON FUNCTION public.record_relationship_reply(TEXT, UUID, TEXT, TEXT)
FROM anon;

GRANT EXECUTE
ON FUNCTION public.record_relationship_reply(TEXT, UUID, TEXT, TEXT)
TO authenticated;

GRANT EXECUTE
ON FUNCTION public.record_relationship_reply(TEXT, UUID, TEXT, TEXT)
TO service_role;

-- -------------------------------------------------------------
-- get_relationship_contact
-- -------------------------------------------------------------

REVOKE ALL
ON FUNCTION public.get_relationship_contact(TEXT, UUID)
FROM anon;

GRANT EXECUTE
ON FUNCTION public.get_relationship_contact(TEXT, UUID)
TO authenticated;

GRANT EXECUTE
ON FUNCTION public.get_relationship_contact(TEXT, UUID)
TO service_role;

-- -------------------------------------------------------------
-- communication_deliveries
-- -------------------------------------------------------------

REVOKE ALL
ON public.communication_deliveries
FROM anon;

REVOKE ALL
ON public.communication_deliveries
FROM authenticated;

GRANT ALL
ON public.communication_deliveries
TO service_role;

-- -------------------------------------------------------------
-- communication_campaigns
-- -------------------------------------------------------------

REVOKE ALL
ON public.communication_campaigns
FROM anon;

REVOKE ALL
ON public.communication_campaigns
FROM authenticated;

-- -------------------------------------------------------------
-- communication_campaign_channels
-- -------------------------------------------------------------

REVOKE ALL
ON public.communication_campaign_channels
FROM anon;

REVOKE ALL
ON public.communication_campaign_channels
FROM authenticated;

-- -------------------------------------------------------------
-- communication_audiences
-- -------------------------------------------------------------

REVOKE ALL
ON public.communication_audiences
FROM anon;

REVOKE ALL
ON public.communication_audiences
FROM authenticated;

-- -------------------------------------------------------------
-- communication_campaign_audiences
-- -------------------------------------------------------------

REVOKE ALL
ON public.communication_campaign_audiences
FROM anon;

REVOKE ALL
ON public.communication_campaign_audiences
FROM authenticated;

-- -------------------------------------------------------------
-- communication_consents
-- -------------------------------------------------------------

REVOKE ALL
ON public.communication_consents
FROM anon;

REVOKE ALL
ON public.communication_consents
FROM authenticated;

-- -------------------------------------------------------------
-- FIM
-- =============================================================
