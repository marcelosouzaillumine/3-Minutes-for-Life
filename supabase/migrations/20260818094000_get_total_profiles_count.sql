CREATE OR REPLACE FUNCTION public.get_total_profiles_count()
RETURNS INTEGER AS $$
DECLARE
    total_count INTEGER;
BEGIN
    SELECT count(*) INTO total_count FROM public.profiles;
    RETURN total_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
