CREATE OR REPLACE FUNCTION test_sec_def() RETURNS int AS $$
DECLARE v_count int;
BEGIN
  SELECT count(*) INTO v_count FROM app_events;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
