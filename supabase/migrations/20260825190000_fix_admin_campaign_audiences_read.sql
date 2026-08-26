-- Allow authenticated users to read campaign-audience relationships.
GRANT SELECT
ON public.communication_campaign_audiences
TO authenticated;
