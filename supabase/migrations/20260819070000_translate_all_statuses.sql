-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS on_devotional_enqueue_translations ON public.devotionals;

-- Recreate the trigger function WITHOUT the status check
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

-- Reattach the trigger
CREATE TRIGGER on_devotional_enqueue_translations
  AFTER INSERT OR UPDATE ON public.devotionals
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_translation_jobs();

-- Manually enqueue jobs for ALL EXISTING devotionals (drafts, published, archived) that aren't queued yet
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
