CREATE OR REPLACE FUNCTION test_metrics_3(p_start_date date, p_end_date date) RETURNS int AS $$
DECLARE v_res int;
BEGIN
  SELECT count(*) INTO v_res FROM app_events WHERE occurred_at::date BETWEEN p_start_date AND p_end_date;
  RETURN v_res;
END;
$$ LANGUAGE plpgsql;
SELECT test_metrics_3('2026-08-12', '2026-08-19');
