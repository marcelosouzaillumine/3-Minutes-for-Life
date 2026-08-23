-- Create new user_devotionals table for the Journey domain
CREATE TABLE public.user_devotionals (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  devotional_id UUID REFERENCES public.devotionals(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  PRIMARY KEY (user_id, devotional_id)
);

-- RLS for user_devotionals
ALTER TABLE public.user_devotionals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own devotionals"
  ON public.user_devotionals
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Migrate existing daily_progress data into user_devotionals
INSERT INTO public.user_devotionals (user_id, devotional_id, read_at, created_at)
SELECT dp.user_id, d.id, dp.date::timestamptz, dp.created_at
FROM public.daily_progress dp
JOIN public.devotionals d ON dp.principle_id = d.legacy_id
ON CONFLICT (user_id, devotional_id) DO NOTHING;

-- Dual Read for Favorites
-- Add devotional_id to existing favorites table
ALTER TABLE public.favorites ADD COLUMN devotional_id UUID REFERENCES public.devotionals(id) ON DELETE CASCADE;

-- Backfill devotional_id in favorites
UPDATE public.favorites f
SET devotional_id = d.id
FROM public.devotionals d
WHERE f.principle_id = d.legacy_id;

-- Make devotional_id required going forward? Not yet, we are in Dual Read phase, so both can exist.
-- But we should add a UNIQUE constraint to ensure (user_id, devotional_id) is unique.
ALTER TABLE public.favorites ADD CONSTRAINT favorites_user_devotional_key UNIQUE (user_id, devotional_id);

-- Ensure RLS on favorites covers the new structure perfectly
-- The existing policy on favorites is likely just auth.uid() = user_id, which remains valid.
