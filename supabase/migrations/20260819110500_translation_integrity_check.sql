-- Migration: translation_integrity_check
-- Purpose: Add strict DB check for published status requiring title, reflection, and principle_statement

-- Backfill missing principle_statements for already published translations so the constraint can be applied
UPDATE public.devotional_translations 
SET principle_statement = 'Princípio em atualização' 
WHERE status = 'published' 
  AND (principle_statement IS NULL OR trim(principle_statement) = '');

ALTER TABLE public.devotional_translations DROP CONSTRAINT IF EXISTS devotional_translations_published_check;

ALTER TABLE public.devotional_translations
  ADD CONSTRAINT devotional_translations_published_check
  CHECK (
    status <> 'published'
    OR (
      title IS NOT NULL AND length(trim(title)) > 0
      AND reflection IS NOT NULL AND length(trim(reflection)) > 0
      AND principle_statement IS NOT NULL AND length(trim(principle_statement)) > 0
    )
  );
