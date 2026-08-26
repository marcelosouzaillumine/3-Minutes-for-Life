-- Migration: admin_users_directory
-- Purpose: Backs the "Usuários" admin screen with a paginated, searchable
-- directory of accounts. auth.users is not exposed via PostgREST, so this
-- is read through a SECURITY DEFINER RPC that self-checks the caller's role
-- (mirrors the pattern used by get_admin_dashboard_metrics).
--
-- Role assignment/revocation does NOT need a new RPC: public.user_roles
-- already has RLS restricting writes to super_admin (see admin_roles
-- migration), and INSERT/UPDATE/DELETE grants to `authenticated` already
-- exist — the admin UI can just write to that table directly.

CREATE OR REPLACE FUNCTION public.get_admin_users(
  p_search text DEFAULT NULL,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  roles text[],
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
  SELECT
    u.id,
    u.email::text,
    p.full_name,
    p.avatar_url,
    u.created_at,
    u.last_sign_in_at,
    COALESCE(
      (
        SELECT array_agg(ur.role::text ORDER BY ur.role::text)
        FROM public.user_roles ur
        WHERE ur.user_id = u.id AND ur.revoked_at IS NULL
      ),
      ARRAY[]::text[]
    ) AS roles,
    COUNT(*) OVER() AS total_count
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE
    p_search IS NULL
    OR p_search = ''
    OR u.email ILIKE '%' || p_search || '%'
    OR p.full_name ILIKE '%' || p_search || '%'
  ORDER BY u.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_users(text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_users(text, integer, integer) TO authenticated;
