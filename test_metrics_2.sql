SELECT 
  count(DISTINCT user_id) as active_users,
  count(*) filter (where event_type = 'devotional_opened') as reads
FROM app_events 
WHERE occurred_at::date BETWEEN '2026-08-12' AND '2026-08-19';
