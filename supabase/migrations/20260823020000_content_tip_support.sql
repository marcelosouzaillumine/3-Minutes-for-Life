-- Add optional editorial content and support fields to devotionals
ALTER TABLE public.devotionals
  ADD COLUMN IF NOT EXISTS content_tip TEXT,
  ADD COLUMN IF NOT EXISTS content_tip_image_url TEXT,
  ADD COLUMN IF NOT EXISTS support_message TEXT,
  ADD COLUMN IF NOT EXISTS support_banner_url TEXT;