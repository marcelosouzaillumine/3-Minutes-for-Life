-- Migration: admin_supporters_area
--
-- Backs the "Apoiadores" admin screen and closes gaps found while building it:
--
-- 1. supporters/contributions/payment_events had ZERO admin read policy —
--    only "user reads own row" existed, so no admin screen could ever query
--    them without bypassing RLS.
-- 2. process_payment_webhook() is SECURITY DEFINER but was granted EXECUTE
--    to `anon` and `authenticated` (confirmed live in production) — any
--    unauthenticated caller could invoke it directly via the REST RPC
--    endpoint with a guessed/enumerated provider_reference and forge a
--    PAYMENT_CONFIRMED event. Only the asaas-webhook Edge Function (which
--    runs as service_role) should ever call this.
-- 3. A confirmed payment never flipped public.supporters.status — the
--    webhook only updated the linked contribution's own status. Fixed by
--    having the function upsert the supporter's status alongside it.
-- 4. contributions.provider_reference (looked up on every webhook call) and
--    contributions.supporter_id had no index.
--
-- Does NOT change the live donation checkout flow (Contribute.tsx) — that
-- still needs a separate decision about creating a pending `contribution`
-- before redirecting to the Asaas hosted checkout, so real payments have
-- something for the webhook to match against.

-- =============================================================
-- 1. INDEXES
-- =============================================================

CREATE INDEX IF NOT EXISTS idx_contributions_provider_reference
  ON public.contributions(provider, provider_reference);

CREATE INDEX IF NOT EXISTS idx_contributions_supporter_id
  ON public.contributions(supporter_id);

-- =============================================================
-- 2. ADMIN RLS — READ
-- =============================================================

DROP POLICY IF EXISTS "Admins can read all supporters" ON public.supporters;
CREATE POLICY "Admins can read all supporters"
  ON public.supporters FOR SELECT
  USING (public.has_role(ARRAY['super_admin'::public.app_role, 'admin'::public.app_role]));

DROP POLICY IF EXISTS "Admins can read all contributions" ON public.contributions;
CREATE POLICY "Admins can read all contributions"
  ON public.contributions FOR SELECT
  USING (public.has_role(ARRAY['super_admin'::public.app_role, 'admin'::public.app_role]));

DROP POLICY IF EXISTS "Admins can read payment events" ON public.payment_events;
CREATE POLICY "Admins can read payment events"
  ON public.payment_events FOR SELECT
  USING (public.has_role(ARRAY['super_admin'::public.app_role, 'admin'::public.app_role]));

-- =============================================================
-- 3. ADMIN RLS — MANUAL CORRECTION
--
-- Operational escape hatch: until the checkout flow is fixed to create a
-- contribution before redirecting, some supporters will need to be marked
-- active/inactive by hand. Scoped to UPDATE only (no INSERT/DELETE) — a
-- supporter row is always created by the signup trigger's counterpart or
-- the webhook, never by an admin.
-- =============================================================

DROP POLICY IF EXISTS "Admins can update supporter status" ON public.supporters;
CREATE POLICY "Admins can update supporter status"
  ON public.supporters FOR UPDATE
  USING (public.has_role(ARRAY['super_admin'::public.app_role, 'admin'::public.app_role]))
  WITH CHECK (public.has_role(ARRAY['super_admin'::public.app_role, 'admin'::public.app_role]));

-- =============================================================
-- 4. TIGHTEN payment_events GRANTS
--
-- RLS with zero policies already denies anon/authenticated by default, so
-- this grant was inert — but it's a foot-gun for whoever adds the next
-- policy without checking. Only service_role (the webhook) should ever
-- touch this table directly.
-- =============================================================

REVOKE INSERT, UPDATE, DELETE ON public.payment_events FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.payment_events FROM authenticated;

-- =============================================================
-- 5. LOCK DOWN process_payment_webhook TO service_role ONLY
-- =============================================================

