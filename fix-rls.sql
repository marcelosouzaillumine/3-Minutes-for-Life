DROP POLICY IF EXISTS "Anyone can view published translations" ON public.devotional_translations;

CREATE POLICY "Anyone can view published translations"
  ON public.devotional_translations FOR SELECT
  USING (true);
