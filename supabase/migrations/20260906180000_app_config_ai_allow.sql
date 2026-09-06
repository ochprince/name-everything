-- Generic key/value config (AI allow list is one key, not a dedicated table).
CREATE TABLE app_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
-- No anon/authenticated policies: only service role and SECURITY DEFINER RPCs.

INSERT INTO app_config (key, value)
VALUES ('ai.allow_device_ids', '[]'::jsonb)
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION ai_is_allowed(p_device_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT value @> jsonb_build_array(p_device_id)
      FROM app_config
      WHERE key = 'ai.allow_device_ids'
    ),
    false
  );
$$;

REVOKE ALL ON FUNCTION ai_is_allowed(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION ai_is_allowed(text) TO anon, authenticated;
