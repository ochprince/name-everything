CREATE TABLE grammar_produce_candidates (
  id UUID PRIMARY KEY,
  level_id TEXT NOT NULL,
  en TEXT NOT NULL,
  zh TEXT NOT NULL,
  device_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT grammar_produce_candidates_en_nonempty CHECK (char_length(trim(en)) > 0),
  CONSTRAINT grammar_produce_candidates_zh_nonempty CHECK (char_length(trim(zh)) > 0),
  CONSTRAINT grammar_produce_candidates_level_nonempty CHECK (char_length(trim(level_id)) > 0)
);

ALTER TABLE grammar_produce_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY grammar_produce_candidates_anon_insert ON grammar_produce_candidates
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(trim(en)) > 0
    AND char_length(trim(zh)) > 0
    AND char_length(trim(level_id)) > 0
  );

GRANT INSERT ON grammar_produce_candidates TO anon, authenticated;
