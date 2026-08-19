CREATE OR REPLACE FUNCTION test_sec_def_dates_debug(p_start_date date, p_end_date date) RETURNS jsonb AS $$
DECLARE v_dates jsonb;
BEGIN
  SELECT jsonb_agg(jsonb_build_object('occurred_at', occurred_at, 'cast_date', occurred_at::date, 'start', p_start_date, 'end', p_end_date, 'matches', occurred_at::date BETWEEN p_start_date AND p_end_date))
  INTO v_dates FROM app_events LIMIT 2;
  RETURN v_dates;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
