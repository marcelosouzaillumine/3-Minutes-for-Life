SELECT public.get_admin_dashboard_metrics(
    (CURRENT_DATE - INTERVAL '7 days')::date,
    CURRENT_DATE
);
