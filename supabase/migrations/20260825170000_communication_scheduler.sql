CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.unschedule('communication-campaign-scheduler')
WHERE EXISTS (
  SELECT 1
  FROM cron.job
  WHERE jobname = 'communication-campaign-scheduler'
);

SELECT cron.schedule(
  'communication-campaign-scheduler',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url')
      || '/functions/v1/communication-worker',
    headers := jsonb_build_object(
      'Authorization',
      'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type',
      'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
