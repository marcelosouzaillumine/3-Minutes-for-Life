-- 1. Add preferred_language to profiles
ALTER TABLE public.profiles 
ADD COLUMN preferred_language TEXT DEFAULT 'pt-BR';

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_preferred_language_check 
CHECK (preferred_language IN ('pt-BR', 'en', 'es'));

-- 2. Create devotional_translations table
CREATE TABLE public.devotional_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  devotional_id UUID NOT NULL REFERENCES public.devotionals(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  title TEXT NOT NULL,
  reflection TEXT NOT NULL,
  practical_application TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(devotional_id, language),
  CONSTRAINT devotional_translations_language_check CHECK (language IN ('pt-BR', 'en', 'es'))
);

-- Enable RLS
ALTER TABLE public.devotional_translations ENABLE ROW LEVEL SECURITY;

-- Policies for devotional_translations
CREATE POLICY "Anyone can view published translations" 
  ON public.devotional_translations 
  FOR SELECT 
  USING (status = 'published');

-- Trigger for updated_at
CREATE TRIGGER on_devotional_translations_updated
  BEFORE UPDATE ON public.devotional_translations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3. Seed initial pt-BR data from devotionals
INSERT INTO public.devotional_translations (devotional_id, language, title, reflection, practical_application, status)
SELECT 
  id as devotional_id,
  'pt-BR' as language,
  title,
  reflection,
  practical_application,
  'published' as status
FROM public.devotionals;
