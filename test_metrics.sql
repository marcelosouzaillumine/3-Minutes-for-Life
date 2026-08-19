CREATE OR REPLACE FUNCTION public.test_metrics(
    p_start_date date,
    p_end_date date
) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
    -- ... [Same logic as get_admin_dashboard_metrics, but no has_role check] ...
    v_previous_start date;
    v_previous_end date;
    v_curr_active_users int := 0; v_prev_active_users int := 0;
    v_curr_reads int := 0; v_prev_reads int := 0;
    v_curr_shares int := 0; v_prev_shares int := 0;
    v_curr_testimonials int := 0; v_prev_testimonials int := 0;
    v_funnel_accessed int := 0; v_funnel_read int := 0; v_funnel_shared int := 0;
    v_funnel_testified int := 0; v_funnel_responded int := 0; v_funnel_returned int := 0;
    v_cohort_users int := 0; v_d1 int := 0; v_d3 int := 0; v_d7 int := 0; v_d30 int := 0;
    v_pending_testimonials int := 0; v_delayed_responses int := 0;
    v_result jsonb;
BEGIN
    v_previous_end := p_start_date - 1;
    v_previous_start := v_previous_end - (p_end_date - p_start_date);

    SELECT count(DISTINCT user_id) INTO v_curr_active_users FROM app_events WHERE occurred_at::date BETWEEN p_start_date AND p_end_date;
    SELECT count(*) INTO v_curr_reads FROM app_events WHERE event_type = 'devotional_opened' AND occurred_at::date BETWEEN p_start_date AND p_end_date;
    SELECT count(*) INTO v_curr_shares FROM app_events WHERE event_type = 'content_shared' AND occurred_at::date BETWEEN p_start_date AND p_end_date;
    SELECT count(*) INTO v_curr_testimonials FROM app_events WHERE event_type = 'testimonial_submitted' AND occurred_at::date BETWEEN p_start_date AND p_end_date;

    SELECT count(DISTINCT user_id) INTO v_prev_active_users FROM app_events WHERE occurred_at::date BETWEEN v_previous_start AND v_previous_end;
    SELECT count(*) INTO v_prev_reads FROM app_events WHERE event_type = 'devotional_opened' AND occurred_at::date BETWEEN v_previous_start AND v_previous_end;
    SELECT count(*) INTO v_prev_shares FROM app_events WHERE event_type = 'content_shared' AND occurred_at::date BETWEEN v_previous_start AND v_previous_end;
    SELECT count(*) INTO v_prev_testimonials FROM app_events WHERE event_type = 'testimonial_submitted' AND occurred_at::date BETWEEN v_previous_start AND v_previous_end;

    v_funnel_accessed := v_curr_active_users;
    SELECT count(DISTINCT user_id) INTO v_funnel_read FROM app_events WHERE event_type = 'devotional_opened' AND occurred_at::date BETWEEN p_start_date AND p_end_date;
    SELECT count(DISTINCT user_id) INTO v_funnel_shared FROM app_events WHERE event_type = 'content_shared' AND occurred_at::date BETWEEN p_start_date AND p_end_date;
    SELECT count(DISTINCT user_id) INTO v_funnel_testified FROM app_events WHERE event_type = 'testimonial_submitted' AND occurred_at::date BETWEEN p_start_date AND p_end_date;
    SELECT count(DISTINCT user_id) INTO v_funnel_responded FROM app_events WHERE event_type = 'testimonial_responded' AND occurred_at::date BETWEEN p_start_date AND p_end_date;

    SELECT count(DISTINCT r.user_id) INTO v_funnel_returned
    FROM app_events r
    JOIN app_events resp ON resp.user_id = r.user_id AND resp.event_type = 'testimonial_responded' AND resp.occurred_at::date BETWEEN p_start_date AND p_end_date
    WHERE r.occurred_at > resp.occurred_at;

    WITH user_first_seen AS (
        SELECT user_id, min(occurred_at::date) as first_date FROM app_events GROUP BY user_id
    ), cohort AS (
        SELECT user_id, first_date FROM user_first_seen WHERE first_date BETWEEN p_start_date AND p_end_date
    )
    SELECT count(DISTINCT c.user_id) as cohort_size, count(DISTINCT CASE WHEN e.occurred_at::date = c.first_date + 1 THEN c.user_id END) as d1_retained, count(DISTINCT CASE WHEN e.occurred_at::date BETWEEN c.first_date + 2 AND c.first_date + 3 THEN c.user_id END) as d3_retained, count(DISTINCT CASE WHEN e.occurred_at::date BETWEEN c.first_date + 4 AND c.first_date + 7 THEN c.user_id END) as d7_retained, count(DISTINCT CASE WHEN e.occurred_at::date BETWEEN c.first_date + 8 AND c.first_date + 30 THEN c.user_id END) as d30_retained
    INTO v_cohort_users, v_d1, v_d3, v_d7, v_d30
    FROM cohort c LEFT JOIN app_events e ON c.user_id = e.user_id AND e.occurred_at::date > c.first_date;

    SELECT count(*) INTO v_pending_testimonials FROM testimonials WHERE status = 'pending';
    SELECT count(*) INTO v_delayed_responses FROM testimonials WHERE status = 'pending' AND created_at < NOW() - INTERVAL '48 hours';

    v_result := jsonb_build_object(
        'intelligence', jsonb_build_object(
            'active_users', jsonb_build_object('current', v_curr_active_users, 'previous', v_prev_active_users),
            'reads', jsonb_build_object('current', v_curr_reads, 'previous', v_prev_reads),
            'shares', jsonb_build_object('current', v_curr_shares, 'previous', v_prev_shares),
            'testimonials', jsonb_build_object('current', v_curr_testimonials, 'previous', v_prev_testimonials)
        ),
        'funnel', jsonb_build_object(
            'accessed', v_funnel_accessed,
            'read', v_funnel_read,
            'shared', v_funnel_shared,
            'testified', v_funnel_testified,
            'responded', v_funnel_responded,
            'returned', v_funnel_returned
        ),
        'retention', jsonb_build_object(
            'cohort_size', COALESCE(v_cohort_users, 0),
            'd1', COALESCE(v_d1, 0),
            'd3', COALESCE(v_d3, 0),
            'd7', COALESCE(v_d7, 0),
            'd30', COALESCE(v_d30, 0)
        ),
        'top_content', (
            SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM (
                SELECT content_id, count(*) as opens FROM app_events WHERE event_type = 'devotional_opened' AND occurred_at::date BETWEEN p_start_date AND p_end_date GROUP BY content_id ORDER BY opens DESC LIMIT 5
            ) t
        ),
        'community', jsonb_build_object(
            'pending_testimonials', v_pending_testimonials,
            'delayed_responses', v_delayed_responses
        )
    );
    RETURN v_result;
END;
$$;
SELECT * FROM test_metrics('2026-08-12', '2026-08-19');
