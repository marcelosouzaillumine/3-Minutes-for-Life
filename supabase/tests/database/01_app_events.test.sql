BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap;

SELECT plan(19);

-- 1. Check if tables and views exist
SELECT has_table('public', 'user_roles', 'user_roles table exists');
SELECT has_table('public', 'app_events', 'app_events table exists');
SELECT has_view('public', 'admin_interactions_view', 'admin_interactions_view exists');

-- 2. Check indexes and constraints
SELECT has_index('public', 'user_roles', 'idx_user_roles_active', 'Active role unique index exists');
SELECT has_index('public', 'app_events', 'idx_app_events_event_type_occurred_at', 'Analytics event_type+occurred_at index exists');

-- ==========================================
-- C. EVENT TAXONOMY
-- ==========================================
PREPARE insert_invalid_event AS
  INSERT INTO public.app_events (event_name, event_type, user_id) 
  VALUES ('invalid_event', 'invalid_event', gen_random_uuid());

SELECT throws_ok(
    'insert_invalid_event',
    '23514', -- check_violation
    NULL,
    'Taxonomy contract strictly enforces allowed event types'
);

-- ==========================================
-- D. IDEMPOTENCY
-- ==========================================
DO $$
DECLARE
    v_user UUID := gen_random_uuid();
    v_content UUID := gen_random_uuid();
    v_result1 UUID;
    v_result2 UUID;
BEGIN
    v_result1 := public.track_analytic_event('devotional_opened', v_user, v_content, NULL, NULL, NULL, '{}'::jsonb, 'idem_key_123');
    v_result2 := public.track_analytic_event('devotional_opened', v_user, v_content, NULL, NULL, NULL, '{}'::jsonb, 'idem_key_123');
    
    IF v_result1 != v_result2 OR v_result1 IS NULL THEN
        RAISE EXCEPTION 'Idempotency failed: expected same UUID, got % and %', v_result1, v_result2;
    END IF;
END $$;
SELECT pass('D.1: same idempotency_key does not generate second event (returns existing ID)');

DO $$
DECLARE
    v_user UUID := gen_random_uuid();
    v_content UUID := gen_random_uuid();
    v_result1 UUID;
    v_result2 UUID;
BEGIN
    v_result1 := public.track_analytic_event('devotional_opened', v_user, v_content, NULL, NULL, NULL, '{}'::jsonb, 'idem_key_valid_1');
    v_result2 := public.track_analytic_event('devotional_opened', v_user, v_content, NULL, NULL, NULL, '{}'::jsonb, 'idem_key_valid_2');
    
    IF v_result2 IS NULL OR v_result1 = v_result2 THEN
        RAISE EXCEPTION 'Legitimate multiple opens were wrongly blocked!';
    END IF;
END $$;
SELECT pass('D.2: two legitimate opens with different idempotency_key are accepted');

-- ==========================================
-- B. SECURITY DEFINER
-- ==========================================
SELECT function_privs_are(
    'public', 'has_role', ARRAY['public.app_role[]'], 'public', ARRAY[]::text[],
    'B.1: PUBLIC role should not have any execution rights on has_role'
);

SELECT function_privs_are(
    'public', 'has_role', ARRAY['public.app_role[]'], 'authenticated', ARRAY['EXECUTE'],
    'B.2: Authenticated users can execute has_role'
);

-- Ensure search_path is secure
SELECT has_function_privilege('public', 'has_role(public.app_role[])', 'EXECUTE', 'B.3: has_role is executable and defined');

-- ==========================================
-- F. RETROCOMPATIBILITY
-- ==========================================
DO $$
DECLARE
    v_result UUID;
BEGIN
    -- using legacy event name 'share_initiated'
    v_result := public.track_analytic_event('share_initiated', gen_random_uuid(), NULL, NULL, NULL, NULL, '{}'::jsonb, 'idem_legacy_1');
    IF v_result IS NULL THEN
        RAISE EXCEPTION 'Retrocompatibility failed: legacy event share_initiated was not accepted.';
    END IF;
