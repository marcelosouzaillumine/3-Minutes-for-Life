-- Allow authenticated users to create communication campaigns.
GRANT INSERT
ON public.communication_campaigns
TO authenticated;
