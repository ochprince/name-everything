-- Grammar Everything content schema (canonical)
-- Skills MUST read this file (or the same migration) for table shapes.
-- Do not infer schema from superseded / deleted migrations.

CREATE TABLE chapters (
  id TEXT PRIMARY KEY,
  title_zh TEXT NOT NULL,
  description_zh TEXT,
  sort_order INTEGER NOT NULL,
  released BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE grammar_points (
  id TEXT PRIMARY KEY,
  title_zh TEXT NOT NULL,
  body_zh TEXT NOT NULL
);

CREATE TABLE levels (
  id TEXT PRIMARY KEY,
  chapter_id TEXT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL,
  grammar_point_id TEXT NOT NULL REFERENCES grammar_points(id) ON DELETE RESTRICT,
  pass_threshold INTEGER,
  lives INTEGER,
  fall_duration_ms INTEGER
);

CREATE TABLE sentences (
  id TEXT PRIMARY KEY,
  level_id TEXT NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('anchor', 'playable')),
  en TEXT NOT NULL,
  zh TEXT NOT NULL,
  prompt_kind TEXT NOT NULL CHECK (prompt_kind IN ('zh', 'image')),
  image_url TEXT,
  sort_order INTEGER NOT NULL
);

CREATE UNIQUE INDEX idx_sentences_one_anchor_per_level
  ON sentences(level_id) WHERE kind = 'anchor';

CREATE TABLE sentence_spans (
  id TEXT PRIMARY KEY,
  sentence_id TEXT NOT NULL REFERENCES sentences(id) ON DELETE CASCADE,
  grammar_point_id TEXT NOT NULL REFERENCES grammar_points(id) ON DELETE RESTRICT,
  start INTEGER NOT NULL,
  "end" INTEGER NOT NULL
);

-- Reusable slot definitions (role + correct + distractors)
CREATE TABLE slots (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL,
  correct TEXT NOT NULL,
  distractors JSONB NOT NULL
);

-- Per-sentence ordered placement; slot_index is play order (= left-to-right in en)
CREATE TABLE sentence_slot_refs (
  sentence_id TEXT NOT NULL REFERENCES sentences(id) ON DELETE CASCADE,
  slot_index INTEGER NOT NULL,
  slot_id TEXT NOT NULL REFERENCES slots(id) ON DELETE RESTRICT,
  PRIMARY KEY (sentence_id, slot_index)
);

CREATE INDEX idx_sentence_slot_refs_slot_id ON sentence_slot_refs(slot_id);

CREATE TABLE game_tuning (
  key TEXT PRIMARY KEY,
  value DOUBLE PRECISION NOT NULL
);

CREATE TABLE content_table_versions (
  table_name TEXT PRIMARY KEY,
  version BIGINT NOT NULL DEFAULT 1
);

CREATE TABLE picture_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL UNIQUE,
  word_level_id TEXT NOT NULL,
  word_audio TEXT NOT NULL,
  image_file TEXT NOT NULL,
  accent TEXT,
  mean_cn TEXT,
  mean_en TEXT,
  sentence_phrase TEXT,
  sentence TEXT NOT NULL,
  sentence_trans TEXT,
  sentence_audio TEXT NOT NULL,
  ai_corrected BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_picture_words_sort_order ON picture_words (sort_order);

CREATE TABLE asset_reports (
  id TEXT PRIMARY KEY,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('sentence', 'grammar_point', 'sentence_slot', 'picture_word')),
  asset_id TEXT NOT NULL,
  level_id TEXT REFERENCES levels(id) ON DELETE SET NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

CREATE TRIGGER trg_picture_words_bump_version
  AFTER INSERT OR UPDATE OR DELETE ON picture_words
  FOR EACH STATEMENT EXECUTE FUNCTION bump_content_table_version();

ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE grammar_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentences ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentence_spans ENABLE ROW LEVEL SECURITY;
ALTER TABLE slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentence_slot_refs ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_tuning ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_table_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE picture_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chapters_public_read" ON chapters
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "grammar_points_public_read" ON grammar_points
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "levels_public_read" ON levels
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "sentences_public_read" ON sentences
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "sentence_spans_public_read" ON sentence_spans
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "slots_public_read" ON slots
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "sentence_slot_refs_public_read" ON sentence_slot_refs
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "game_tuning_public_read" ON game_tuning
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "content_table_versions_public_read" ON content_table_versions
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "picture_words_public_read" ON picture_words
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "asset_reports_public_insert" ON asset_reports
  FOR INSERT TO anon, authenticated WITH CHECK (true);

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON chapters, grammar_points, levels, sentences, sentence_spans, slots, sentence_slot_refs, game_tuning, content_table_versions, picture_words TO anon, authenticated;
GRANT INSERT ON asset_reports TO anon, authenticated;
