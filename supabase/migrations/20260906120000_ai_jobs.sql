CREATE TABLE ai_jobs (
  id UUID PRIMARY KEY,
  capability TEXT NOT NULL CHECK (capability IN ('text', 'image', 'tts')),
  status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'completed', 'failed', 'rejected')),
  device_id TEXT NOT NULL,
  input JSONB NOT NULL,
  output JSONB,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  claimed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_ai_jobs_queued ON ai_jobs (created_at) WHERE status = 'queued';
CREATE INDEX idx_ai_jobs_device_created ON ai_jobs (device_id, created_at);
CREATE INDEX idx_ai_jobs_terminal_completed ON ai_jobs (completed_at)
  WHERE status IN ('completed', 'failed', 'rejected');

CREATE TABLE ai_quota_devices (
  device_id TEXT PRIMARY KEY,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE ai_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_quota_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_jobs_anon_insert ON ai_jobs
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    status = 'queued'
    AND output IS NULL
    AND error IS NULL
    AND claimed_at IS NULL
    AND completed_at IS NULL
    AND capability IN ('text', 'image', 'tts')
    AND char_length(device_id) > 0
  );

CREATE OR REPLACE FUNCTION get_ai_job(p_id uuid)
RETURNS ai_jobs
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM ai_jobs WHERE id = p_id;
$$;

CREATE OR REPLACE FUNCTION claim_ai_job()
RETURNS ai_jobs
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
    RETURN NULL;
  END IF;

  UPDATE ai_jobs
  SET status = 'running',
      claimed_at = now()
  WHERE id = job.id
  RETURNING * INTO job;

  RETURN job;
END;
$$;

REVOKE ALL ON FUNCTION get_ai_job(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_ai_job(uuid) TO anon, authenticated;

REVOKE ALL ON FUNCTION claim_ai_job() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION claim_ai_job() TO service_role;

GRANT INSERT ON ai_jobs TO anon, authenticated;
