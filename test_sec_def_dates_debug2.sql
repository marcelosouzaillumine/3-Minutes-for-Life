CREATE OR REPLACE FUNCTION test_sec_def_dates_debug2(p_start_date date, p_end_date date) RETURNS jsonb AS $$
DECLARE 
  v_count int;
  v_count_match int;
  v_first_occurred_at timestamp with time zone;
  v_first_occurred_date date;
BEGIN
  SELECT count(*) INTO v_count FROM app_events;
  SELECT count(*) INTO v_count_match FROM app_events WHERE occurred_at::date BETWEEN p_start_date AND p_end_date;
  SELECT min(occurred_at) INTO v_first_occurred_at FROM app_events;
  SELECT min(occurred_at::date) INTO v_first_occurred_date FROM app_events;
  
  RETURN jsonb_build_object(
    'total_count', v_count, 
    'match_count', v_count_match,
    'p_start', p_start_date,
    'p_end', p_end_date,
    'first_occurred_at', v_first_occurred_at,
    'first_occurred_date', v_first_occurred_date
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
