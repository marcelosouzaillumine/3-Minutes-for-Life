-- Create personal_reflections table
CREATE TABLE public.personal_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  devotional_id UUID NOT NULL REFERENCES public.devotionals(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, devotional_id)
);

-- Enable RLS
ALTER TABLE public.personal_reflections ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own personal reflections"
  ON public.personal_reflections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own personal reflections"
  ON public.personal_reflections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own personal reflections"
  ON public.personal_reflections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own personal reflections"
  ON public.personal_reflections FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to automatically update the updated_at timestamp
CREATE TRIGGER on_personal_reflections_updated
  BEFORE UPDATE ON public.personal_reflections
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
