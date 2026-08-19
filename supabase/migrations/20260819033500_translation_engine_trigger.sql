CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Trigger Function to compute content_hash BEFORE INSERT OR UPDATE
CREATE OR REPLACE FUNCTION public.compute_devotional_content_hash()
RETURNS TRIGGER AS $$
BEGIN
  -- jsonb implicitly sorts keys, providing a deterministic payload
  NEW.content_hash := encode(digest(
    jsonb_build_object(
      'title', COALESCE(NEW.title, ''),
      'subtitle', COALESCE(NEW.subtitle, ''),
      'principle_statement', COALESCE(NEW.principle_statement, ''),
      'reflection', COALESCE(NEW.reflection, ''),
      'practical_application', COALESCE(NEW.practical_application, ''),
      'prayer', COALESCE(NEW.prayer, '')
    )::text,
    'sha256'
  ), 'hex');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_devotional_compute_hash
  BEFORE INSERT OR UPDATE ON public.devotionals
  FOR EACH ROW EXECUTE FUNCTION public.compute_devotional_content_hash();


-- 2. Trigger Function to enqueue jobs AFTER INSERT OR UPDATE
CREATE OR REPLACE FUNCTION public.enqueue_translation_jobs()
RETURNS TRIGGER AS $$
BEGIN
  -- Only enqueue if devotional is published
  IF NEW.status = 'published' THEN
    -- If it's a new insert, or if the content hash actually changed
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.content_hash IS DISTINCT FROM OLD.content_hash) THEN
      
      -- We assume pt-BR is the source for now. 
      -- A more robust way is to fetch the language where is_source = true, but hardcoding 'pt-BR' is fine for this specific scope as requested.
      
      INSERT INTO public.translation_jobs (devotional_id, source_language, target_language, status)
      SELECT 
        NEW.id, 
        'pt-BR', 
        iso_code, 
        'queued'
      FROM public.languages
      WHERE is_active = true AND auto_translate = true AND is_source = false
      ON CONFLICT (devotional_id, source_language, target_language) WHERE status IN ('queued', 'translating')
      DO NOTHING;
      
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_devotional_enqueue_translations
  AFTER INSERT OR UPDATE ON public.devotionals
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_translation_jobs();
