-- 1. Create relationship_audit_log table
CREATE TABLE IF NOT EXISTS public.relationship_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('testimonial', 'prayer_request')),
  relationship_id UUID NOT NULL,
  action TEXT NOT NULL DEFAULT 'status_changed',
  previous_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for querying audit history
CREATE INDEX IF NOT EXISTS idx_relationship_audit_log_rel ON public.relationship_audit_log(relationship_type, relationship_id);
CREATE INDEX IF NOT EXISTS idx_relationship_audit_log_admin ON public.relationship_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_relationship_audit_log_created ON public.relationship_audit_log(created_at DESC);

-- Enable RLS on relationship_audit_log
ALTER TABLE public.relationship_audit_log ENABLE ROW LEVEL SECURITY;

-- Only super_admin and admin can view audit logs
DROP POLICY IF EXISTS "Admins can view relationship audit log" ON public.relationship_audit_log;
CREATE POLICY "Admins can view relationship audit log" ON public.relationship_audit_log
  FOR SELECT
  USING (public.has_role(ARRAY['super_admin', 'admin']::public.app_role[]));

-- 2. RLS for SELECT on testimonials (strictly super_admin and admin)
DROP POLICY IF EXISTS "Admins can view all testimonials" ON public.testimonials;
CREATE POLICY "Admins can view all testimonials" ON public.testimonials
  FOR SELECT
  USING (public.has_role(ARRAY['super_admin', 'admin']::public.app_role[]));

-- 3. RLS for SELECT on prayer_requests (strictly super_admin and admin)
DROP POLICY IF EXISTS "Admins can view all prayer requests" ON public.prayer_requests;
CREATE POLICY "Admins can view all prayer requests" ON public.prayer_requests
  FOR SELECT
  USING (public.has_role(ARRAY['super_admin', 'admin']::public.app_role[]));

-- 4. RLS for SELECT on profiles for name resolution
DROP POLICY IF EXISTS "Admins can view profiles for relationship" ON public.profiles;
CREATE POLICY "Admins can view profiles for relationship" ON public.profiles
  FOR SELECT
  USING (public.has_role(ARRAY['super_admin', 'admin']::public.app_role[]));

-- 5. Secure RPC: update_relationship_status
-- Enforces:
-- a) Strict role authorization (super_admin / admin)
-- b) Explicit state transition matrix
-- c) Mutates strictly the status column
-- d) Automatically writes to relationship_audit_log without storing personal content
CREATE OR REPLACE FUNCTION public.update_relationship_status(
  p_relationship_type TEXT,
  p_relationship_id UUID,
  p_new_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
  v_old_status TEXT;
  v_is_valid_transition BOOLEAN := FALSE;
BEGIN
  -- Authenticate admin
  v_admin_id := auth.uid();
  IF v_admin_id IS NULL OR NOT public.has_role(ARRAY['super_admin', 'admin']::public.app_role[]) THEN
    RAISE EXCEPTION 'Unauthorized: User is not an authorized administrator';
  END IF;

  -- Validate input parameters
  IF p_relationship_type NOT IN ('testimonial', 'prayer_request') THEN
    RAISE EXCEPTION 'Invalid relationship type: %', p_relationship_type;
  END IF;

  -- Process Testimonial status transition
  IF p_relationship_type = 'testimonial' THEN
    SELECT status::text INTO v_old_status
    FROM public.testimonials
    WHERE id = p_relationship_id;

    IF v_old_status IS NULL THEN
      RAISE EXCEPTION 'Testimonial not found: %', p_relationship_id;
    END IF;

    -- If status hasn't changed, return current state
    IF v_old_status = p_new_status THEN
      RETURN jsonb_build_object(
        'success', TRUE,
        'relationship_id', p_relationship_id,
        'previous_status', v_old_status,
        'new_status', p_new_status,
        'modified', FALSE
      );
    END IF;

    -- Strict state transition matrix for testimonials
    -- pending <-> reviewed, pending <-> archived, reviewed <-> archived
    IF (v_old_status = 'pending' AND p_new_status IN ('reviewed', 'archived')) OR
       (v_old_status = 'reviewed' AND p_new_status IN ('pending', 'archived')) OR
       (v_old_status = 'archived' AND p_new_status IN ('pending', 'reviewed')) THEN
      v_is_valid_transition := TRUE;
    END IF;

    IF NOT v_is_valid_transition THEN
      RAISE EXCEPTION 'Invalid status transition for testimonial from "%" to "%"', v_old_status, p_new_status;
    END IF;

    -- Execute mutation strictly on status and updated_at
    UPDATE public.testimonials
    SET status = p_new_status::testimonial_status,
        updated_at = NOW()
    WHERE id = p_relationship_id;

  -- Process Prayer Request status transition
  ELSIF p_relationship_type = 'prayer_request' THEN
    SELECT status INTO v_old_status
    FROM public.prayer_requests
    WHERE id = p_relationship_id;

    IF v_old_status IS NULL THEN
      RAISE EXCEPTION 'Prayer request not found: %', p_relationship_id;
    END IF;

    -- If status hasn't changed, return current state
    IF v_old_status = p_new_status THEN
      RETURN jsonb_build_object(
        'success', TRUE,
        'relationship_id', p_relationship_id,
        'previous_status', v_old_status,
        'new_status', p_new_status,
        'modified', FALSE
      );
    END IF;

    -- Strict state transition matrix for prayer requests
    -- pending <-> prayed, pending <-> archived, prayed <-> archived
    IF (v_old_status = 'pending' AND p_new_status IN ('prayed', 'archived')) OR
       (v_old_status = 'prayed' AND p_new_status IN ('pending', 'archived')) OR
       (v_old_status = 'archived' AND p_new_status IN ('pending', 'prayed')) THEN
      v_is_valid_transition := TRUE;
    END IF;

    IF NOT v_is_valid_transition THEN
      RAISE EXCEPTION 'Invalid status transition for prayer request from "%" to "%"', v_old_status, p_new_status;
    END IF;

    -- Execute mutation strictly on status and updated_at
    UPDATE public.prayer_requests
    SET status = p_new_status,
        updated_at = NOW()
    WHERE id = p_relationship_id;
  END IF;

  -- Write strictly to relationship_audit_log (NO personal content or sensitive data is stored)
  INSERT INTO public.relationship_audit_log (
    admin_user_id,
    relationship_type,
    relationship_id,
    action,
    previous_status,
    new_status,
    created_at
  ) VALUES (
    v_admin_id,
    p_relationship_type,
    p_relationship_id,
    'status_changed',
    v_old_status,
    p_new_status,
    NOW()
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'relationship_id', p_relationship_id,
    'previous_status', v_old_status,
    'new_status', p_new_status,
    'modified', TRUE
  );
END;
$$;

-- Grant execution to authenticated users (role authorization is enforced inside the function)
GRANT EXECUTE ON FUNCTION public.update_relationship_status(TEXT, UUID, TEXT) TO authenticated;
