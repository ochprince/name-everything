-- Picture Everything word catalog (CET4 baicizhan metadata; media are CDN filenames)

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
  sentence_audio TEXT NOT NULL
);

CREATE INDEX idx_picture_words_sort_order ON picture_words (sort_order);

ALTER TABLE picture_words ENABLE ROW LEVEL SECURITY;

CREATE POLICY "picture_words_public_read" ON picture_words
  FOR SELECT TO anon, authenticated USING (true);

GRANT SELECT ON picture_words TO anon, authenticated;

INSERT INTO content_table_versions (table_name, version) VALUES
  ('picture_words', 1);

CREATE TRIGGER trg_picture_words_bump_version
  AFTER INSERT OR UPDATE OR DELETE ON picture_words
  FOR EACH STATEMENT EXECUTE FUNCTION bump_content_table_version();
