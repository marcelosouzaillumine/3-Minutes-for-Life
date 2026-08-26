-- Migration: admin_dashboard_charts
--
-- Adds a small, independent RPC to back a daily trend chart on the admin
-- Intelligence Center. Deliberately NOT touching get_admin_dashboard_metrics
-- (v4, 648 lines, cross-device identity resolution) — that function is
-- complex, has no test coverage, and there is no one awake tonight to
-- verify a change against real data. This new function is a simple,
-- easy-to-verify daily count (not full historical device-merge identity),
-- good enough for a trend line without touching the top-line KPI logic.

CREATE OR REPLACE FUNCTION public.get_admin_dashboard_daily_series(
  p_start_date date,
  p_end_date date
)
RETURNS TABLE (
  day date,
  active_users integer,
  reads integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_start_date IS NULL OR p_end_date IS NULL THEN
    RAISE EXCEPTION 'Start date and end date are required';
  END IF;

  IF p_start_date > p_end_date THEN
    RAISE EXCEPTION 'Start date cannot be greater than end date';
  END IF;

  IF NOT public.has_role(ARRAY['super_admin'::public.app_role, 'admin'::public.app_role, 'analyst'::public.app_role]) THEN
    RAISE EXCEPTION 'Access Denied: Requires admin or analyst role';
  END IF;

  RETURN QUERY
  WITH days AS (
    SELECT generate_series(p_start_date, p_end_date, interval '1 day')::date AS day
  )
  SELECT
    d.day,
    COALESCE((
      SELECT COUNT(DISTINCT COALESCE(ae.user_id::text, ae.anonymous_id))
      FROM public.app_events ae
      WHERE ae.occurred_at::date = d.day
    ), 0)::integer AS active_users,
    COALESCE((
      SELECT COUNT(*)
      FROM public.app_events ae
      WHERE ae.occurred_at::date = d.day
        AND ae.event_type = 'devotional_opened'
    ), 0)::integer AS reads
  FROM days d
  ORDER BY d.day;
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_dashboard_daily_series(date, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_daily_series(date, date) TO authenticated;
