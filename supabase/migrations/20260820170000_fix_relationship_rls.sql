-- Fix admin RLS policies for relationship management.
-- Rewrites SELECT policies to use direct user_roles lookup instead of has_role()
-- to avoid potential issues with function execution context.

-- Prayer Requests: drop and recreate admin SELECT policy
DROP POLICY IF EXISTS "Admins can view all prayer requests" ON public.prayer_requests;
CREATE POLICY "Admins can view all prayer requests" ON public.prayer_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('super_admin', 'admin')
        AND ur.revoked_at IS NULL
    )
  );

-- Testimonials: drop and recreate admin SELECT policy
DROP POLICY IF EXISTS "Admins can view all testimonials" ON public.testimonials;
CREATE POLICY "Admins can view all testimonials" ON public.testimonials
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('super_admin', 'admin')
        AND ur.revoked_at IS NULL
    )
  );

-- Profiles: drop and recreate admin SELECT policy (self OR admin)
DROP POLICY IF EXISTS "Admins can view profiles for relationship" ON public.profiles;
CREATE POLICY "Admins can view profiles for relationship" ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('super_admin', 'admin')
        AND ur.revoked_at IS NULL
    )
  );
