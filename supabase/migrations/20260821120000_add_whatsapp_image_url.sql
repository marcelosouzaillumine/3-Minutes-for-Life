-- Migration: add_whatsapp_image_url
-- Description: Adds the whatsapp_image_url column to the devotional_share_assets table.

ALTER TABLE public.devotional_share_assets
ADD COLUMN IF NOT EXISTS whatsapp_image_url TEXT NULL;
