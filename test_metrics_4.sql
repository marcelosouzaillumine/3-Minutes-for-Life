CREATE OR REPLACE FUNCTION test_metrics_4(p_start_date date, p_end_date date) RETURNS TABLE(occurred date, s_date date, matches boolean) AS $$
BEGIN
  RETURN QUERY SELECT occurred_at::date, p_start_date, (occurred_at::date BETWEEN p_start_date AND p_end_date) FROM app_events LIMIT 5;
END;
$$ LANGUAGE plpgsql;
SELECT * FROM test_metrics_4('2026-08-12', '2026-08-19');
