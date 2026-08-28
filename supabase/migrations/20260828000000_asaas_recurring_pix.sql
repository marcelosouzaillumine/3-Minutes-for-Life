-- =============================================================
-- Migration: 20260828000000_asaas_recurring_pix.sql
-- Description: Enhances process_payment_webhook to seamlessly handle
-- both one-time PIX and recurring PIX subscriptions (Gate 4.6).
-- =============================================================

CREATE OR REPLACE FUNCTION public.process_payment_webhook(
  p_provider TEXT,
  p_event_id TEXT,
  p_event_type TEXT,
  p_reference_id TEXT,
  p_payload JSONB
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted_id UUID;
  v_contribution_id UUID;
  v_supporter_id UUID;
  v_frequency TEXT;
  v_new_status TEXT;
  v_still_supporting BOOLEAN;
  v_sub_ref TEXT;
  v_ext_ref TEXT;
BEGIN
  -- 1. Idempotency Check & Insert
  INSERT INTO public.payment_events (provider, provider_event_id, event_type, payload)
  VALUES (p_provider, p_event_id, p_event_type, p_payload)
  ON CONFLICT (provider, provider_event_id) DO NOTHING
  RETURNING id INTO v_inserted_id;

  -- If duplicate, inserted_id is null
  IF v_inserted_id IS NULL THEN
    RETURN FALSE; -- Duplicate event safely ignored
  END IF;

  -- Extract possible subscription ID and externalReference from payload if present
  v_sub_ref := p_payload->'payment'->>'subscription';
  v_ext_ref := p_payload->'payment'->>'externalReference';

  -- 2. Validate provider_reference (Payment ID, Subscription ID, or external contribution UUID)
  SELECT id, supporter_id, frequency INTO v_contribution_id, v_supporter_id, v_frequency
  FROM public.contributions
  WHERE provider = p_provider
    AND (
      provider_reference = p_reference_id
      OR (v_sub_ref IS NOT NULL AND provider_reference = v_sub_ref)
      OR (v_ext_ref IS NOT NULL AND id::text = v_ext_ref)
      OR (id::text = p_reference_id)
    )
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_contribution_id IS NULL THEN
    RETURN TRUE; -- Unknown contribution, but webhook acknowledged
  END IF;

  -- 3. Transition Status
  IF p_event_type = 'PAYMENT_CONFIRMED' THEN
    IF v_frequency IN ('recurring', 'monthly', 'yearly') THEN
      v_new_status := 'active';
    ELSE
      v_new_status := 'completed';
    END IF;
  ELSIF p_event_type = 'PAYMENT_FAILED' THEN
    v_new_status := 'canceled';
  ELSIF p_event_type = 'RECURRING_CANCELED' THEN
    v_new_status := 'canceled';
  ELSE
    RETURN TRUE;
  END IF;

  -- 4. Mutate the contribution
  UPDATE public.contributions
  SET status = v_new_status, updated_at = now()
  WHERE id = v_contribution_id;

  -- 5. Mutate the supporter
  IF v_new_status IN ('completed', 'active') THEN
    UPDATE public.supporters
    SET status = 'active', updated_at = now()
    WHERE id = v_supporter_id;
  ELSE
    -- Check if supporter has any other active/completed contribution
    SELECT EXISTS (
      SELECT 1 FROM public.contributions
      WHERE supporter_id = v_supporter_id
        AND id <> v_contribution_id
        AND status IN ('completed', 'active')
    ) INTO v_still_supporting;

    IF NOT v_still_supporting THEN
      UPDATE public.supporters
      SET status = 'inactive', updated_at = now()
      WHERE id = v_supporter_id;
    END IF;
  END IF;

  RETURN TRUE;
END;
$$;

-- Ensure service_role permissions
GRANT EXECUTE ON FUNCTION public.process_payment_webhook(text, text, text, text, jsonb) TO service_role;
