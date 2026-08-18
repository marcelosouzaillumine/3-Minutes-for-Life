-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM (
  'super_admin',
  'admin',
  'editor',
  'moderator',
  'analyst'
);

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ
);

-- Um usuário só pode ter um mesmo papel ativo por vez (Partial Unique Index é melhor que EXCLUDE GIST)
CREATE UNIQUE INDEX idx_user_roles_active ON public.user_roles (user_id, role) WHERE revoked_at IS NULL;

-- 3. Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO service_role;

-- 4. Create helper function for RLS (SECURITY DEFINER with strict search_path)
CREATE OR REPLACE FUNCTION public.has_role(required_roles public.app_role[])
RETURNS boolean 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_access boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = ANY(required_roles)
      AND revoked_at IS NULL
  ) INTO has_access;
  
  RETURN has_access;
END;
$$;

-- Secure the function permissions
REVOKE ALL ON FUNCTION public.has_role(public.app_role[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(public.app_role[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(public.app_role[]) TO service_role;

-- 5. Create policies
-- Policy 1: Users can read their own roles
CREATE POLICY "Users can read their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Admins and Super Admins can read all roles
CREATE POLICY "Admins can read all roles"
  ON public.user_roles
  FOR SELECT
  USING (public.has_role(ARRAY['super_admin'::public.app_role, 'admin'::public.app_role]));

-- Policy 3: Only Super Admins can manage roles
CREATE POLICY "Only super_admins can manage roles"
  ON public.user_roles
  FOR ALL
  USING (public.has_role(ARRAY['super_admin'::public.app_role]))
  WITH CHECK (public.has_role(ARRAY['super_admin'::public.app_role]));
