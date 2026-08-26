-- Allow authenticated users to add audience relationships to campaigns.
GRANT INSERT
ON public.communication_campaign_audiences
TO authenticated;
