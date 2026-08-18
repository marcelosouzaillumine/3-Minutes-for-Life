CREATE OR REPLACE FUNCTION public.get_referrer_name(p_referral_code TEXT)
RETURNS TEXT AS $$
DECLARE
    v_full_name TEXT;
BEGIN
    SELECT full_name INTO v_full_name
    FROM public.profiles
    WHERE referral_code = p_referral_code
    LIMIT 1;

    RETURN v_full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
