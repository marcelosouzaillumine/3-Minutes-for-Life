-- Revoke default public execution privileges to harden the trust boundary
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

-- Ensure the trigger function explicitly declares its search_path to prevent hijacking
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- For completeness, also secure the updated_at trigger
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM authenticated;

ALTER FUNCTION public.handle_updated_at() SET search_path = public;
