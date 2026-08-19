


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "moddatetime" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."app_role" AS ENUM (
    'super_admin',
    'admin',
    'editor',
    'moderator',
    'analyst'
);


ALTER TYPE "public"."app_role" OWNER TO "postgres";


CREATE TYPE "public"."testimonial_status" AS ENUM (
    'pending',
    'reviewed',
    'archived'
);


ALTER TYPE "public"."testimonial_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."attribute_referral"("p_user_id" "uuid", "p_referral_code" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_source_user_id UUID;
BEGIN
    -- Only allow if the profile exists and has NO referred_by_user_id yet (Idempotence)
    SELECT id INTO v_source_user_id 
    FROM public.profiles 
    WHERE referral_code = p_referral_code
    LIMIT 1;

    IF v_source_user_id IS NOT NULL AND v_source_user_id != p_user_id THEN
        UPDATE public.profiles
        SET referred_by_user_id = v_source_user_id
        WHERE id = p_user_id AND referred_by_user_id IS NULL;
        
        -- If a row was actually updated, return true
        RETURN FOUND;
    END IF;

    RETURN false;
END;
$$;


ALTER FUNCTION "public"."attribute_referral"("p_user_id" "uuid", "p_referral_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_referral_code"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    new_code text;
    done bool;
BEGIN
    done := false;
    WHILE NOT done LOOP
        -- Generate 6 uppercase alphanumeric characters (using md5 of random)
        new_code := upper(substring(md5(random()::text) from 1 for 6));
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = new_code) THEN
            done := true;
        END IF;
    END LOOP;
    RETURN new_code;
END;
$$;


