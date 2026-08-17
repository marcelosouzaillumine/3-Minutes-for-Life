-- Create RPC to process payment webhooks transactionally
CREATE OR REPLACE FUNCTION public.process_payment_webhook(
  p_provider TEXT,
  p_event_id TEXT,
  p_event_type TEXT,
  p_reference_id TEXT,
  p_payload JSONB
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inserted_id UUID;
  v_contribution_id UUID;
  v_new_status TEXT;
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

  -- 2. Validate provider_reference (G8 Cross-Reference Integrity)
  SELECT id INTO v_contribution_id 
  FROM public.contributions 
  WHERE provider_reference = p_reference_id
  AND provider = p_provider;

  IF v_contribution_id IS NULL THEN
    -- Event is stored, but we don't mutate unknown references.
    -- Returning TRUE because the event itself was novel and ingested successfully.
    RETURN TRUE;
  END IF;

  -- 3. Transition Mission (determine status)
  IF p_event_type = 'PAYMENT_CONFIRMED' THEN
    v_new_status := 'completed';
  ELSIF p_event_type = 'PAYMENT_FAILED' THEN
    v_new_status := 'failed';
  ELSIF p_event_type = 'RECURRING_CANCELED' THEN
    v_new_status := 'canceled';
  ELSE
    -- Other events (like AUTHORIZATION_ACTIVE) might not change status immediately 
    -- in the One-Time flow, but we accept them.
    RETURN TRUE;
  END IF;

  -- 4. Mutate
  UPDATE public.contributions
  SET status = v_new_status, updated_at = now()
  WHERE id = v_contribution_id;

  RETURN TRUE;
END;
$$;
