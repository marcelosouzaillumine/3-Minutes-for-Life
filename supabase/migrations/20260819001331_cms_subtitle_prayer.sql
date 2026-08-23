-- Migration: cms_subtitle_prayer
-- Purpose: Adds subtitle and prayer fields to devotionals and translations

-- 1. Add columns to devotionals
ALTER TABLE public.devotionals 
  ADD COLUMN IF NOT EXISTS subtitle text,
  ADD COLUMN IF NOT EXISTS prayer text;

-- 2. Add columns to devotional_translations
ALTER TABLE public.devotional_translations 
  ADD COLUMN IF NOT EXISTS subtitle text,
  ADD COLUMN IF NOT EXISTS prayer text;
