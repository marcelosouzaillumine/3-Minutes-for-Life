CREATE OR REPLACE FUNCTION public.claim_translation_jobs(
  p_worker_id text,
  p_limit int DEFAULT 10
)
RETURNS SETOF public.translation_jobs AS $$
BEGIN
  RETURN QUERY
  WITH locked_jobs AS (
    SELECT id 
    FROM public.translation_jobs
    WHERE status = 'queued' 
       OR (status = 'translating' AND locked_at < NOW() - INTERVAL '10 minutes')
    ORDER BY created_at ASC
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.translation_jobs
  SET 
    status = 'translating',
    locked_at = NOW(),
    locked_by = p_worker_id,
    attempts = attempts + 1
  WHERE id IN (SELECT id FROM locked_jobs)
  RETURNING *;
END;
$$ LANGUAGE plpgsql;
