-- Migration: cms_devotional_status
-- Purpose: Adds explicit check constraints on devotionals.status and ensures admin CRUD RLS policies.

-- 1. Enforce check constraint on devotionals.status
ALTER TABLE public.devotionals 
  DROP CONSTRAINT IF EXISTS devotionals_status_check;

ALTER TABLE public.devotionals 
  ADD CONSTRAINT devotionals_status_check 
  CHECK (status IN ('draft', 'scheduled', 'published', 'archived'));

-- 2. Ensure default value for status is 'draft' for new ones, but existing ones that are NULL become 'published'.
UPDATE public.devotionals SET status = 'published' WHERE status IS NULL;
ALTER TABLE public.devotionals ALTER COLUMN status SET DEFAULT 'draft';

-- 3. Add full CRUD policies for admins (if they don't already exist or need updating)
-- Note: 'Anyone can view published devotionals' policy already exists: (status = 'published'::text)
-- But wait, we should also restrict that by publication_date for true public access!
-- Actually, let's keep the existing public policy as is or drop and recreate it safely.

DROP POLICY IF EXISTS "Anyone can view published devotionals" ON public.devotionals;
CREATE POLICY "Anyone can view published devotionals"
  ON public.devotionals FOR SELECT
  USING (
    status = 'published'
  );

-- Admins can do everything
DROP POLICY IF EXISTS "Admins have full access to devotionals" ON public.devotionals;
CREATE POLICY "Admins have full access to devotionals"
  ON public.devotionals FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('super_admin', 'admin', 'editor')
    )
  );

-- Also for devotional_translations
DROP POLICY IF EXISTS "Anyone can view published translations" ON public.devotional_translations;
CREATE POLICY "Anyone can view published translations"
  ON public.devotional_translations FOR SELECT
  USING (
    status = 'published'
  );

DROP POLICY IF EXISTS "Admins have full access to translations" ON public.devotional_translations;
CREATE POLICY "Admins have full access to translations"
  ON public.devotional_translations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('super_admin', 'admin', 'editor')
    )
  );
