-- Migration unit 1: schema_changes
-- Transaction mode: transactional
-- Boundary reason: default

SET check_function_bodies = false;

DROP EXTENSION IF EXISTS pg_net;

ALTER TABLE public.cities
  DROP COLUMN ibge_code;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO service_role;

GRANT ALL ON FUNCTION public.attribute_referral(uuid, text) TO anon;

GRANT ALL ON FUNCTION public.attribute_referral(uuid, text) TO authenticated;

GRANT ALL ON FUNCTION public.attribute_referral(uuid, text) TO service_role;

CREATE OR REPLACE FUNCTION public.claim_translation_jobs (
  p_worker_id text,
  p_limit     integer DEFAULT 10
)
  RETURNS SETOF public.translation_jobs
  LANGUAGE plpgsql
  AS $function$
BEGIN
  RETURN QUERY
  WITH locked_jobs AS (
    SELECT id 
    FROM public.translation_jobs
    WHERE status = 'queued' 
       OR (status = 'translating' AND locked_at < NOW() - INTERVAL '10 minutes')
    ORDER BY created_at ASC
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.translation_jobs
  SET 
    status = 'translating',
    locked_at = NOW(),
    locked_by = p_worker_id,
    attempts = attempts + 1
  WHERE id IN (SELECT id FROM locked_jobs)
  RETURNING *;
END;
$function$;

GRANT ALL ON FUNCTION public.compute_devotional_content_hash() TO anon;

GRANT ALL ON FUNCTION public.compute_devotional_content_hash() TO authenticated;

GRANT ALL ON FUNCTION public.compute_devotional_content_hash() TO service_role;

GRANT ALL ON FUNCTION public.enqueue_translation_jobs() TO anon;

GRANT ALL ON FUNCTION public.enqueue_translation_jobs() TO authenticated;

GRANT ALL ON FUNCTION public.enqueue_translation_jobs() TO service_role;

GRANT ALL ON FUNCTION public.generate_referral_code() TO anon;

GRANT ALL ON FUNCTION public.generate_referral_code() TO authenticated;

GRANT ALL ON FUNCTION public.generate_referral_code() TO service_role;

GRANT ALL ON FUNCTION public.get_admin_dashboard_metrics(date, date) TO anon;

GRANT ALL ON FUNCTION public.get_admin_dashboard_metrics(date, date) TO service_role;

GRANT ALL ON FUNCTION public.get_my_communication_consents() TO anon;

GRANT ALL ON FUNCTION public.get_my_communication_consents() TO service_role;

GRANT ALL ON FUNCTION public.get_my_conversations() TO anon;

GRANT ALL ON FUNCTION public.get_my_conversations() TO service_role;

GRANT ALL ON FUNCTION public.get_my_unread_reply_count() TO anon;

GRANT ALL ON FUNCTION public.get_my_unread_reply_count() TO service_role;

GRANT ALL ON FUNCTION public.get_referrer_name(text) TO anon;

GRANT ALL ON FUNCTION public.get_referrer_name(text) TO authenticated;

GRANT ALL ON FUNCTION public.get_referrer_name(text) TO service_role;

GRANT ALL ON FUNCTION public.get_relationship_contact(text, uuid) TO anon;

GRANT ALL ON FUNCTION public.get_relationship_contact(text, uuid) TO service_role;

GRANT ALL ON FUNCTION public.get_total_profiles_count() TO anon;

GRANT ALL ON FUNCTION public.get_total_profiles_count() TO authenticated;

GRANT ALL ON FUNCTION public.get_total_profiles_count() TO service_role;

GRANT ALL ON FUNCTION public.handle_new_user_referral_code() TO anon;

GRANT ALL ON FUNCTION public.handle_new_user_referral_code() TO authenticated;

GRANT ALL ON FUNCTION public.handle_new_user_referral_code() TO service_role;

GRANT ALL ON FUNCTION public.handle_new_user() TO service_role;

GRANT ALL ON FUNCTION public.handle_updated_at() TO service_role;

GRANT ALL ON FUNCTION public.mark_replies_as_read(uuid[]) TO anon;

GRANT ALL ON FUNCTION public.mark_replies_as_read(uuid[]) TO service_role;

GRANT ALL ON FUNCTION public.process_payment_webhook(text, text, text, text, jsonb) TO anon;

GRANT ALL ON FUNCTION public.process_payment_webhook(text, text, text, text, jsonb) TO authenticated;

GRANT ALL ON FUNCTION public.process_payment_webhook(text, text, text, text, jsonb) TO service_role;

GRANT ALL ON FUNCTION public.record_relationship_reply(text, uuid, text, text) TO anon;

GRANT ALL ON FUNCTION public.record_relationship_reply(text, uuid, text, text) TO service_role;

GRANT ALL ON FUNCTION public.set_communication_consent(text, text, boolean, text, text) TO anon;

GRANT ALL ON FUNCTION public.set_communication_consent(text, text, boolean, text, text) TO service_role;

GRANT ALL ON FUNCTION public.set_communication_updated_at() TO anon;

GRANT ALL ON FUNCTION public.set_communication_updated_at() TO authenticated;

GRANT ALL ON FUNCTION public.set_communication_updated_at() TO service_role;

GRANT ALL ON FUNCTION public.track_analytic_event(text, uuid, uuid, text, uuid, text, jsonb, text, text) TO anon;

GRANT ALL ON FUNCTION public.update_relationship_status(text, uuid, text) TO anon;

GRANT ALL ON FUNCTION public.update_relationship_status(text, uuid, text) TO service_role;

ALTER TABLE public.cities
  ALTER COLUMN state_id DROP NOT NULL;

ALTER TABLE public.states
  ALTER COLUMN country_id DROP NOT NULL;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.app_events TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.app_events TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.app_events TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.campaigns TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.campaigns TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.campaigns TO service_role;

GRANT DELETE, INSERT, UPDATE ON public.categories TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.categories TO service_role;

ALTER TABLE public.cities
  ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;

GRANT DELETE, INSERT, UPDATE ON public.cities TO anon;

GRANT DELETE, INSERT, UPDATE ON public.cities TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.cities TO service_role;

CREATE POLICY "Allow public read-only access to cities" ON public.cities
  FOR SELECT
  USING (true);

GRANT DELETE, INSERT, SELECT, UPDATE ON public.communication_audiences TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.communication_audiences TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.communication_audiences TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.communication_campaign_audiences TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.communication_campaign_audiences TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.communication_campaign_audiences TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.communication_campaign_channels TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.communication_campaign_channels TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.communication_campaign_channels TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.communication_campaigns TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.communication_campaigns TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.communication_campaigns TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.communication_consents TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.communication_consents TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.communication_consents TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.communication_deliveries TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.communication_deliveries TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.communication_deliveries TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.contributions TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.contributions TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.contributions TO service_role;

ALTER TABLE public.countries
  ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;

GRANT DELETE, INSERT, UPDATE ON public.countries TO anon;

GRANT DELETE, INSERT, UPDATE ON public.countries TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.countries TO service_role;

CREATE POLICY "Allow public read-only access to countries" ON public.countries
  FOR SELECT
  USING (true);

GRANT DELETE, INSERT, SELECT, UPDATE ON public.daily_progress TO anon;

GRANT DELETE ON public.daily_progress TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.daily_progress TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.devotional_share_assets TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.devotional_share_assets TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.devotional_share_assets TO service_role;

GRANT DELETE, INSERT, UPDATE ON public.devotional_translations TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.devotional_translations TO service_role;

GRANT DELETE, INSERT, UPDATE ON public.devotionals TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.devotionals TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.favorites TO anon;

GRANT UPDATE ON public.favorites TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.favorites TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.languages TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.languages TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.languages TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.leads TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.leads TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.leads TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.payment_events TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.payment_events TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.payment_events TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.personal_reflections TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.personal_reflections TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.personal_reflections TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.plans TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.plans TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.plans TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.prayer_requests TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.prayer_requests TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.prayer_requests TO service_role;

ALTER TABLE public.profiles
  ADD COLUMN country text;

ALTER TABLE public.profiles
  ADD COLUMN state text;

ALTER TABLE public.profiles
  ADD COLUMN city text;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.profiles TO anon;

GRANT DELETE, INSERT ON public.profiles TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.profiles TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.relationship_audit_log TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.relationship_audit_log TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.relationship_audit_log TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.relationship_replies TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.relationship_replies TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.relationship_replies TO service_role;

ALTER TABLE public.states
  ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;

GRANT DELETE, INSERT, UPDATE ON public.states TO anon;

GRANT DELETE, INSERT, UPDATE ON public.states TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.states TO service_role;

CREATE POLICY "Allow public read-only access to states" ON public.states
  FOR SELECT
  USING (true);

GRANT DELETE, INSERT, SELECT, UPDATE ON public.subscriptions TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.subscriptions TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.subscriptions TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.supporters TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.supporters TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.supporters TO service_role;

GRANT DELETE, INSERT, UPDATE ON public.testimonial_responses TO anon;

GRANT DELETE, INSERT, UPDATE ON public.testimonials TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.testimonials TO service_role;

GRANT DELETE, INSERT, UPDATE ON public.themes TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.themes TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.translation_glossary TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.translation_glossary TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.translation_glossary TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.translation_job_attempts TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.translation_job_attempts TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.translation_job_attempts TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.translation_jobs TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.translation_jobs TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.translation_jobs TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.user_devotionals TO anon;

GRANT DELETE ON public.user_devotionals TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.user_devotionals TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.user_roles TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.admin_interactions_view TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.admin_interactions_view TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.admin_interactions_view TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.communication_campaign_stats TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.communication_campaign_stats TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.communication_campaign_stats TO service_role;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.current_communication_consents TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.current_communication_consents TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.current_communication_consents TO service_role;
