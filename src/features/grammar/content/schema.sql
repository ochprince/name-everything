-- Grammar Everything content schema (spec §8.1)
-- Not executed by the app in week-1; JSON is source of truth.

CREATE TABLE chapters (
  id TEXT PRIMARY KEY,
  title_zh TEXT NOT NULL,
  description_zh TEXT,
  sort_order INTEGER NOT NULL,
  released INTEGER NOT NULL DEFAULT 0 CHECK (released IN (0, 1))
);

CREATE TABLE grammar_points (
  id TEXT PRIMARY KEY,
  title_zh TEXT NOT NULL,
  body_zh TEXT NOT NULL
);

CREATE TABLE levels (
  id TEXT PRIMARY KEY,
  chapter_id TEXT NOT NULL REFERENCES chapters(id),
  sort_order INTEGER NOT NULL,
  grammar_point_id TEXT NOT NULL REFERENCES grammar_points(id),
  pass_threshold INTEGER,
  lives INTEGER,
  fall_duration_ms INTEGER
);

CREATE TABLE sentences (
  id TEXT PRIMARY KEY,
  level_id TEXT NOT NULL REFERENCES levels(id),
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
  sentence_id TEXT NOT NULL REFERENCES sentences(id),
  grammar_point_id TEXT NOT NULL REFERENCES grammar_points(id),
  start INTEGER NOT NULL,
  end INTEGER NOT NULL
);

CREATE TABLE sentence_slots (
  id TEXT PRIMARY KEY,
  sentence_id TEXT NOT NULL REFERENCES sentences(id),
  slot_index INTEGER NOT NULL,
  role TEXT NOT NULL,
  correct TEXT NOT NULL,
  distractors TEXT NOT NULL -- JSON array of strings
);

CREATE TABLE game_tuning (
  key TEXT PRIMARY KEY,
  value REAL NOT NULL
);

CREATE TABLE asset_reports (
  id TEXT PRIMARY KEY,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('sentence', 'grammar_point', 'sentence_slot')),
  asset_id TEXT NOT NULL,
  level_id TEXT REFERENCES levels(id),
  note TEXT,
  created_at TEXT NOT NULL -- ISO-8601
);
