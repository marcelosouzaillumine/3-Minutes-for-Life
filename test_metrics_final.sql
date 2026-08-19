CREATE OR REPLACE FUNCTION get_admin_dashboard_metrics_2(p_start_date date, p_end_date date) RETURNS jsonb AS $$
DECLARE
    v_previous_start date;
    v_previous_end date;
    v_curr_active_users int := 0;
    v_curr_reads int := 0;
    v_result jsonb;
BEGIN
    v_previous_end := p_start_date - 1;
    v_previous_start := v_previous_end - (p_end_date - p_start_date);

    SELECT count(DISTINCT user_id) INTO v_curr_active_users FROM app_events WHERE occurred_at::date BETWEEN p_start_date AND p_end_date;
    SELECT count(*) INTO v_curr_reads FROM app_events WHERE event_type = 'devotional_opened' AND occurred_at::date BETWEEN p_start_date AND p_end_date;

    v_result := jsonb_build_object('active_users', v_curr_active_users, 'reads', v_curr_reads);
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;
