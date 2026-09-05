-- The partial unique index on translation_jobs prevented ON CONFLICT upserts
-- because PostgreSQL requires a full unique constraint as conflict target.
-- Replace the partial index with a full unique constraint so that
-- .upsert(jobs, { onConflict: 'devotional_id,source_language,target_language' })
-- works correctly. The upsert will now update status back to 'queued' when a
-- job already exists (e.g. re-queuing a completed or failed translation).

DROP INDEX IF EXISTS public.idx_translation_jobs_unique_active;

ALTER TABLE public.translation_jobs
  DROP CONSTRAINT IF EXISTS translation_jobs_devotional_source_target_key;

-- Remove duplicates keeping the row with the highest priority status
-- (queued > translating > completed > failed) and latest id.
DELETE FROM public.translation_jobs
WHERE id NOT IN (
  SELECT DISTINCT ON (devotional_id, source_language, target_language) id
  FROM public.translation_jobs
  ORDER BY
    devotional_id,
    source_language,
    target_language,
    CASE status
      WHEN 'queued'      THEN 1
      WHEN 'translating' THEN 2
      WHEN 'completed'   THEN 3
      WHEN 'failed'      THEN 4
      ELSE 5
    END,
    id DESC
);

ALTER TABLE public.translation_jobs
  ADD CONSTRAINT translation_jobs_devotional_source_target_key
  UNIQUE (devotional_id, source_language, target_language);
