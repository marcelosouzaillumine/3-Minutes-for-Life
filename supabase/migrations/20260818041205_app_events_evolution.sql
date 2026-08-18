-- 1. Evolve app_events table retrocompatibly
ALTER TABLE public.app_events
ADD COLUMN event_type TEXT,
ADD COLUMN content_id UUID,
ADD COLUMN entity_type TEXT,
ADD COLUMN entity_id UUID,
ADD COLUMN channel TEXT,
ADD COLUMN occurred_at TIMESTAMPTZ,
ADD COLUMN idempotency_key TEXT UNIQUE;

-- 2. Data Migration: Populate new columns from existing data
UPDATE public.app_events
SET 
  event_type = event_name,
  occurred_at = created_at
WHERE event_type IS NULL;

-- 3. Make them NOT NULL after migration
ALTER TABLE public.app_events
ALTER COLUMN event_type SET NOT NULL,
ALTER COLUMN occurred_at SET DEFAULT now(),
ALTER COLUMN occurred_at SET NOT NULL;

-- 4. Taxonomy Contract (Strict Validation)
-- Ensures the event_type conforms to the allowed taxonomy.
ALTER TABLE public.app_events
ADD CONSTRAINT app_events_event_type_check CHECK (
  event_type IN (
    -- Legacy events (kept for retrocompatibility)
    'share_initiated',
    'referral_click',
    'referral_signup',
    'daily_return',
    'shared_devotional_viewed',
    'referred_user_shared',
    -- New Event Taxonomy
    'devotional_opened',
    'content_shared',
    'testimonial_submitted',
    'testimonial_published',
    'testimonial_responded',
    'notification_sent',
    'notification_delivered',
    'notification_read',
    'user_reactivated'
  )
);

-- 5. Helper Function para inserir evento de forma segura com idempotência baseada no idempotency_key do client
CREATE OR REPLACE FUNCTION public.track_analytic_event(
    p_event_type TEXT,
    p_user_id UUID,
    p_content_id UUID DEFAULT NULL,
    p_entity_type TEXT DEFAULT NULL,
    p_entity_id UUID DEFAULT NULL,
    p_channel TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb,
    p_idempotency_key TEXT DEFAULT NULL,
    p_anonymous_id TEXT DEFAULT NULL
)
RETURNS UUID 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_new_id UUID;
BEGIN
    -- Insert mapping the retro-compatible 'event_name' too
    INSERT INTO public.app_events (
        event_name,
        event_type,
        user_id,
        content_id,
        entity_type,
        entity_id,
        channel,
        metadata,
        idempotency_key,
        anonymous_id,
        occurred_at
    ) VALUES (
        p_event_type,
        p_event_type,
        p_user_id,
        p_content_id,
        p_entity_type,
        p_entity_id,
        p_channel,
        p_metadata,
        p_idempotency_key,
        p_anonymous_id,
        now()
    )
    ON CONFLICT (idempotency_key) DO NOTHING
    RETURNING id INTO v_new_id;

    -- Se não inseriu por causa da idempotency_key (duplicate retry), recuperamos o ID existente
    IF v_new_id IS NULL AND p_idempotency_key IS NOT NULL THEN
        SELECT id INTO v_new_id FROM public.app_events WHERE idempotency_key = p_idempotency_key;
    END IF;

    RETURN v_new_id;
END;
$$;

-- Secure the function permissions
REVOKE ALL ON FUNCTION public.track_analytic_event FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_analytic_event TO authenticated;
GRANT EXECUTE ON FUNCTION public.track_analytic_event TO service_role;
