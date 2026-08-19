CREATE OR REPLACE FUNCTION public.get_admin_dashboard_metrics(
    p_start_date date,
    p_end_date date
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_previous_start date;
    v_previous_end date;
    
    -- Intelligence metrics
    v_curr_active_users int := 0;
    v_prev_active_users int := 0;
    v_curr_reads int := 0;
    v_prev_reads int := 0;
    v_curr_shares int := 0;
    v_prev_shares int := 0;
    v_curr_testimonials int := 0;
    v_prev_testimonials int := 0;
    
    -- Funnel
    v_funnel_accessed int := 0;
    v_funnel_read int := 0;
    v_funnel_shared int := 0;
    v_funnel_testified int := 0;
    v_funnel_responded int := 0;
    v_funnel_returned int := 0;

    -- Retention variables
    v_cohort_users int := 0;
    v_d1 int := 0;
    v_d3 int := 0;
    v_d7 int := 0;
    v_d30 int := 0;
    
    -- Community
    v_pending_testimonials int := 0;
    v_delayed_responses int := 0;
    
    v_result jsonb;
BEGIN
    -- Authorization check
    IF NOT public.has_role(ARRAY['super_admin', 'admin', 'analyst']::public.app_role[]) THEN
        RAISE EXCEPTION 'Access Denied: Requires admin or analyst role';
    END IF;

    v_previous_end := p_start_date - 1;
    v_previous_start := v_previous_end - (p_end_date - p_start_date);

    -- =========================================================
    -- TEMPORARY TABLE FOR RESOLVED IDENTITIES
    -- =========================================================
    CREATE TEMP TABLE IF NOT EXISTS tmp_resolved_events (
        id UUID,
        user_id UUID,
        anonymous_id TEXT,
        event_type TEXT,
        occurred_at TIMESTAMPTZ,
        content_id UUID,
        hist_canonical_id TEXT,
        period_canonical_id TEXT
    ) ON COMMIT DROP;
    
    TRUNCATE tmp_resolved_events;

    WITH historical_devices AS (
        SELECT anonymous_id, MAX(user_id::text) as canonical_user
        FROM app_events 
        WHERE anonymous_id IS NOT NULL AND user_id IS NOT NULL 
        GROUP BY anonymous_id 
        HAVING COUNT(DISTINCT user_id) = 1
    ),
    period_devices AS (
        SELECT anonymous_id, MAX(user_id::text) as canonical_user
        FROM app_events 
        WHERE anonymous_id IS NOT NULL AND user_id IS NOT NULL 
          AND occurred_at::date BETWEEN v_previous_start AND p_end_date
        GROUP BY anonymous_id 
        HAVING COUNT(DISTINCT user_id) = 1
    )
    INSERT INTO tmp_resolved_events
    SELECT 
        e.id,
        e.user_id,
        e.anonymous_id,
        e.event_type,
        e.occurred_at,
        e.content_id,
        CASE 
            WHEN h.canonical_user IS NOT NULL THEN h.canonical_user
            WHEN e.user_id IS NOT NULL THEN e.user_id::text
            ELSE e.anonymous_id
        END as hist_canonical_id,
        CASE 
            WHEN p.canonical_user IS NOT NULL THEN p.canonical_user
            WHEN e.user_id IS NOT NULL THEN e.user_id::text
            ELSE e.anonymous_id
        END as period_canonical_id
    FROM app_events e
    LEFT JOIN historical_devices h ON e.anonymous_id = h.anonymous_id
    LEFT JOIN period_devices p ON e.anonymous_id = p.anonymous_id
    WHERE e.occurred_at::date <= p_end_date;

    -- =========================================================
    -- 1. INTELLIGENCE
    -- =========================================================
    SELECT count(DISTINCT hist_canonical_id) INTO v_curr_active_users 
    FROM tmp_resolved_events WHERE occurred_at::date BETWEEN p_start_date AND p_end_date;
    
    SELECT count(*) INTO v_curr_reads 
    FROM tmp_resolved_events WHERE event_type = 'devotional_opened' AND occurred_at::date BETWEEN p_start_date AND p_end_date;
    
    SELECT count(*) INTO v_curr_shares 
    FROM tmp_resolved_events WHERE event_type = 'content_shared' AND occurred_at::date BETWEEN p_start_date AND p_end_date;
    
    SELECT count(DISTINCT user_id) INTO v_curr_testimonials 
    FROM tmp_resolved_events WHERE event_type = 'testimonial_submitted' AND occurred_at::date BETWEEN p_start_date AND p_end_date;

    -- Previous Period
    SELECT count(DISTINCT hist_canonical_id) INTO v_prev_active_users 
    FROM tmp_resolved_events WHERE occurred_at::date BETWEEN v_previous_start AND v_previous_end;
    
    SELECT count(*) INTO v_prev_reads 
    FROM tmp_resolved_events WHERE event_type = 'devotional_opened' AND occurred_at::date BETWEEN v_previous_start AND v_previous_end;
    
    SELECT count(*) INTO v_prev_shares 
    FROM tmp_resolved_events WHERE event_type = 'content_shared' AND occurred_at::date BETWEEN v_previous_start AND v_previous_end;
    
    SELECT count(DISTINCT user_id) INTO v_prev_testimonials 
    FROM tmp_resolved_events WHERE event_type = 'testimonial_submitted' AND occurred_at::date BETWEEN v_previous_start AND v_previous_end;

    -- =========================================================
    -- 2. FUNNEL (Period Coherence)
    -- =========================================================
    SELECT count(DISTINCT period_canonical_id) INTO v_funnel_accessed 
    FROM tmp_resolved_events WHERE occurred_at::date BETWEEN p_start_date AND p_end_date;
    
    SELECT count(DISTINCT period_canonical_id) INTO v_funnel_read 
    FROM tmp_resolved_events WHERE event_type = 'devotional_opened' AND occurred_at::date BETWEEN p_start_date AND p_end_date;
    
    SELECT count(DISTINCT period_canonical_id) INTO v_funnel_shared 
    FROM tmp_resolved_events WHERE event_type = 'content_shared' AND occurred_at::date BETWEEN p_start_date AND p_end_date;
    
    SELECT count(DISTINCT user_id) INTO v_funnel_testified 
    FROM tmp_resolved_events WHERE event_type = 'testimonial_submitted' AND occurred_at::date BETWEEN p_start_date AND p_end_date;

    SELECT count(DISTINCT user_id) INTO v_funnel_responded 
    FROM tmp_resolved_events WHERE event_type = 'testimonial_responded' AND occurred_at::date BETWEEN p_start_date AND p_end_date;

    SELECT count(DISTINCT r.user_id) INTO v_funnel_returned
    FROM tmp_resolved_events r
    JOIN tmp_resolved_events resp ON resp.user_id = r.user_id 
                         AND resp.event_type = 'testimonial_responded'
                         AND resp.occurred_at::date BETWEEN p_start_date AND p_end_date
    WHERE r.occurred_at > resp.occurred_at;
      
    -- =========================================================
    -- 3. RETENTION (Historical Coherence)
    -- =========================================================
    WITH user_first_seen AS (
        SELECT hist_canonical_id, min(occurred_at::date) as first_date
        FROM tmp_resolved_events
        GROUP BY hist_canonical_id
    ),
    cohort AS (
        SELECT hist_canonical_id, first_date
        FROM user_first_seen
        WHERE first_date BETWEEN p_start_date AND p_end_date
    )
    SELECT 
        count(DISTINCT c.hist_canonical_id) as cohort_size,
        count(DISTINCT CASE WHEN e.occurred_at::date = c.first_date + 1 THEN c.hist_canonical_id END) as d1_retained,
        count(DISTINCT CASE WHEN e.occurred_at::date BETWEEN c.first_date + 2 AND c.first_date + 3 THEN c.hist_canonical_id END) as d3_retained,
        count(DISTINCT CASE WHEN e.occurred_at::date BETWEEN c.first_date + 4 AND c.first_date + 7 THEN c.hist_canonical_id END) as d7_retained,
        count(DISTINCT CASE WHEN e.occurred_at::date BETWEEN c.first_date + 8 AND c.first_date + 30 THEN c.hist_canonical_id END) as d30_retained
    INTO v_cohort_users, v_d1, v_d3, v_d7, v_d30
    FROM cohort c
    LEFT JOIN tmp_resolved_events e ON c.hist_canonical_id = e.hist_canonical_id AND e.occurred_at::date > c.first_date;

    -- =========================================================
    -- 4. COMMUNITY
    -- =========================================================
    SELECT count(*) INTO v_pending_testimonials FROM testimonials WHERE status = 'pending';
    
    SELECT count(*) INTO v_delayed_responses 
    FROM testimonials 
    WHERE status = 'pending' AND created_at < NOW() - INTERVAL '48 hours';

    -- Build JSON result
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
            SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
            FROM (
                SELECT content_id, count(*) as opens
                FROM tmp_resolved_events 
                WHERE event_type = 'devotional_opened' 
                  AND occurred_at::date BETWEEN p_start_date AND p_end_date
                GROUP BY content_id
                ORDER BY opens DESC
                LIMIT 5
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