ALTER FUNCTION "public"."generate_referral_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_admin_dashboard_metrics"("p_start_date" "date", "p_end_date" "date") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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
    -- Authorization check: Requires admin or analyst role
    IF NOT public.has_role(ARRAY['super_admin', 'admin', 'analyst']::public.app_role[]) THEN
        RAISE EXCEPTION 'Access Denied: Requires admin or analyst role';
    END IF;

    -- Calculate previous period for temporal comparison
    v_previous_end := p_start_date - 1;
    v_previous_start := v_previous_end - (p_end_date - p_start_date);

    -- 1. INTELLIGENCE (Current Period)
    SELECT count(DISTINCT user_id) INTO v_curr_active_users 
    FROM app_events WHERE occurred_at::date BETWEEN p_start_date AND p_end_date;
    
    SELECT count(*) INTO v_curr_reads 
    FROM app_events WHERE event_type = 'devotional_opened' AND occurred_at::date BETWEEN p_start_date AND p_end_date;
    
    SELECT count(*) INTO v_curr_shares 
    FROM app_events WHERE event_type = 'content_shared' AND occurred_at::date BETWEEN p_start_date AND p_end_date;
    
    SELECT count(*) INTO v_curr_testimonials 
    FROM app_events WHERE event_type = 'testimonial_submitted' AND occurred_at::date BETWEEN p_start_date AND p_end_date;

    -- 1b. INTELLIGENCE (Previous Period)
    SELECT count(DISTINCT user_id) INTO v_prev_active_users 
    FROM app_events WHERE occurred_at::date BETWEEN v_previous_start AND v_previous_end;
    
    SELECT count(*) INTO v_prev_reads 
    FROM app_events WHERE event_type = 'devotional_opened' AND occurred_at::date BETWEEN v_previous_start AND v_previous_end;
    
    SELECT count(*) INTO v_prev_shares 
    FROM app_events WHERE event_type = 'content_shared' AND occurred_at::date BETWEEN v_previous_start AND v_previous_end;
    
    SELECT count(*) INTO v_prev_testimonials 
    FROM app_events WHERE event_type = 'testimonial_submitted' AND occurred_at::date BETWEEN v_previous_start AND v_previous_end;

    -- 2. FUNNEL (Current Period)
    -- "Acessou"
    v_funnel_accessed := v_curr_active_users;
    
    -- "Leu"
    SELECT count(DISTINCT user_id) INTO v_funnel_read 
    FROM app_events 
    WHERE event_type = 'devotional_opened' AND occurred_at::date BETWEEN p_start_date AND p_end_date;
    
    -- "Compartilhou"
    SELECT count(DISTINCT user_id) INTO v_funnel_shared 
    FROM app_events 
    WHERE event_type = 'content_shared' AND occurred_at::date BETWEEN p_start_date AND p_end_date;
    
    -- "Testemunhou"
    SELECT count(DISTINCT user_id) INTO v_funnel_testified 
    FROM app_events 
    WHERE event_type = 'testimonial_submitted' AND occurred_at::date BETWEEN p_start_date AND p_end_date;

    -- "Respondeu" (Admins responding to users. Here we count how many distinct users received a response)
    SELECT count(DISTINCT user_id) INTO v_funnel_responded 
    FROM app_events 
    WHERE event_type = 'testimonial_responded' AND occurred_at::date BETWEEN p_start_date AND p_end_date;

    -- "Retornou"
    -- Users who returned to the app AFTER receiving a response in this period.
    SELECT count(DISTINCT r.user_id) INTO v_funnel_returned
    FROM app_events r
    JOIN app_events resp ON resp.user_id = r.user_id 
                         AND resp.event_type = 'testimonial_responded'
                         AND resp.occurred_at::date BETWEEN p_start_date AND p_end_date
    WHERE r.occurred_at > resp.occurred_at;
      
    -- 3. RETENTION
    -- Cohort: users whose FIRST ever event was in the given period.
    -- D1: returned exactly 1 day after first event.
    -- D3: returned between 2-3 days after first event.
    -- D7: returned between 4-7 days after first event.
    -- D30: returned between 8-30 days after first event.
    WITH user_first_seen AS (
        SELECT user_id, min(occurred_at::date) as first_date
        FROM app_events
        GROUP BY user_id
    ),
    cohort AS (
        SELECT user_id, first_date
        FROM user_first_seen
        WHERE first_date BETWEEN p_start_date AND p_end_date
    )
    SELECT 
        count(DISTINCT c.user_id) as cohort_size,
        count(DISTINCT CASE WHEN e.occurred_at::date = c.first_date + 1 THEN c.user_id END) as d1_retained,
        count(DISTINCT CASE WHEN e.occurred_at::date BETWEEN c.first_date + 2 AND c.first_date + 3 THEN c.user_id END) as d3_retained,
        count(DISTINCT CASE WHEN e.occurred_at::date BETWEEN c.first_date + 4 AND c.first_date + 7 THEN c.user_id END) as d7_retained,
        count(DISTINCT CASE WHEN e.occurred_at::date BETWEEN c.first_date + 8 AND c.first_date + 30 THEN c.user_id END) as d30_retained
    INTO v_cohort_users, v_d1, v_d3, v_d7, v_d30
    FROM cohort c
    LEFT JOIN app_events e ON c.user_id = e.user_id AND e.occurred_at::date > c.first_date;

    -- 4. COMMUNITY
    SELECT count(*) INTO v_pending_testimonials FROM testimonials WHERE status = 'pending';
    
    -- Delayed responses: Testimonials pending for more than 48 hours
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
                FROM app_events 
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


