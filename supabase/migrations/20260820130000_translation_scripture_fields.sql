-- Migration: translation_scripture_fields
-- Description: Adds scripture_reference and scripture_text to devotional_translations table and backfills pt-BR records.

ALTER TABLE public.devotional_translations
  ADD COLUMN IF NOT EXISTS scripture_reference TEXT,
  ADD COLUMN IF NOT EXISTS scripture_text TEXT;

-- Backfill pt-BR translations from base devotionals
UPDATE public.devotional_translations dt
SET 
  scripture_reference = d.scripture_reference,
  scripture_text = d.scripture_text
FROM public.devotionals d
WHERE dt.devotional_id = d.id AND dt.language = 'pt-BR';
