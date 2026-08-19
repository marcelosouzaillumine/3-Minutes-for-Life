-- Migration: fix_admin_rls
-- Purpose: Use SECURITY DEFINER function to prevent permission denied errors for anon users

DROP POLICY IF EXISTS "Admins have full access to devotionals" ON public.devotionals;
CREATE POLICY "Admins have full access to devotionals"
  ON public.devotionals FOR ALL
  USING (
    public.has_role(ARRAY['super_admin'::public.app_role, 'admin'::public.app_role, 'editor'::public.app_role])
  );

DROP POLICY IF EXISTS "Admins have full access to translations" ON public.devotional_translations;
CREATE POLICY "Admins have full access to translations"
  ON public.devotional_translations FOR ALL
  USING (
    public.has_role(ARRAY['super_admin'::public.app_role, 'admin'::public.app_role, 'editor'::public.app_role])
  );
