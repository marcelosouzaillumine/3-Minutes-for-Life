-- Allow authenticated users to create and update campaign channels.
GRANT INSERT, UPDATE
ON public.communication_campaign_channels
TO authenticated;
