CREATE OR REPLACE FUNCTION public.get_telemetry_health()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_result JSONB;
BEGIN
  -- Verificar permissão
  SELECT role INTO v_role FROM user_roles WHERE user_id = auth.uid();
  IF v_role NOT IN ('super_admin', 'admin', 'analyst') THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  WITH stats AS (
    SELECT 
      CASE 
        WHEN user_id IS NULL AND anonymous_id IS NOT NULL THEN 'anonymous_only'
        WHEN user_id IS NOT NULL AND anonymous_id IS NOT NULL THEN 'authenticated_with_anonymous'
        WHEN user_id IS NOT NULL AND anonymous_id IS NULL THEN 'authenticated_without_anonymous'
        ELSE 'both_null'
      END AS identity_state,
      COUNT(*) as event_count
    FROM app_events
    GROUP BY 1
  ),
  total_events AS (
    SELECT SUM(event_count) as total FROM stats
  )
  SELECT jsonb_agg(jsonb_build_object(
    'identity_state', s.identity_state,
    'event_count', s.event_count,
    'percentage', ROUND((s.event_count * 100.0) / NULLIF(t.total, 0), 2)
  )) INTO v_result
  FROM stats s
  CROSS JOIN total_events t;

  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_telemetry_health() TO anon, authenticated, service_role;

