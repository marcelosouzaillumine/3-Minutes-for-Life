-- 1. Create Languages table
CREATE TABLE public.languages (
  iso_code varchar(10) PRIMARY KEY,
  name varchar(50) NOT NULL,
  native_name varchar(50) NOT NULL,
  flag_emoji varchar(10),
  is_active boolean DEFAULT true,
  is_source boolean DEFAULT false,
  auto_translate boolean DEFAULT true,
  display_order int DEFAULT 0
);

ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view languages" ON public.languages FOR SELECT USING (true);

-- Seed basic languages
INSERT INTO public.languages (iso_code, name, native_name, flag_emoji, is_active, is_source, auto_translate, display_order) VALUES
('pt-BR', 'Português (Brasil)', 'Português', '🇧🇷', true, true, false, 1),
('en', 'English', 'English', '🇺🇸', true, false, true, 2),
('es', 'Spanish', 'Español', '🇪🇸', true, false, true, 3);


-- 2. Modify devotionals
ALTER TABLE public.devotionals ADD COLUMN IF NOT EXISTS content_hash varchar(64);


-- 3. Modify devotional_translations
ALTER TABLE public.devotional_translations DROP CONSTRAINT IF EXISTS devotional_translations_language_check;

ALTER TABLE public.devotional_translations 
  ADD COLUMN IF NOT EXISTS source_content_hash varchar(64),
  ADD COLUMN IF NOT EXISTS validation_warnings jsonb;

-- Link devotional_translations language to languages table (optional but good practice)
-- Postgres allows fk from TEXT to VARCHAR
ALTER TABLE public.devotional_translations 
  ADD CONSTRAINT fk_devotional_translations_language 
  FOREIGN KEY (language) REFERENCES public.languages(iso_code) ON DELETE CASCADE;


-- 4. Create Translation Glossary
CREATE TABLE public.translation_glossary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_language varchar(10) REFERENCES public.languages(iso_code) ON DELETE CASCADE,
  target_language varchar(10) REFERENCES public.languages(iso_code) ON DELETE CASCADE,
  source_term text NOT NULL,
  target_term text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.translation_glossary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view glossary" ON public.translation_glossary FOR SELECT USING (true);


-- 5. Create Translation Jobs (Queue)
CREATE TYPE translation_job_status AS ENUM ('queued', 'translating', 'completed', 'failed');

CREATE TABLE public.translation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  devotional_id uuid NOT NULL REFERENCES public.devotionals(id) ON DELETE CASCADE,
  source_language varchar(10) NOT NULL REFERENCES public.languages(iso_code) ON DELETE CASCADE,
  target_language varchar(10) NOT NULL REFERENCES public.languages(iso_code) ON DELETE CASCADE,
  status translation_job_status DEFAULT 'queued' NOT NULL,
  locked_at timestamptz,
  locked_by text,
  error_message text,
  warning_details jsonb,
  attempts int DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Unique index to prevent duplicate jobs for the same devotional and target language while it is active
CREATE UNIQUE INDEX idx_translation_jobs_unique_active 
  ON public.translation_jobs (devotional_id, source_language, target_language) 
  WHERE status IN ('queued', 'translating');

ALTER TABLE public.translation_jobs ENABLE ROW LEVEL SECURITY;
-- For edge function, service_role bypasses RLS. But for admin dashboard, allow admins:
CREATE POLICY "Super admins can manage translation_jobs" ON public.translation_jobs 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
  );

CREATE TRIGGER on_translation_jobs_updated
  BEFORE UPDATE ON public.translation_jobs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- 6. Create Translation Job Attempts (History)
CREATE TYPE translation_attempt_status AS ENUM ('timeout', 'invalid_response', 'success', 'error');

CREATE TABLE public.translation_job_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.translation_jobs(id) ON DELETE CASCADE,
  attempt_number int NOT NULL,
  status translation_attempt_status NOT NULL,
  error_details text,
  provider varchar(50),
  model varchar(50),
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz DEFAULT now()
);

ALTER TABLE public.translation_job_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins can manage translation_job_attempts" ON public.translation_job_attempts 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
  );
