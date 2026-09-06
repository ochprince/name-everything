-- claim_ai_job: empty queue must not RETURN NULL on a composite type
-- (PostgREST then tries to coerce the literal "null" into uuid → 22P02).
-- Return type change requires DROP first.
DROP FUNCTION IF EXISTS claim_ai_job();

CREATE FUNCTION claim_ai_job()
RETURNS SETOF ai_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  job ai_jobs;
BEGIN
  SELECT * INTO job
  FROM ai_jobs
  WHERE status = 'queued'
  ORDER BY created_at ASC
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  UPDATE ai_jobs
  SET status = 'running',
      claimed_at = now()
  WHERE id = job.id
  RETURNING * INTO job;

  RETURN NEXT job;
END;
$$;

REVOKE ALL ON FUNCTION claim_ai_job() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION claim_ai_job() TO service_role;
