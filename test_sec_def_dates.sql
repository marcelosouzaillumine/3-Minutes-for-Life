CREATE OR REPLACE FUNCTION test_sec_def_dates(p_start_date date, p_end_date date) RETURNS int AS $$
DECLARE v_count int;
BEGIN
  SELECT count(*) INTO v_count FROM app_events WHERE occurred_at::date BETWEEN p_start_date AND p_end_date;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