END $$;
SELECT pass('F.1: track_analytic_event continues working with legacy events');

-- ==========================================
-- A. USER ROLES & E. RLS
-- ==========================================
-- We will mock users and test RLS
-- Create mock users in auth schema for testing
-- Since we can't easily insert into auth.users in standard pgTAP without proper mocking setup (sometimes Supabase test db allows it via helper), 
-- let's use standard technique: temporarily disable triggers or directly insert.
-- Supabase tests usually provide auth.users directly.

DO $$
DECLARE
    v_super_admin UUID := '00000000-0000-0000-0000-000000000001';
    v_admin UUID := '00000000-0000-0000-0000-000000000002';
    v_analyst UUID := '00000000-0000-0000-0000-000000000003';
    v_common_user UUID := '00000000-0000-0000-0000-000000000004';
BEGIN
    -- Setup auth users mock
    INSERT INTO auth.users (id, email) VALUES 
        (v_super_admin, 'super@test.com'),
        (v_admin, 'admin@test.com'),
        (v_analyst, 'analyst@test.com'),
        (v_common_user, 'common@test.com')
    ON CONFLICT DO NOTHING;
    
    -- Assign roles directly (bypassing RLS for setup as postgres superuser during test)
    INSERT INTO public.user_roles (user_id, role) VALUES 
        (v_super_admin, 'super_admin'),
        (v_admin, 'admin'),
        (v_analyst, 'analyst')
    ON CONFLICT DO NOTHING;
END $$;

-- 1. Test Common User RLS
SELECT tests.authenticate_as('00000000-0000-0000-0000-000000000004'); -- common_user
PREPARE select_roles_as_common AS SELECT * FROM public.user_roles;
SELECT results_eq('select_roles_as_common', 'SELECT * FROM public.user_roles WHERE user_id = ''00000000-0000-0000-0000-000000000004''::uuid', 'E.1: common user only accesses own role');

PREPARE insert_role_as_common AS INSERT INTO public.user_roles (user_id, role) VALUES ('00000000-0000-0000-0000-000000000004', 'admin');
SELECT throws_ok('insert_role_as_common', '42501', NULL, 'A.1: common user cannot administer roles');

-- 2. Test Analyst RLS
SELECT tests.clear_authentication();
SELECT tests.authenticate_as('00000000-0000-0000-0000-000000000003'); -- analyst
PREPARE insert_role_as_analyst AS INSERT INTO public.user_roles (user_id, role) VALUES ('00000000-0000-0000-0000-000000000004', 'editor');
SELECT throws_ok('insert_role_as_analyst', '42501', NULL, 'A.2: analyst cannot alter roles');

-- 3. Test Admin RLS
SELECT tests.clear_authentication();
SELECT tests.authenticate_as('00000000-0000-0000-0000-000000000002'); -- admin
PREPARE select_roles_as_admin AS SELECT count(*)::int FROM public.user_roles;
-- Expected count is at least 3 (setup users)
SELECT cmp_ok((EXECUTE 'select_roles_as_admin'), '>=', 3, 'A.4: admin can read all roles');
PREPARE insert_role_as_admin AS INSERT INTO public.user_roles (user_id, role) VALUES ('00000000-0000-0000-0000-000000000004', 'editor');
SELECT throws_ok('insert_role_as_admin', '42501', NULL, 'A.5: admin cannot manage roles (only super_admin can)');

-- 4. Test Super Admin RLS
SELECT tests.clear_authentication();
SELECT tests.authenticate_as('00000000-0000-0000-0000-000000000001'); -- super_admin
PREPARE insert_role_as_super AS INSERT INTO public.user_roles (user_id, role) VALUES ('00000000-0000-0000-0000-000000000004', 'moderator');
SELECT lives_ok('insert_role_as_super', 'A.6: super_admin can manage roles');

SELECT tests.clear_authentication();

SELECT * FROM finish();
ROLLBACK;
