-- Migration: manual_translation_source
-- Description: Adds translation_source column ('manual' | 'ai') and updates unique constraint to support both AI and manual versions per devotional/language.

-- 1. Add translation_source column with default 'ai' and check constraint
ALTER TABLE public.devotional_translations 
  ADD COLUMN IF NOT EXISTS translation_source text NOT NULL DEFAULT 'ai';

ALTER TABLE public.devotional_translations 
  DROP CONSTRAINT IF EXISTS devotional_translations_source_check;

ALTER TABLE public.devotional_translations 
  ADD CONSTRAINT devotional_translations_source_check 
  CHECK (translation_source IN ('manual', 'ai'));

-- 2. Audit existing records: pt-BR records are editorial/manual, while en/es test seeds are AI
UPDATE public.devotional_translations 
SET translation_source = 'manual'
WHERE language = 'pt-BR';

-- 3. Drop legacy unique constraint on (devotional_id, language)
ALTER TABLE public.devotional_translations 
  DROP CONSTRAINT IF EXISTS devotional_translations_devotional_id_language_key;

ALTER TABLE public.devotional_translations 
  DROP CONSTRAINT IF EXISTS devotional_translations_devotional_id_language_translation_source_key;

ALTER TABLE public.devotional_translations 
  DROP CONSTRAINT IF EXISTS devotional_translations_devotional_id_language_source_key;

-- 4. Create new compound unique constraint
ALTER TABLE public.devotional_translations 
  ADD CONSTRAINT devotional_translations_devotional_id_language_source_key 
  UNIQUE (devotional_id, language, translation_source);