REVOKE ALL ON FUNCTION public.process_payment_webhook(text, text, text, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.process_payment_webhook(text, text, text, text, jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.process_payment_webhook(text, text, text, text, jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.process_payment_webhook(text, text, text, text, jsonb) TO service_role;

-- =============================================================
-- 6. FIX: confirmed/failed payment now updates supporters.status too
--
-- Same transition table as before, plus:
--   completed/active contribution  -> supporters.status = 'active'
--   canceled/failed contribution   -> supporters.status = 'inactive'
--     (only if the supporter has no OTHER completed/active contribution —
--      a canceled recurring charge shouldn't demote someone who has a
--      separate completed one-time contribution on file)
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
  v_new_status TEXT;
  v_still_supporting BOOLEAN;
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
  SELECT id, supporter_id INTO v_contribution_id, v_supporter_id
  FROM public.contributions
  WHERE provider_reference = p_reference_id
  AND provider = p_provider;

  IF v_contribution_id IS NULL THEN
    RETURN TRUE;
  END IF;

  -- 3. Transition Mission (determine status)
  IF p_event_type = 'PAYMENT_CONFIRMED' THEN
    v_new_status := 'completed';
  ELSIF p_event_type = 'PAYMENT_FAILED' THEN
    v_new_status := 'canceled'; -- Fixed: map failures to canceled in our domain
  ELSIF p_event_type = 'RECURRING_CANCELED' THEN
    v_new_status := 'canceled';
  ELSE
    RETURN TRUE;
  END IF;

  -- 4. Mutate the contribution
  UPDATE public.contributions
  SET status = v_new_status, updated_at = now()
  WHERE id = v_contribution_id;

  -- 5. Mutate the supporter (this was previously missing entirely)
  IF v_new_status IN ('completed', 'active') THEN
    UPDATE public.supporters
    SET status = 'active', updated_at = now()
    WHERE id = v_supporter_id;
  ELSE
    -- Only demote if no other contribution from this supporter is still
    -- completed/active — don't punish someone for one canceled charge
    -- among several successful ones.
    SELECT EXISTS (
      SELECT 1 FROM public.contributions
      WHERE supporter_id = v_supporter_id
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

-- =============================================================
-- 7. ADMIN RPC — get_admin_supporters
--
-- auth.users.email isn't exposed via PostgREST, same reasoning as
-- get_admin_users: a SECURITY DEFINER RPC that self-checks the caller's
-- role, mirroring get_admin_dashboard_metrics / get_admin_users.
-- =============================================================

CREATE OR REPLACE FUNCTION public.get_admin_supporters(
  p_search text DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  supporter_id uuid,
  user_id uuid,
  email text,
  full_name text,
  status text,
  total_contributed_cents bigint,
  contribution_count bigint,
  last_contribution_at timestamptz,
  last_contribution_amount_cents integer,
  last_contribution_status text,
  last_contribution_frequency text,
  last_contribution_provider text,
  supporter_since timestamptz,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(ARRAY['super_admin'::public.app_role, 'admin'::public.app_role]) THEN
    RAISE EXCEPTION 'Access Denied: Requires admin role';
  END IF;

  RETURN QUERY
  WITH contribution_agg AS (
    SELECT
      c.supporter_id,
      SUM(c.amount) FILTER (WHERE c.status IN ('completed', 'active')) AS total_cents,
      COUNT(*) AS contrib_count
    FROM public.contributions c
    GROUP BY c.supporter_id
  ),
  last_contribution AS (
    SELECT DISTINCT ON (c.supporter_id)
      c.supporter_id,
      c.created_at,
      c.amount,
      c.status,
      c.frequency,
      c.provider
    FROM public.contributions c
    ORDER BY c.supporter_id, c.created_at DESC
  )
  SELECT
    s.id,
    s.user_id,
    u.email::text,
    p.full_name,
    s.status,
    COALESCE(ca.total_cents, 0),
    COALESCE(ca.contrib_count, 0),
    lc.created_at,
    lc.amount,
    lc.status,
    lc.frequency,
    lc.provider,
    s.created_at,
    COUNT(*) OVER() AS total_count
  FROM public.supporters s
  JOIN auth.users u ON u.id = s.user_id
  LEFT JOIN public.profiles p ON p.id = s.user_id
  LEFT JOIN contribution_agg ca ON ca.supporter_id = s.id
  LEFT JOIN last_contribution lc ON lc.supporter_id = s.id
  WHERE
    (p_status IS NULL OR p_status = '' OR s.status = p_status)
    AND (
      p_search IS NULL OR p_search = ''
      OR u.email ILIKE '%' || p_search || '%'
      OR p.full_name ILIKE '%' || p_search || '%'
    )
  ORDER BY s.updated_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_supporters(text, text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_supporters(text, text, integer, integer) TO authenticated;
