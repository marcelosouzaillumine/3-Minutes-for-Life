-- Enable moddatetime extension
CREATE EXTENSION IF NOT EXISTS moddatetime;

-- Create enum for testimonial status
CREATE TYPE testimonial_status AS ENUM ('pending', 'reviewed', 'archived');

-- Create testimonials table
CREATE TABLE testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  devotional_id UUID REFERENCES devotionals(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  status testimonial_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add updated_at trigger
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON testimonials
  FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

-- Enable RLS
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- 1. INSERT Policy: User can only insert for themselves, and status must be 'pending' (default)
CREATE POLICY "Users can insert their own testimonials" ON testimonials
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND 
    status = 'pending'
  );

-- 2. SELECT Policy: User can only see their own testimonials
CREATE POLICY "Users can view their own testimonials" ON testimonials
  FOR SELECT
  USING (auth.uid() = user_id);

-- 3. UPDATE Policy: User can only update their own pending testimonials, and cannot change protected fields
CREATE POLICY "Users can update their own pending testimonials" ON testimonials
  FOR UPDATE
  USING (
    auth.uid() = user_id AND 
    status = 'pending'
  )
  WITH CHECK (
    -- Ensure they don't try to change to another user
    auth.uid() = user_id AND 
    -- Ensure they are still pending
    status = 'pending'
  );

-- 4. DELETE Policy: User can only delete their own pending testimonials
CREATE POLICY "Users can delete their own pending testimonials" ON testimonials
  FOR DELETE
  USING (
    auth.uid() = user_id AND 
    status = 'pending'
  );
