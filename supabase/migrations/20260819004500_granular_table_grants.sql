-- Migration: granular_table_grants
-- Purpose: Grant necessary table-level privileges (SELECT, INSERT, UPDATE, DELETE) to anon and authenticated
-- while relying on RLS for record-level authorization.

-- 1. Read-only access for anon (Public Content)
GRANT SELECT ON public.devotionals TO anon;
GRANT SELECT ON public.devotional_translations TO anon;
GRANT SELECT ON public.categories TO anon;
GRANT SELECT ON public.themes TO anon;
GRANT SELECT ON public.testimonials TO anon;
GRANT SELECT ON public.testimonial_responses TO anon;

-- 2. Read-only access for authenticated (Public Content + User Config)
GRANT SELECT ON public.devotionals TO authenticated;
GRANT SELECT ON public.devotional_translations TO authenticated;
GRANT SELECT ON public.categories TO authenticated;
GRANT SELECT ON public.themes TO authenticated;
GRANT SELECT ON public.testimonials TO authenticated;
GRANT SELECT ON public.testimonial_responses TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.daily_progress TO authenticated;
GRANT SELECT ON public.favorites TO authenticated;
GRANT SELECT ON public.user_devotionals TO authenticated;

-- 3. Write access for authenticated (User Operations)
-- Profiles (Update own profile)
GRANT UPDATE ON public.profiles TO authenticated;

-- Progress (Insert/Update own progress)
GRANT INSERT, UPDATE ON public.daily_progress TO authenticated;
GRANT INSERT, UPDATE ON public.user_devotionals TO authenticated;

-- Favorites (Insert/Delete own favorites)
GRANT INSERT, DELETE ON public.favorites TO authenticated;

-- 4. Write access for authenticated (Admin Operations)
-- Note: These operations are protected by RLS (only admins can mutate via row-level security)
GRANT INSERT, UPDATE, DELETE ON public.devotionals TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.devotional_translations TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.themes TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.testimonials TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.testimonial_responses TO authenticated;
