-- Allow authenticated users to read communication audiences.
GRANT SELECT
ON public.communication_audiences
TO authenticated;