ALTER FUNCTION "public"."get_admin_dashboard_metrics"("p_start_date" "date", "p_end_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_referrer_name"("p_referral_code" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_full_name TEXT;
BEGIN
    SELECT full_name INTO v_full_name
    FROM public.profiles
    WHERE referral_code = p_referral_code
    LIMIT 1;

    RETURN v_full_name;
END;
$$;


ALTER FUNCTION "public"."get_referrer_name"("p_referral_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_total_profiles_count"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    total_count INTEGER;
BEGIN
    SELECT count(*) INTO total_count FROM public.profiles;
    RETURN total_count;
END;
$$;


ALTER FUNCTION "public"."get_total_profiles_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user_referral_code"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NEW.referral_code IS NULL THEN
        NEW.referral_code := public.generate_referral_code();
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user_referral_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_role"("required_roles" "public"."app_role"[]) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  has_access boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = ANY(required_roles)
      AND revoked_at IS NULL
  ) INTO has_access;
  
  RETURN has_access;
END;
$$;


ALTER FUNCTION "public"."has_role"("required_roles" "public"."app_role"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_payment_webhook"("p_provider" "text", "p_event_id" "text", "p_event_type" "text", "p_reference_id" "text", "p_payload" "jsonb") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_inserted_id UUID;
  v_contribution_id UUID;
  v_new_status TEXT;
BEGIN
  -- 1. Idempotency Check & Insert
  INSERT INTO public.payment_events (provider, provider_event_id, event_type, payload)
  VALUES (p_provider, p_event_id, p_event_type, p_payload)
  ON CONFLICT (provider, provider_event_id) DO NOTHING
  RETURNING id INTO v_inserted_id;

  -- If duplicate, inserted_id is null
  IF v_inserted_id IS NULL THEN
    RETURN FALSE; -- Duplicate event safely ignored
  END IF;

  -- 2. Validate provider_reference (G8 Cross-Reference Integrity)
  SELECT id INTO v_contribution_id 
  FROM public.contributions 
  WHERE provider_reference = p_reference_id
  AND provider = p_provider;

  IF v_contribution_id IS NULL THEN
    RETURN TRUE;
  END IF;

  -- 3. Transition Mission (determine status)
  IF p_event_type = 'PAYMENT_CONFIRMED' THEN
    v_new_status := 'completed';
  ELSIF p_event_type = 'PAYMENT_FAILED' THEN
    v_new_status := 'canceled'; -- Fixed: map failures to canceled in our domain
  ELSIF p_event_type = 'RECURRING_CANCELED' THEN
    v_new_status := 'canceled';
  ELSE
    RETURN TRUE;
  END IF;

  -- 4. Mutate
  UPDATE public.contributions
  SET status = v_new_status, updated_at = now()
  WHERE id = v_contribution_id;

  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."process_payment_webhook"("p_provider" "text", "p_event_id" "text", "p_event_type" "text", "p_reference_id" "text", "p_payload" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."track_analytic_event"("p_event_type" "text", "p_user_id" "uuid", "p_content_id" "uuid" DEFAULT NULL::"uuid", "p_entity_type" "text" DEFAULT NULL::"text", "p_entity_id" "uuid" DEFAULT NULL::"uuid", "p_channel" "text" DEFAULT NULL::"text", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb", "p_idempotency_key" "text" DEFAULT NULL::"text", "p_anonymous_id" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_new_id UUID;
BEGIN
    -- Insert mapping the retro-compatible 'event_name' too
    INSERT INTO public.app_events (
        event_name,
        event_type,
        user_id,
        content_id,
        entity_type,
        entity_id,
        channel,
        metadata,
        idempotency_key,
        anonymous_id,
        occurred_at
    ) VALUES (
        p_event_type,
        p_event_type,
        p_user_id,
        p_content_id,
        p_entity_type,
        p_entity_id,
        p_channel,
        p_metadata,
        p_idempotency_key,
        p_anonymous_id,
        now()
    )
    ON CONFLICT (idempotency_key) DO NOTHING
    RETURNING id INTO v_new_id;

    -- Se não inseriu por causa da idempotency_key (duplicate retry), recuperamos o ID existente
    IF v_new_id IS NULL AND p_idempotency_key IS NOT NULL THEN
        SELECT id INTO v_new_id FROM public.app_events WHERE idempotency_key = p_idempotency_key;
    END IF;

    RETURN v_new_id;
END;
$$;


ALTER FUNCTION "public"."track_analytic_event"("p_event_type" "text", "p_user_id" "uuid", "p_content_id" "uuid", "p_entity_type" "text", "p_entity_id" "uuid", "p_channel" "text", "p_metadata" "jsonb", "p_idempotency_key" "text", "p_anonymous_id" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."app_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_name" "text" NOT NULL,
    "user_id" "uuid",
    "anonymous_id" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "event_type" "text" NOT NULL,
    "content_id" "uuid",
    "entity_type" "text",
    "entity_id" "uuid",
    "channel" "text",
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "idempotency_key" "text",
    CONSTRAINT "app_events_event_type_check" CHECK (("event_type" = ANY (ARRAY['share_initiated'::"text", 'referral_click'::"text", 'referral_signup'::"text", 'daily_return'::"text", 'shared_devotional_viewed'::"text", 'referred_user_shared'::"text", 'devotional_opened'::"text", 'content_shared'::"text", 'testimonial_submitted'::"text", 'testimonial_published'::"text", 'testimonial_responded'::"text", 'notification_sent'::"text", 'notification_delivered'::"text", 'notification_read'::"text", 'user_reactivated'::"text"])))
);


ALTER TABLE "public"."app_events" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."admin_interactions_view" WITH ("security_invoker"='on') AS
 SELECT "id" AS "event_id",
    "event_type",
    "user_id",
    "content_id",
    "entity_type",
    "entity_id",
    "channel",
    "occurred_at",
    "metadata"
   FROM "public"."app_events"
  ORDER BY "occurred_at" DESC;


ALTER VIEW "public"."admin_interactions_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."campaigns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "starts_at" timestamp with time zone,
    "ends_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."campaigns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "state_id" "uuid",
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."cities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contributions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "supporter_id" "uuid" NOT NULL,
    "campaign_id" "uuid",
    "amount" integer NOT NULL,
    "currency" "text" DEFAULT 'BRL'::"text" NOT NULL,
    "frequency" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "provider" "text" NOT NULL,
    "provider_reference" "text" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ended_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "contributions_amount_check" CHECK (("amount" > 0))
);


ALTER TABLE "public"."contributions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."countries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "code" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."countries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."daily_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "principle_id" integer NOT NULL,
    "date" "date" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."daily_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."devotionals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "legacy_id" integer,
    "publication_date" "date" NOT NULL,
    "title" "text" NOT NULL,
    "scripture_reference" "text",
    "scripture_text" "text",
    "reflection" "text" NOT NULL,
    "practical_application" "text" NOT NULL,
    "theme_id" "uuid",
    "category_id" "uuid",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "audio_url" "text"
);


ALTER TABLE "public"."devotionals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."favorites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "principle_id" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "devotional_id" "uuid"
);


ALTER TABLE "public"."favorites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "source" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."leads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider" "text" NOT NULL,
    "provider_event_id" "text" NOT NULL,
    "event_type" "text" NOT NULL,
    "payload" "jsonb" NOT NULL,
    "processed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."payment_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "referral_code" "text",
    "referred_by_user_id" "uuid",
    "country" "text",
    "state" "text",
    "city" "text",
    "phone" "text"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."states" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "country_id" "uuid",
    "name" "text" NOT NULL,
    "acronym" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."states" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "plan_id" "uuid" NOT NULL,
    "status" "text" NOT NULL,
    "provider" "text" NOT NULL,
    "provider_subscription_id" "text",
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone,
    "cancelled_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."supporters" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'inactive'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."supporters" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."testimonial_responses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "testimonial_id" "uuid" NOT NULL,
    "admin_user_id" "uuid" NOT NULL,
    "response" "text" NOT NULL,
    "status" "text" DEFAULT 'sent'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."testimonial_responses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."testimonials" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "devotional_id" "uuid",
    "content" "text" NOT NULL,
    "status" "public"."testimonial_status" DEFAULT 'pending'::"public"."testimonial_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."testimonials" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."themes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."themes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_devotionals" (
    "user_id" "uuid" NOT NULL,
    "devotional_id" "uuid" NOT NULL,
    "read_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_devotionals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."app_role" NOT NULL,
    "granted_by" "uuid",
    "granted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "revoked_at" timestamp with time zone
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


ALTER TABLE ONLY "public"."app_events"
    ADD CONSTRAINT "app_events_idempotency_key_key" UNIQUE ("idempotency_key");



ALTER TABLE ONLY "public"."app_events"
    ADD CONSTRAINT "app_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cities"
    ADD CONSTRAINT "cities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cities"
    ADD CONSTRAINT "cities_state_id_name_key" UNIQUE ("state_id", "name");



ALTER TABLE ONLY "public"."contributions"
    ADD CONSTRAINT "contributions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."countries"
    ADD CONSTRAINT "countries_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."countries"
    ADD CONSTRAINT "countries_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."countries"
    ADD CONSTRAINT "countries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_progress"
    ADD CONSTRAINT "daily_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_progress"
    ADD CONSTRAINT "daily_progress_user_id_principle_id_date_key" UNIQUE ("user_id", "principle_id", "date");



ALTER TABLE ONLY "public"."devotionals"
    ADD CONSTRAINT "devotionals_legacy_id_key" UNIQUE ("legacy_id");



ALTER TABLE ONLY "public"."devotionals"
    ADD CONSTRAINT "devotionals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."favorites"
    ADD CONSTRAINT "favorites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."favorites"
    ADD CONSTRAINT "favorites_user_devotional_key" UNIQUE ("user_id", "devotional_id");



ALTER TABLE ONLY "public"."favorites"
    ADD CONSTRAINT "favorites_user_id_principle_id_key" UNIQUE ("user_id", "principle_id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_events"
    ADD CONSTRAINT "payment_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_events"
    ADD CONSTRAINT "payment_events_provider_provider_event_id_key" UNIQUE ("provider", "provider_event_id");



ALTER TABLE ONLY "public"."plans"
    ADD CONSTRAINT "plans_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."plans"
    ADD CONSTRAINT "plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_referral_code_key" UNIQUE ("referral_code");



ALTER TABLE ONLY "public"."states"
    ADD CONSTRAINT "states_country_id_acronym_key" UNIQUE ("country_id", "acronym");



ALTER TABLE ONLY "public"."states"
    ADD CONSTRAINT "states_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."supporters"
    ADD CONSTRAINT "supporters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."supporters"
    ADD CONSTRAINT "supporters_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."testimonial_responses"
    ADD CONSTRAINT "testimonial_responses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."testimonials"
    ADD CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."themes"
    ADD CONSTRAINT "themes_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."themes"
    ADD CONSTRAINT "themes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_devotionals"
    ADD CONSTRAINT "user_devotionals_pkey" PRIMARY KEY ("user_id", "devotional_id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_app_events_content_id_event_type" ON "public"."app_events" USING "btree" ("content_id", "event_type");



CREATE INDEX "idx_app_events_event_type_occurred_at" ON "public"."app_events" USING "btree" ("event_type", "occurred_at");



CREATE INDEX "idx_app_events_user_id_event_type" ON "public"."app_events" USING "btree" ("user_id", "event_type");



CREATE UNIQUE INDEX "idx_user_roles_active" ON "public"."user_roles" USING "btree" ("user_id", "role") WHERE ("revoked_at" IS NULL);



CREATE INDEX "subscriptions_user_id_idx" ON "public"."subscriptions" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "ensure_referral_code" BEFORE INSERT ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_user_referral_code"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "public"."testimonials" FOR EACH ROW EXECUTE FUNCTION "public"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "on_campaigns_updated" BEFORE UPDATE ON "public"."campaigns" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_contributions_updated" BEFORE UPDATE ON "public"."contributions" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_devotionals_updated" BEFORE UPDATE ON "public"."devotionals" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_profiles_updated" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_subscriptions_updated" BEFORE UPDATE ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_supporters_updated" BEFORE UPDATE ON "public"."supporters" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



ALTER TABLE ONLY "public"."app_events"
    ADD CONSTRAINT "app_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."cities"
    ADD CONSTRAINT "cities_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contributions"
    ADD CONSTRAINT "contributions_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id");



ALTER TABLE ONLY "public"."contributions"
    ADD CONSTRAINT "contributions_supporter_id_fkey" FOREIGN KEY ("supporter_id") REFERENCES "public"."supporters"("id");



ALTER TABLE ONLY "public"."daily_progress"
    ADD CONSTRAINT "daily_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."devotionals"
    ADD CONSTRAINT "devotionals_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id");



ALTER TABLE ONLY "public"."devotionals"
    ADD CONSTRAINT "devotionals_theme_id_fkey" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id");



ALTER TABLE ONLY "public"."favorites"
    ADD CONSTRAINT "favorites_devotional_id_fkey" FOREIGN KEY ("devotional_id") REFERENCES "public"."devotionals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."favorites"
    ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_referred_by_user_id_fkey" FOREIGN KEY ("referred_by_user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."states"
    ADD CONSTRAINT "states_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."supporters"
    ADD CONSTRAINT "supporters_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."testimonial_responses"
    ADD CONSTRAINT "testimonial_responses_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."testimonial_responses"
    ADD CONSTRAINT "testimonial_responses_testimonial_id_fkey" FOREIGN KEY ("testimonial_id") REFERENCES "public"."testimonials"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."testimonials"
    ADD CONSTRAINT "testimonials_devotional_id_fkey" FOREIGN KEY ("devotional_id") REFERENCES "public"."devotionals"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."testimonials"
    ADD CONSTRAINT "testimonials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_devotionals"
    ADD CONSTRAINT "user_devotionals_devotional_id_fkey" FOREIGN KEY ("devotional_id") REFERENCES "public"."devotionals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_devotionals"
    ADD CONSTRAINT "user_devotionals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can read all roles" ON "public"."user_roles" FOR SELECT USING ("public"."has_role"(ARRAY['super_admin'::"public"."app_role", 'admin'::"public"."app_role"]));



CREATE POLICY "Allow public read-only access to cities" ON "public"."cities" FOR SELECT USING (true);



CREATE POLICY "Allow public read-only access to countries" ON "public"."countries" FOR SELECT USING (true);



CREATE POLICY "Allow public read-only access to states" ON "public"."states" FOR SELECT USING (true);



CREATE POLICY "Anyone can insert a lead" ON "public"."leads" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can read active campaigns" ON "public"."campaigns" FOR SELECT USING (("status" = 'active'::"text"));



CREATE POLICY "Anyone can view active plans" ON "public"."plans" FOR SELECT USING (("active" = true));



CREATE POLICY "Anyone can view categories" ON "public"."categories" FOR SELECT USING (true);



CREATE POLICY "Anyone can view published devotionals" ON "public"."devotionals" FOR SELECT USING (("status" = 'published'::"text"));



CREATE POLICY "Anyone can view themes" ON "public"."themes" FOR SELECT USING (true);



CREATE POLICY "No public delete for app_events" ON "public"."app_events" FOR DELETE USING (false);



CREATE POLICY "No public insert for app_events" ON "public"."app_events" FOR INSERT WITH CHECK (false);



CREATE POLICY "No public update for app_events" ON "public"."app_events" FOR UPDATE WITH CHECK (false);



CREATE POLICY "Only super_admins can manage roles" ON "public"."user_roles" USING ("public"."has_role"(ARRAY['super_admin'::"public"."app_role"])) WITH CHECK ("public"."has_role"(ARRAY['super_admin'::"public"."app_role"]));



CREATE POLICY "Users can delete their own favorites" ON "public"."favorites" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own pending testimonials" ON "public"."testimonials" FOR DELETE USING ((("auth"."uid"() = "user_id") AND ("status" = 'pending'::"public"."testimonial_status")));



CREATE POLICY "Users can insert their own favorites" ON "public"."favorites" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own progress" ON "public"."daily_progress" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own testimonials" ON "public"."testimonials" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") AND ("status" = 'pending'::"public"."testimonial_status")));



CREATE POLICY "Users can manage their own devotionals" ON "public"."user_devotionals" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own contributions" ON "public"."contributions" FOR SELECT USING (("supporter_id" IN ( SELECT "supporters"."id"
   FROM "public"."supporters"
  WHERE ("supporters"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can read own supporter status" ON "public"."supporters" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read their own roles" ON "public"."user_roles" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own pending testimonials" ON "public"."testimonials" FOR UPDATE USING ((("auth"."uid"() = "user_id") AND ("status" = 'pending'::"public"."testimonial_status"))) WITH CHECK ((("auth"."uid"() = "user_id") AND ("status" = 'pending'::"public"."testimonial_status")));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own progress" ON "public"."daily_progress" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own events" ON "public"."app_events" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own favorites" ON "public"."favorites" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own progress" ON "public"."daily_progress" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own subscriptions" ON "public"."subscriptions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own testimonials" ON "public"."testimonials" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."app_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."campaigns" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contributions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."countries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."daily_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."devotionals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."favorites" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."states" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."supporters" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."testimonial_responses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."testimonials" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."themes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_devotionals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."attribute_referral"("p_user_id" "uuid", "p_referral_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."attribute_referral"("p_user_id" "uuid", "p_referral_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."attribute_referral"("p_user_id" "uuid", "p_referral_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_referral_code"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_referral_code"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_referral_code"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_admin_dashboard_metrics"("p_start_date" "date", "p_end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_admin_dashboard_metrics"("p_start_date" "date", "p_end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_dashboard_metrics"("p_start_date" "date", "p_end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_referrer_name"("p_referral_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_referrer_name"("p_referral_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_referrer_name"("p_referral_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_total_profiles_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_total_profiles_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_total_profiles_count"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user_referral_code"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user_referral_code"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user_referral_code"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_updated_at"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."has_role"("required_roles" "public"."app_role"[]) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."has_role"("required_roles" "public"."app_role"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."has_role"("required_roles" "public"."app_role"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_role"("required_roles" "public"."app_role"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."moddatetime"() TO "postgres";
GRANT ALL ON FUNCTION "public"."moddatetime"() TO "anon";
GRANT ALL ON FUNCTION "public"."moddatetime"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."moddatetime"() TO "service_role";



GRANT ALL ON FUNCTION "public"."process_payment_webhook"("p_provider" "text", "p_event_id" "text", "p_event_type" "text", "p_reference_id" "text", "p_payload" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."process_payment_webhook"("p_provider" "text", "p_event_id" "text", "p_event_type" "text", "p_reference_id" "text", "p_payload" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_payment_webhook"("p_provider" "text", "p_event_id" "text", "p_event_type" "text", "p_reference_id" "text", "p_payload" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."track_analytic_event"("p_event_type" "text", "p_user_id" "uuid", "p_content_id" "uuid", "p_entity_type" "text", "p_entity_id" "uuid", "p_channel" "text", "p_metadata" "jsonb", "p_idempotency_key" "text", "p_anonymous_id" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."track_analytic_event"("p_event_type" "text", "p_user_id" "uuid", "p_content_id" "uuid", "p_entity_type" "text", "p_entity_id" "uuid", "p_channel" "text", "p_metadata" "jsonb", "p_idempotency_key" "text", "p_anonymous_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."track_analytic_event"("p_event_type" "text", "p_user_id" "uuid", "p_content_id" "uuid", "p_entity_type" "text", "p_entity_id" "uuid", "p_channel" "text", "p_metadata" "jsonb", "p_idempotency_key" "text", "p_anonymous_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."track_analytic_event"("p_event_type" "text", "p_user_id" "uuid", "p_content_id" "uuid", "p_entity_type" "text", "p_entity_id" "uuid", "p_channel" "text", "p_metadata" "jsonb", "p_idempotency_key" "text", "p_anonymous_id" "text") TO "service_role";


















GRANT ALL ON TABLE "public"."app_events" TO "anon";
GRANT ALL ON TABLE "public"."app_events" TO "authenticated";
GRANT ALL ON TABLE "public"."app_events" TO "service_role";



GRANT ALL ON TABLE "public"."admin_interactions_view" TO "anon";
GRANT ALL ON TABLE "public"."admin_interactions_view" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_interactions_view" TO "service_role";



GRANT ALL ON TABLE "public"."campaigns" TO "anon";
GRANT ALL ON TABLE "public"."campaigns" TO "authenticated";
GRANT ALL ON TABLE "public"."campaigns" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."cities" TO "anon";
GRANT ALL ON TABLE "public"."cities" TO "authenticated";
GRANT ALL ON TABLE "public"."cities" TO "service_role";



GRANT ALL ON TABLE "public"."contributions" TO "anon";
GRANT ALL ON TABLE "public"."contributions" TO "authenticated";
GRANT ALL ON TABLE "public"."contributions" TO "service_role";



GRANT ALL ON TABLE "public"."countries" TO "anon";
GRANT ALL ON TABLE "public"."countries" TO "authenticated";
GRANT ALL ON TABLE "public"."countries" TO "service_role";



GRANT ALL ON TABLE "public"."daily_progress" TO "anon";
GRANT ALL ON TABLE "public"."daily_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_progress" TO "service_role";



GRANT ALL ON TABLE "public"."devotionals" TO "anon";
GRANT ALL ON TABLE "public"."devotionals" TO "authenticated";
GRANT ALL ON TABLE "public"."devotionals" TO "service_role";



GRANT ALL ON TABLE "public"."favorites" TO "anon";
GRANT ALL ON TABLE "public"."favorites" TO "authenticated";
GRANT ALL ON TABLE "public"."favorites" TO "service_role";



GRANT ALL ON TABLE "public"."leads" TO "anon";
GRANT ALL ON TABLE "public"."leads" TO "authenticated";
GRANT ALL ON TABLE "public"."leads" TO "service_role";



GRANT ALL ON TABLE "public"."payment_events" TO "anon";
GRANT ALL ON TABLE "public"."payment_events" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_events" TO "service_role";



GRANT ALL ON TABLE "public"."plans" TO "anon";
GRANT ALL ON TABLE "public"."plans" TO "authenticated";
GRANT ALL ON TABLE "public"."plans" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."states" TO "anon";
GRANT ALL ON TABLE "public"."states" TO "authenticated";
GRANT ALL ON TABLE "public"."states" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."supporters" TO "anon";
GRANT ALL ON TABLE "public"."supporters" TO "authenticated";
GRANT ALL ON TABLE "public"."supporters" TO "service_role";



GRANT ALL ON TABLE "public"."testimonial_responses" TO "anon";
GRANT ALL ON TABLE "public"."testimonial_responses" TO "authenticated";
GRANT ALL ON TABLE "public"."testimonial_responses" TO "service_role";



GRANT ALL ON TABLE "public"."testimonials" TO "anon";
GRANT ALL ON TABLE "public"."testimonials" TO "authenticated";
GRANT ALL ON TABLE "public"."testimonials" TO "service_role";



GRANT ALL ON TABLE "public"."themes" TO "anon";
GRANT ALL ON TABLE "public"."themes" TO "authenticated";
GRANT ALL ON TABLE "public"."themes" TO "service_role";



GRANT ALL ON TABLE "public"."user_devotionals" TO "anon";
GRANT ALL ON TABLE "public"."user_devotionals" TO "authenticated";
GRANT ALL ON TABLE "public"."user_devotionals" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































