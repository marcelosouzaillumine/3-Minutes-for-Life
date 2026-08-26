-- Allow authenticated users to read campaign channels.
GRANT SELECT
ON public.communication_campaign_channels
TO authenticated;
