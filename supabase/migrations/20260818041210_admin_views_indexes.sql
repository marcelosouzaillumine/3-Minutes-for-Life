-- 1. Create indexes on app_events for common analytical query patterns
CREATE INDEX IF NOT EXISTS idx_app_events_event_type_occurred_at 
ON public.app_events (event_type, occurred_at);

CREATE INDEX IF NOT EXISTS idx_app_events_user_id_event_type 
ON public.app_events (user_id, event_type);

CREATE INDEX IF NOT EXISTS idx_app_events_content_id_event_type 
ON public.app_events (content_id, event_type);

-- 2. Create the unified admin_interactions_view
-- This view rebuilds the user journey based solely on the app_events table
-- ensuring state does not overwrite historical events.
CREATE OR REPLACE VIEW public.admin_interactions_view AS
SELECT
    id AS event_id,
    event_type,
    user_id,
    content_id,
    entity_type,
    entity_id,
    channel,
    occurred_at,
    metadata
FROM public.app_events
ORDER BY occurred_at DESC;

-- Grant select access to authenticated users with admin/analyst roles (this relies on RLS of the underlying table,
-- but since views by default bypass RLS if not defined properly, we must ensure it behaves correctly.
-- Views in Supabase use the invoker's privileges if we set security_invoker = true in Postgres 15+).
ALTER VIEW public.admin_interactions_view SET (security_invoker = on);
