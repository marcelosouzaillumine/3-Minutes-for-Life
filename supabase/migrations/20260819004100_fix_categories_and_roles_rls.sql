-- Migration: fix_categories_and_roles_rls
-- Purpose: Grant execute on has_role to anon and add Admin policies for categories and themes

-- 1. Grant execute on has_role to anon so unauthenticated queries don't crash when evaluating RLS
GRANT EXECUTE ON FUNCTION public.has_role(public.app_role[]) TO anon;

-- 2. Add admin CRUD policies for categories
DROP POLICY IF EXISTS "Admins have full access to categories" ON public.categories;
CREATE POLICY "Admins have full access to categories"
  ON public.categories FOR ALL
  USING (
    public.has_role(ARRAY['super_admin'::public.app_role, 'admin'::public.app_role, 'editor'::public.app_role])
  );

-- 3. Add admin CRUD policies for themes
DROP POLICY IF EXISTS "Admins have full access to themes" ON public.themes;
CREATE POLICY "Admins have full access to themes"
  ON public.themes FOR ALL
  USING (
    public.has_role(ARRAY['super_admin'::public.app_role, 'admin'::public.app_role, 'editor'::public.app_role])
  );
