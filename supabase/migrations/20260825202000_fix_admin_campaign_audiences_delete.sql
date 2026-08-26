-- Allow authenticated users to remove campaign-audience relationships
-- when synchronizing the audience selection of a campaign.
GRANT DELETE
ON public.communication_campaign_audiences
TO authenticated;
