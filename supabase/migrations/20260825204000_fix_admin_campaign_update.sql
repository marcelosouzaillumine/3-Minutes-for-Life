-- Allow authenticated users to update communication campaigns.
GRANT UPDATE
ON public.communication_campaigns
TO authenticated;
