INSERT INTO public.translation_jobs (devotional_id, source_language, target_language, status)
SELECT d.id, 'pt-BR', l.iso_code, 'queued'
FROM public.devotionals d
CROSS JOIN public.languages l
WHERE d.status = 'published'
  AND d.id = '55772fdb-db88-4ba2-a539-3c745d24e64d'
  AND l.is_active = true 
  AND l.auto_translate = true 
  AND l.is_source = false
  AND NOT EXISTS (
    SELECT 1 FROM public.devotional_translations dt
    WHERE dt.devotional_id = d.id 
      AND dt.language = l.iso_code 
      AND dt.status = 'published'
  )
ON CONFLICT (devotional_id, source_language, target_language) WHERE status IN ('queued', 'translating')
DO NOTHING
RETURNING id, target_language;
