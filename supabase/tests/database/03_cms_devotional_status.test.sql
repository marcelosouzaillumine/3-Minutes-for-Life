BEGIN;
SELECT plan(6);

-- Setup
-- Ensure test users exist
-- Use existing seeded users if possible, or we can just mock the auth
-- Note: It's easier to use the supabase helper functions if available, but pgTAP is fine.

-- 1. Check if column exists
SELECT has_column('public', 'devotionals', 'status', 'Column status should exist');

-- 2. Check if default is draft
SELECT col_default_is('public', 'devotionals', 'status', 'draft', 'Default status is draft');

-- 3. Check constraint
-- Try inserting an invalid status
PREPARE insert_invalid AS INSERT INTO devotionals (id, title, publication_date, reflection, practical_application, status) VALUES (gen_random_uuid(), 'Test', CURRENT_DATE, 'Ref', 'App', 'invalid_status');
SELECT throws_ok('insert_invalid', 'new row for relation "devotionals" violates check constraint "devotionals_status_check"', 'Should not allow invalid status');

-- Insert valid statuses
PREPARE insert_valid AS INSERT INTO devotionals (id, title, publication_date, reflection, practical_application, status) VALUES (gen_random_uuid(), 'Test Draft', CURRENT_DATE, 'Ref', 'App', 'draft');
SELECT lives_ok('insert_valid', 'Should allow valid status');

-- Test RLS
-- Create a published devotional
INSERT INTO devotionals (id, title, publication_date, reflection, practical_application, status) VALUES ('d8a0c2c2-84b8-4c4f-9e6e-2144b6118d22', 'Published Devo', CURRENT_DATE, 'Ref', 'App', 'published');
-- Create a draft devotional
INSERT INTO devotionals (id, title, publication_date, reflection, practical_application, status) VALUES ('f5b5b5b5-f5b5-f5b5-f5b5-f5b5b5b5b5b5', 'Draft Devo', CURRENT_DATE, 'Ref', 'App', 'draft');

-- Test public access (should only see published)
SET ROLE authenticated;
-- We need to mock auth.uid() to a non-admin user, but for now we just verify we can't see draft if not admin
-- Since we are testing with authenticated but not matching admin user_roles
SELECT results_eq(
    'SELECT title FROM devotionals WHERE id = ''d8a0c2c2-84b8-4c4f-9e6e-2144b6118d22''',
    ARRAY['Published Devo'::text],
    'Non-admins can see published devotionals'
);

SELECT is_empty(
    'SELECT title FROM devotionals WHERE id = ''f5b5b5b5-f5b5-f5b5-f5b5-f5b5b5b5b5b5''',
    'Non-admins cannot see draft devotionals'
);

RESET ROLE;
SELECT * FROM finish();
ROLLBACK;
