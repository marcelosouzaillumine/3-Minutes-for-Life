-- ============================================================
-- Migration: 20260823010000_fix_admin_dashboard_rpc_v4
-- Fix: get_admin_dashboard_metrics
-- Date: 2026-08-23
--
-- Corrige a RPC do Intelligence & Engagement Center.
--
-- Problema corrigido:
-- PostgreSQL estava interpretando referências às variáveis
-- PL/pgSQL (especialmente v_previous_start) como nomes de
-- colunas dentro de consultas SQL.
--
-- Estratégia:
-- 1. Calcula explicitamente os limites do período.
-- 2. Evita TEMP VIEW dentro da função.
-- 3. Usa CTEs para resolução de identidade.
-- 4. Mantém SECURITY DEFINER.
-- 5. Mantém a autorização por role.
-- 6. Preserva o contrato JSON esperado pelo frontend.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_admin_dashboard_metrics(
    p_start_date date,
    p_end_date date
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    -- ========================================================
    -- PERÍODO
    -- ========================================================
    v_period_days integer;
    v_previous_start_date date;
    v_previous_end_date date;

    -- ========================================================
    -- INTELLIGENCE
    -- ========================================================
    v_curr_active_users integer := 0;
    v_prev_active_users integer := 0;

    v_curr_reads integer := 0;
    v_prev_reads integer := 0;

    v_curr_shares integer := 0;
    v_prev_shares integer := 0;

    v_curr_testimonials integer := 0;
    v_prev_testimonials integer := 0;

    -- ========================================================
    -- FUNNEL
    -- ========================================================
    v_funnel_accessed integer := 0;
    v_funnel_read integer := 0;
    v_funnel_shared integer := 0;
    v_funnel_testified integer := 0;
    v_funnel_responded integer := 0;
    v_funnel_returned integer := 0;

    -- ========================================================
    -- RETENTION
    -- ========================================================
    v_cohort_users integer := 0;
    v_d1 integer := 0;
    v_d3 integer := 0;
    v_d7 integer := 0;
    v_d30 integer := 0;

    -- ========================================================
    -- COMMUNITY
    -- ========================================================
    v_pending_testimonials integer := 0;
    v_delayed_responses integer := 0;

    v_result jsonb;
BEGIN

    -- ========================================================
    -- VALIDATION
    -- ========================================================

    IF p_start_date IS NULL OR p_end_date IS NULL THEN
        RAISE EXCEPTION 'Start date and end date are required';
    END IF;

    IF p_start_date > p_end_date THEN
        RAISE EXCEPTION 'Start date cannot be greater than end date';
    END IF;

    -- ========================================================
    -- AUTHORIZATION
    -- ========================================================

    IF NOT public.has_role(
        ARRAY[
            'super_admin',
            'admin',
            'analyst'
        ]::public.app_role[]
    ) THEN
        RAISE EXCEPTION 'Access Denied: Requires admin or analyst role';
    END IF;

    -- ========================================================
    -- PERIOD CALCULATION
    --
    -- IMPORTANT:
    -- Os nomes das variáveis possuem "_date" para deixar explícito
    -- que são valores PL/pgSQL e não colunas SQL.
    -- ========================================================

    v_period_days :=
        (p_end_date - p_start_date) + 1;

    v_previous_end_date :=
        p_start_date - 1;

    v_previous_start_date :=
        v_previous_end_date - (v_period_days - 1);

    -- ========================================================
    -- RESOLVED EVENTS
    --
    -- CTE centralizado.
    --
    -- historical_canonical_id:
    -- identidade consolidada considerando todo o histórico.
    --
    -- period_canonical_id:
    -- identidade consolidada considerando o período analisado.
    -- ========================================================

    WITH
    historical_devices AS (
        SELECT
            ae.anonymous_id,
            MAX(ae.user_id::text) AS canonical_user
        FROM public.app_events ae
        WHERE ae.anonymous_id IS NOT NULL
          AND ae.user_id IS NOT NULL
        GROUP BY ae.anonymous_id
        HAVING COUNT(DISTINCT ae.user_id) = 1
    ),

    period_devices AS (
        SELECT
            ae.anonymous_id,
            MAX(ae.user_id::text) AS canonical_user
        FROM public.app_events ae
        WHERE ae.anonymous_id IS NOT NULL
          AND ae.user_id IS NOT NULL
          AND ae.occurred_at::date
              BETWEEN v_previous_start_date
              AND p_end_date
        GROUP BY ae.anonymous_id
        HAVING COUNT(DISTINCT ae.user_id) = 1
    ),

    resolved_events AS (
        SELECT
            ae.id,
            ae.user_id,
            ae.anonymous_id,
            ae.event_type,
            ae.occurred_at,
            ae.content_id,

            CASE
                WHEN hd.canonical_user IS NOT NULL
                    THEN hd.canonical_user

                WHEN ae.user_id IS NOT NULL
                    THEN ae.user_id::text

                ELSE ae.anonymous_id
            END AS historical_canonical_id,

            CASE
                WHEN pd.canonical_user IS NOT NULL
                    THEN pd.canonical_user

                WHEN ae.user_id IS NOT NULL
                    THEN ae.user_id::text

                ELSE ae.anonymous_id
            END AS period_canonical_id

        FROM public.app_events ae

        LEFT JOIN historical_devices hd
            ON hd.anonymous_id = ae.anonymous_id

        LEFT JOIN period_devices pd
            ON pd.anonymous_id = ae.anonymous_id
    )

    -- ========================================================
    -- 1. INTELLIGENCE
    -- ========================================================

    SELECT
        COUNT(DISTINCT CASE
            WHEN occurred_at::date
                 BETWEEN p_start_date AND p_end_date
            THEN historical_canonical_id
        END),

        COUNT(DISTINCT CASE
            WHEN occurred_at::date
                 BETWEEN v_previous_start_date
                 AND v_previous_end_date
            THEN historical_canonical_id
        END),

        COUNT(CASE
            WHEN event_type = 'devotional_opened'
             AND occurred_at::date
                 BETWEEN p_start_date AND p_end_date
            THEN 1
        END),

        COUNT(CASE
            WHEN event_type = 'devotional_opened'
             AND occurred_at::date
                 BETWEEN v_previous_start_date
                 AND v_previous_end_date
            THEN 1
        END),

        COUNT(CASE
            WHEN event_type = 'content_shared'
             AND occurred_at::date
                 BETWEEN p_start_date AND p_end_date
            THEN 1
        END),

        COUNT(CASE
            WHEN event_type = 'content_shared'
             AND occurred_at::date
                 BETWEEN v_previous_start_date
                 AND v_previous_end_date
            THEN 1
        END),

        COUNT(DISTINCT CASE
            WHEN event_type = 'testimonial_submitted'
             AND occurred_at::date
                 BETWEEN p_start_date AND p_end_date
            THEN historical_canonical_id
        END),

        COUNT(DISTINCT CASE
            WHEN event_type = 'testimonial_submitted'
             AND occurred_at::date
                 BETWEEN v_previous_start_date
                 AND v_previous_end_date
            THEN historical_canonical_id
        END)

    INTO
        v_curr_active_users,
        v_prev_active_users,
        v_curr_reads,
        v_prev_reads,
        v_curr_shares,
        v_prev_shares,
        v_curr_testimonials,
        v_prev_testimonials

    FROM resolved_events;

    -- ========================================================
    -- 2. FUNNEL
    -- ========================================================

    WITH
    historical_devices AS (
        SELECT
            ae.anonymous_id,
            MAX(ae.user_id::text) AS canonical_user
        FROM public.app_events ae
        WHERE ae.anonymous_id IS NOT NULL
          AND ae.user_id IS NOT NULL
        GROUP BY ae.anonymous_id
        HAVING COUNT(DISTINCT ae.user_id) = 1
    ),

    period_devices AS (
        SELECT
            ae.anonymous_id,
            MAX(ae.user_id::text) AS canonical_user
        FROM public.app_events ae
        WHERE ae.anonymous_id IS NOT NULL
          AND ae.user_id IS NOT NULL
          AND ae.occurred_at::date
              BETWEEN v_previous_start_date
              AND p_end_date
        GROUP BY ae.anonymous_id
        HAVING COUNT(DISTINCT ae.user_id) = 1
    ),

    resolved_events AS (
        SELECT
            ae.event_type,
            ae.occurred_at,

            CASE
                WHEN pd.canonical_user IS NOT NULL
                    THEN pd.canonical_user
                WHEN ae.user_id IS NOT NULL
                    THEN ae.user_id::text
                ELSE ae.anonymous_id
            END AS period_canonical_id

        FROM public.app_events ae

        LEFT JOIN period_devices pd
            ON pd.anonymous_id = ae.anonymous_id
    )

    SELECT
        COUNT(DISTINCT period_canonical_id)
            FILTER (
                WHERE occurred_at::date
                BETWEEN p_start_date AND p_end_date
            ),

        COUNT(DISTINCT period_canonical_id)
            FILTER (
                WHERE event_type = 'devotional_opened'
                  AND occurred_at::date
                  BETWEEN p_start_date AND p_end_date
            ),

        COUNT(DISTINCT period_canonical_id)
            FILTER (
                WHERE event_type = 'content_shared'
                  AND occurred_at::date
                  BETWEEN p_start_date AND p_end_date
            ),

        COUNT(DISTINCT period_canonical_id)
            FILTER (
                WHERE event_type = 'testimonial_submitted'
                  AND occurred_at::date
                  BETWEEN p_start_date AND p_end_date
            ),

        COUNT(DISTINCT period_canonical_id)
            FILTER (
                WHERE event_type = 'testimonial_responded'
                  AND occurred_at::date
                  BETWEEN p_start_date AND p_end_date
            )

    INTO
        v_funnel_accessed,
        v_funnel_read,
        v_funnel_shared,
        v_funnel_testified,
        v_funnel_responded

    FROM resolved_events;

    -- ========================================================
    -- FUNNEL RETURNED
    --
    -- Usuário respondeu e depois voltou a gerar qualquer evento.
    -- ========================================================

    WITH
    historical_devices AS (
        SELECT
            ae.anonymous_id,
            MAX(ae.user_id::text) AS canonical_user
        FROM public.app_events ae
        WHERE ae.anonymous_id IS NOT NULL
          AND ae.user_id IS NOT NULL
        GROUP BY ae.anonymous_id
        HAVING COUNT(DISTINCT ae.user_id) = 1
    ),

    resolved_events AS (
        SELECT
            ae.event_type,
            ae.occurred_at,

            CASE
                WHEN hd.canonical_user IS NOT NULL
                    THEN hd.canonical_user
                WHEN ae.user_id IS NOT NULL
                    THEN ae.user_id::text
                ELSE ae.anonymous_id
            END AS canonical_id

        FROM public.app_events ae

        LEFT JOIN historical_devices hd
            ON hd.anonymous_id = ae.anonymous_id
    ),

    responded_users AS (
        SELECT
            canonical_id,
            MIN(occurred_at) AS responded_at
        FROM resolved_events
        WHERE event_type = 'testimonial_responded'
          AND occurred_at::date
              BETWEEN p_start_date AND p_end_date
        GROUP BY canonical_id
    )

    SELECT COUNT(DISTINCT re.canonical_id)
    INTO v_funnel_returned
    FROM resolved_events re
    INNER JOIN responded_users ru
        ON ru.canonical_id = re.canonical_id
    WHERE re.occurred_at > ru.responded_at
      AND re.occurred_at::date
          BETWEEN p_start_date AND p_end_date;

    -- ========================================================
    -- 3. RETENTION
    -- ========================================================

    WITH
    historical_devices AS (
        SELECT
            ae.anonymous_id,
            MAX(ae.user_id::text) AS canonical_user
        FROM public.app_events ae
        WHERE ae.anonymous_id IS NOT NULL
          AND ae.user_id IS NOT NULL
        GROUP BY ae.anonymous_id
        HAVING COUNT(DISTINCT ae.user_id) = 1
    ),

    resolved_events AS (
        SELECT
            ae.occurred_at,

            CASE
                WHEN hd.canonical_user IS NOT NULL
                    THEN hd.canonical_user
                WHEN ae.user_id IS NOT NULL
                    THEN ae.user_id::text
                ELSE ae.anonymous_id
            END AS canonical_id

        FROM public.app_events ae

        LEFT JOIN historical_devices hd
            ON hd.anonymous_id = ae.anonymous_id
    ),

    user_first_seen AS (
        SELECT
            canonical_id,
            MIN(occurred_at::date) AS first_date
        FROM resolved_events
        GROUP BY canonical_id
    ),

    cohort AS (
        SELECT
            canonical_id,
            first_date
        FROM user_first_seen
        WHERE first_date
              BETWEEN p_start_date AND p_end_date
    )

    SELECT
        COUNT(DISTINCT c.canonical_id),

        COUNT(DISTINCT c.canonical_id)
            FILTER (
                WHERE re.occurred_at::date = c.first_date + 1
            ),

        COUNT(DISTINCT c.canonical_id)
            FILTER (
                WHERE re.occurred_at::date
                BETWEEN c.first_date + 2
                    AND c.first_date + 3
            ),

        COUNT(DISTINCT c.canonical_id)
            FILTER (
                WHERE re.occurred_at::date
                BETWEEN c.first_date + 4
                    AND c.first_date + 7
            ),

        COUNT(DISTINCT c.canonical_id)
            FILTER (
                WHERE re.occurred_at::date
                BETWEEN c.first_date + 8
                    AND c.first_date + 30
            )

    INTO
        v_cohort_users,
        v_d1,
        v_d3,
        v_d7,
        v_d30

    FROM cohort c

    LEFT JOIN resolved_events re
        ON re.canonical_id = c.canonical_id
       AND re.occurred_at::date > c.first_date;

    -- ========================================================
    -- 4. COMMUNITY
    -- ========================================================

    SELECT COUNT(*)
    INTO v_pending_testimonials
    FROM public.testimonials
    WHERE status = 'pending';

    SELECT COUNT(*)
    INTO v_delayed_responses
    FROM public.testimonials
    WHERE status = 'pending'
      AND created_at < NOW() - INTERVAL '48 hours';

    -- ========================================================
    -- 5. RESULT
    -- ========================================================

    v_result := jsonb_build_object(

        'intelligence',
        jsonb_build_object(

            'active_users',
            jsonb_build_object(
                'current', COALESCE(v_curr_active_users, 0),
                'previous', COALESCE(v_prev_active_users, 0)
            ),

            'reads',
            jsonb_build_object(
                'current', COALESCE(v_curr_reads, 0),
                'previous', COALESCE(v_prev_reads, 0)
            ),

            'shares',
            jsonb_build_object(
                'current', COALESCE(v_curr_shares, 0),
                'previous', COALESCE(v_prev_shares, 0)
            ),

            'testimonials',
            jsonb_build_object(
                'current', COALESCE(v_curr_testimonials, 0),
                'previous', COALESCE(v_prev_testimonials, 0)
            )
        ),

        'funnel',
        jsonb_build_object(
            'accessed', COALESCE(v_funnel_accessed, 0),
            'read', COALESCE(v_funnel_read, 0),
            'shared', COALESCE(v_funnel_shared, 0),
            'testified', COALESCE(v_funnel_testified, 0),
            'responded', COALESCE(v_funnel_responded, 0),
            'returned', COALESCE(v_funnel_returned, 0)
        ),

        'retention',
        jsonb_build_object(
            'cohort_size', COALESCE(v_cohort_users, 0),
            'd1', COALESCE(v_d1, 0),
            'd3', COALESCE(v_d3, 0),
            'd7', COALESCE(v_d7, 0),
            'd30', COALESCE(v_d30, 0)
        ),

        'top_content',
        (
            SELECT COALESCE(
                jsonb_agg(row_to_json(t)),
                '[]'::jsonb
            )
            FROM (
                SELECT
                    ae.content_id,
                    d.title AS devotional_title,
                    COUNT(*) AS opens

                FROM public.app_events ae

                LEFT JOIN public.devotionals d
                    ON d.id = ae.content_id

                WHERE ae.event_type = 'devotional_opened'
                  AND ae.occurred_at::date
                      BETWEEN p_start_date AND p_end_date
                  AND ae.content_id IS NOT NULL

                GROUP BY
                    ae.content_id,
                    d.title

                ORDER BY opens DESC

                LIMIT 5
            ) t
        ),

        'community',
        jsonb_build_object(
            'pending_testimonials',
            COALESCE(v_pending_testimonials, 0),

            'delayed_responses',
            COALESCE(v_delayed_responses, 0)
        )
    );

    RETURN v_result;
END;
$function$;

-- ============================================================
-- PERMISSIONS
-- ============================================================

REVOKE ALL
ON FUNCTION public.get_admin_dashboard_metrics(date, date)
FROM PUBLIC;

GRANT EXECUTE
ON FUNCTION public.get_admin_dashboard_metrics(date, date)
TO authenticated;

-- ============================================================
-- END
-- ============================================================
