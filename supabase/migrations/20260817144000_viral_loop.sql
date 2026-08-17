-- 1. Add columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by_user_id UUID REFERENCES public.profiles(id);

-- 2. Create function to generate referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code() RETURNS text AS $$
DECLARE
    new_code text;
    done bool;
BEGIN
    done := false;
    WHILE NOT done LOOP
        -- Generate 6 uppercase alphanumeric characters (using md5 of random)
        new_code := upper(substring(md5(random()::text) from 1 for 6));
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = new_code) THEN
            done := true;
        END IF;
    END LOOP;
    RETURN new_code;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

-- 3. Trigger to auto-generate for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_referral_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.referral_code IS NULL THEN
        NEW.referral_code := public.generate_referral_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_referral_code
    BEFORE INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_referral_code();

-- Generate codes for existing users
UPDATE public.profiles SET referral_code = public.generate_referral_code() WHERE referral_code IS NULL;

-- 4. Create app_events table
CREATE TABLE public.app_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    anonymous_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS: Nobody can insert/update directly (only Edge Function using Service Role)
ALTER TABLE public.app_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public insert for app_events"
    ON public.app_events FOR INSERT
    WITH CHECK (false);

CREATE POLICY "No public update for app_events"
    ON public.app_events FOR UPDATE
    WITH CHECK (false);

CREATE POLICY "No public delete for app_events"
    ON public.app_events FOR DELETE
    USING (false);

CREATE POLICY "Users can view their own events"
    ON public.app_events FOR SELECT
    USING (auth.uid() = user_id);

-- 5. RPC attribute_referral
CREATE OR REPLACE FUNCTION public.attribute_referral(p_user_id UUID, p_referral_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_source_user_id UUID;
BEGIN
    -- Only allow if the profile exists and has NO referred_by_user_id yet (Idempotence)
    SELECT id INTO v_source_user_id 
    FROM public.profiles 
    WHERE referral_code = p_referral_code
    LIMIT 1;

    IF v_source_user_id IS NOT NULL AND v_source_user_id != p_user_id THEN
        UPDATE public.profiles
        SET referred_by_user_id = v_source_user_id
        WHERE id = p_user_id AND referred_by_user_id IS NULL;
        
        -- If a row was actually updated, return true
        RETURN FOUND;
    END IF;

    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
