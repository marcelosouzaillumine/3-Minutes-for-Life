-- Migration: editorial_share_center
-- Description: Creates the devotional_share_assets table and configures the share-assets Storage bucket.

-- 1. Create devotional_share_assets table
CREATE TABLE IF NOT EXISTS public.devotional_share_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  devotional_id UUID NOT NULL REFERENCES public.devotionals(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL REFERENCES public.languages(iso_code) ON DELETE CASCADE,
  whatsapp_text TEXT,
  feed_image_url TEXT,
  story_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT devotional_share_assets_unique_key UNIQUE (devotional_id, language_code)
);

-- 2. Create updated_at trigger for devotional_share_assets
CREATE TRIGGER on_devotional_share_assets_updated
  BEFORE UPDATE ON public.devotional_share_assets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3. Enable RLS on devotional_share_assets
ALTER TABLE public.devotional_share_assets ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for devotional_share_assets
-- Policy 1: Anyone can view share assets for published devotionals
DROP POLICY IF EXISTS "Anyone can view share assets for published devotionals" ON public.devotional_share_assets;
CREATE POLICY "Anyone can view share assets for published devotionals"
  ON public.devotional_share_assets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.devotionals d
      WHERE d.id = devotional_share_assets.devotional_id
        AND d.status = 'published'
    )
  );

-- Policy 2: Admins have full access to share assets
DROP POLICY IF EXISTS "Admins have full access to share assets" ON public.devotional_share_assets;
CREATE POLICY "Admins have full access to share assets"
  ON public.devotional_share_assets FOR ALL
  USING (
    public.has_role(ARRAY['super_admin'::public.app_role, 'admin'::public.app_role, 'editor'::public.app_role])
  )
  WITH CHECK (
    public.has_role(ARRAY['super_admin'::public.app_role, 'admin'::public.app_role, 'editor'::public.app_role])
  );

-- 5. Configure Storage Bucket
-- Insert share-assets bucket into storage.buckets if it does not exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'share-assets',
  'share-assets',
  true,
  5242880, -- 5MB limit
  '{image/png,image/jpeg,image/webp}'
)
ON CONFLICT (id) DO NOTHING;

-- 6. Create Storage Policies
-- Policy 1: Public read access to share-assets bucket
DROP POLICY IF EXISTS "Anyone can view share assets in storage" ON storage.objects;
CREATE POLICY "Anyone can view share assets in storage"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'share-assets');

-- Policy 2: Authenticated admin write/delete access to share-assets bucket
DROP POLICY IF EXISTS "Admins can manage share assets in storage" ON storage.objects;
CREATE POLICY "Admins can manage share assets in storage"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'share-assets' AND
    public.has_role(ARRAY['super_admin'::public.app_role, 'admin'::public.app_role, 'editor'::public.app_role])
  )
  WITH CHECK (
    bucket_id = 'share-assets' AND
    public.has_role(ARRAY['super_admin'::public.app_role, 'admin'::public.app_role, 'editor'::public.app_role])
  );
