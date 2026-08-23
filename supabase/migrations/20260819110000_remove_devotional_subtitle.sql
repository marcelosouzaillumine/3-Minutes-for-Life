-- Migration: remove_devotional_subtitle
-- Purpose: Permanently remove the subtitle column from the canonical structure

-- 1. Remove column from translations
ALTER TABLE public.devotional_translations DROP COLUMN IF EXISTS subtitle;

-- 2. Remove column from devotionals
ALTER TABLE public.devotionals DROP COLUMN IF EXISTS subtitle;

-- 3. Update the hash trigger to stop including subtitle
CREATE OR REPLACE FUNCTION public.compute_devotional_content_hash()
RETURNS TRIGGER AS $$
BEGIN
  NEW.content_hash := encode(digest(
    jsonb_build_object(
      'title', COALESCE(NEW.title, ''),
      'principle_statement', COALESCE(NEW.principle_statement, ''),
      'reflection', COALESCE(NEW.reflection, ''),
      'practical_application', COALESCE(NEW.practical_application, ''),
      'prayer', COALESCE(NEW.prayer, '')
    )::text,
    'sha256'
  ), 'hex');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
