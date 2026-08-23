-- Migration: cms_principle_statement
-- Purpose: Introduce the principle_statement field as part of the new structural editorial contract.
-- This separates the short introductory text from the main rich text reflection.

ALTER TABLE public.devotionals 
ADD COLUMN principle_statement TEXT NULL;

ALTER TABLE public.devotional_translations 
ADD COLUMN principle_statement TEXT NULL;

-- Note: We start with NULL to allow legacy compatibility.
-- Once all historical devotionals are migrated, this can be altered to NOT NULL.
