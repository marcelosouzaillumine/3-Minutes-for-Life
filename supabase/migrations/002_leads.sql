-- Create leads table
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Create policy for public insert
CREATE POLICY "Anyone can insert a lead"
  ON public.leads FOR INSERT
  WITH CHECK (true);

-- No select/update/delete policies for public
-- Service role bypasses RLS, so admin queries still work
