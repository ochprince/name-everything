-- Per-table content versions + produce tuning keys
-- Trigger bumps version on any content-table mutation.

CREATE TABLE content_table_versions (
  table_name TEXT PRIMARY KEY,
  version BIGINT NOT NULL DEFAULT 1
);

ALTER TABLE content_table_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "content_table_versions_public_read" ON content_table_versions
  FOR SELECT TO anon, authenticated USING (true);

GRANT SELECT ON content_table_versions TO anon, authenticated;

INSERT INTO content_table_versions (table_name, version) VALUES
  ('chapters', 1),
  ('grammar_points', 1),
  ('levels', 1),
  ('sentences', 1),
  ('sentence_spans', 1),
  ('slots', 1),
  ('sentence_slot_refs', 1),
  ('game_tuning', 1);

CREATE OR REPLACE FUNCTION bump_content_table_version()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE content_table_versions
  SET version = version + 1
  WHERE table_name = TG_TABLE_NAME;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_chapters_bump_version
  AFTER INSERT OR UPDATE OR DELETE ON chapters
  FOR EACH STATEMENT EXECUTE FUNCTION bump_content_table_version();

CREATE TRIGGER trg_grammar_points_bump_version
  AFTER INSERT OR UPDATE OR DELETE ON grammar_points
  FOR EACH STATEMENT EXECUTE FUNCTION bump_content_table_version();

CREATE TRIGGER trg_levels_bump_version
  AFTER INSERT OR UPDATE OR DELETE ON levels
  FOR EACH STATEMENT EXECUTE FUNCTION bump_content_table_version();

CREATE TRIGGER trg_sentences_bump_version
  AFTER INSERT OR UPDATE OR DELETE ON sentences
  FOR EACH STATEMENT EXECUTE FUNCTION bump_content_table_version();

CREATE TRIGGER trg_sentence_spans_bump_version
  AFTER INSERT OR UPDATE OR DELETE ON sentence_spans
  FOR EACH STATEMENT EXECUTE FUNCTION bump_content_table_version();

CREATE TRIGGER trg_slots_bump_version
  AFTER INSERT OR UPDATE OR DELETE ON slots
  FOR EACH STATEMENT EXECUTE FUNCTION bump_content_table_version();

CREATE TRIGGER trg_sentence_slot_refs_bump_version
  AFTER INSERT OR UPDATE OR DELETE ON sentence_slot_refs
  FOR EACH STATEMENT EXECUTE FUNCTION bump_content_table_version();

CREATE TRIGGER trg_game_tuning_bump_version
  AFTER INSERT OR UPDATE OR DELETE ON game_tuning
  FOR EACH STATEMENT EXECUTE FUNCTION bump_content_table_version();

INSERT INTO game_tuning (key, value) VALUES
  ('produce_answer_ratio', 0.5),
  ('produce_fall_duration_factor', 1.5)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
