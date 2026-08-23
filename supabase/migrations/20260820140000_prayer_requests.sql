-- Enable moddatetime extension if not enabled
CREATE EXTENSION IF NOT EXISTS moddatetime;

-- Create prayer_requests table
CREATE TABLE IF NOT EXISTS prayer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  devotional_id UUID REFERENCES devotionals(id) ON DELETE SET NULL,
  language TEXT NOT NULL DEFAULT 'pt-BR',
  request TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS handle_prayer_requests_updated_at ON prayer_requests;
CREATE TRIGGER handle_prayer_requests_updated_at BEFORE UPDATE ON prayer_requests
  FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

-- Enable RLS
ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;

-- 1. INSERT Policy: User can only insert for themselves, with pending status
DROP POLICY IF EXISTS "Users can insert their own prayer requests" ON prayer_requests;
CREATE POLICY "Users can insert their own prayer requests" ON prayer_requests
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND 
    status = 'pending'
  );

-- 2. SELECT Policy: User can only view their own prayer requests
DROP POLICY IF EXISTS "Users can view their own prayer requests" ON prayer_requests;
CREATE POLICY "Users can view their own prayer requests" ON prayer_requests
  FOR SELECT
  USING (auth.uid() = user_id);

-- 3. UPDATE Policy: User can only update their own pending prayer requests
DROP POLICY IF EXISTS "Users can update their own pending prayer requests" ON prayer_requests;
CREATE POLICY "Users can update their own pending prayer requests" ON prayer_requests
  FOR UPDATE
  USING (
    auth.uid() = user_id AND 
    status = 'pending'
  )
  WITH CHECK (
    auth.uid() = user_id AND 
    status = 'pending'
  );

-- 4. DELETE Policy: User can only delete their own pending prayer requests
DROP POLICY IF EXISTS "Users can delete their own pending prayer requests" ON prayer_requests;
CREATE POLICY "Users can delete their own pending prayer requests" ON prayer_requests
  FOR DELETE
  USING (
    auth.uid() = user_id AND 
    status = 'pending'
  );
