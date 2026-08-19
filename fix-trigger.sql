CREATE OR REPLACE FUNCTION public.enqueue_translation_jobs()
RETURNS TRIGGER AS $$
BEGIN
  -- If it's a new insert, or if the content hash actually changed
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.content_hash IS DISTINCT FROM OLD.content_hash) THEN
    
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Manually queue all existing devotionals that don't have jobs yet
INSERT INTO public.translation_jobs (devotional_id, source_language, target_language, status)
SELECT 
  d.id, 
  'pt-BR', 
  l.iso_code, 
  'queued'
FROM public.devotionals d
CROSS JOIN public.languages l
WHERE l.is_active = true AND l.auto_translate = true AND l.is_source = false
ON CONFLICT (devotional_id, source_language, target_language) WHERE status IN ('queued', 'translating')
DO NOTHING;
