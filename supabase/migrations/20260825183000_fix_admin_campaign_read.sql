-- Allow authenticated users to read communication campaigns.
-- Admin authorization remains enforced by application/RLS.

GRANT SELECT
ON public.communication_campaigns
TO authenticated;
