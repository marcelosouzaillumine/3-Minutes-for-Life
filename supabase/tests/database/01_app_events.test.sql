BEGIN;

-- Include pgTAP
CREATE EXTENSION IF NOT EXISTS pgtap;

-- Define test plan
SELECT plan(10);

-- 1. Check if tables and views exist
SELECT has_table('public', 'user_roles', 'user_roles table exists');
SELECT has_table('public', 'app_events', 'app_events table exists');
SELECT has_view('public', 'admin_interactions_view', 'admin_interactions_view exists');

-- 2. Check indexes and constraints
SELECT has_index('public', 'user_roles', 'idx_user_roles_active', 'Active role unique index exists');
SELECT has_index('public', 'app_events', 'idx_app_events_event_type_occurred_at', 'Analytics event_type+occurred_at index exists');

-- 3. Check Taxonomy Constraint
PREPARE insert_invalid_event AS
  INSERT INTO public.app_events (event_name, event_type, user_id) 
  VALUES ('invalid_event', 'invalid_event', gen_random_uuid());

SELECT throws_ok(
    'insert_invalid_event',
    '23514', -- check_violation
    NULL,
    'Taxonomy contract strictly enforces allowed event types'
);

-- 4. Test Idempotency
DO $$
DECLARE
    v_user UUID := gen_random_uuid();
    v_content UUID := gen_random_uuid();
    v_result1 UUID;
    v_result2 UUID;
BEGIN
    -- Insert first time
    v_result1 := public.track_analytic_event(
        'devotional_opened',
        v_user,
        v_content,
        NULL, NULL, NULL, '{}'::jsonb,
        'idem_key_123'
    );
    
    -- Insert second time with same idempotency key (simulating retry)
    v_result2 := public.track_analytic_event(
        'devotional_opened',
        v_user,
        v_content,
        NULL, NULL, NULL, '{}'::jsonb,
        'idem_key_123'
    );
    
    -- Assert they are the same UUID (idempotency worked)
    IF v_result1 != v_result2 OR v_result1 IS NULL THEN
        RAISE EXCEPTION 'Idempotency failed: expected same UUID, got % and %', v_result1, v_result2;
    END IF;
END $$;
SELECT pass('Idempotency key prevents duplicates and returns existing ID');

-- 5. Test Multiple Legitimate Opens (No artificial daily limit anymore)
DO $$
DECLARE
    v_user UUID := gen_random_uuid();
    v_content UUID := gen_random_uuid();
    v_result1 UUID;
    v_result2 UUID;
BEGIN
    -- Insert first time (first legitimate open)
    v_result1 := public.track_analytic_event(
        'devotional_opened',
        v_user,
        v_content,
        NULL, NULL, NULL, '{}'::jsonb,
        'idem_key_valid_1'
    );
    
    -- Insert second time with DIFFERENT idempotency key, but SAME content, user, and day
    v_result2 := public.track_analytic_event(
        'devotional_opened',
        v_user,
        v_content,
        NULL, NULL, NULL, '{}'::jsonb,
        'idem_key_valid_2' -- Different key!
    );
    
    -- Assert the second insert was recorded (returns a new UUID)
    IF v_result2 IS NULL OR v_result1 = v_result2 THEN
        RAISE EXCEPTION 'Legitimate multiple opens were wrongly blocked!';
    END IF;
END $$;
SELECT pass('System allows multiple legitimate opens of the same devotional');

-- 6. Check SECURITY DEFINER configuration on has_role
SELECT function_privs_are(
    'public', 'has_role', ARRAY['public.app_role[]'], 'public', ARRAY[]::text[],
    'PUBLIC role should not have any execution rights on has_role'
);

SELECT function_privs_are(
    'public', 'has_role', ARRAY['public.app_role[]'], 'authenticated', ARRAY['EXECUTE'],
    'Authenticated users can execute has_role'
);

-- Finish tests
SELECT * FROM finish();
ROLLBACK;
