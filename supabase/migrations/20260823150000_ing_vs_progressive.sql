-- Grammar Everything: doing 现在分词 vs 进行时谓语（识别技巧）
-- 合并进 nonfinite-1（非谓语三种形态）关，与 gp-inf-recognition 同构：
-- 看 doing 前面有没有 am/is/are，有就是进行时谓语（be+doing 一起作谓语），没有就是现在分词作非谓语。
-- Author: Hermes Agent, 2026-08-23
BEGIN;

-- 1. 新 grammar_point（识别技巧，学习页可点击卡片）
INSERT INTO grammar_points (id, title_zh, body_zh) VALUES
  ('gp-ing-vs-progressive', 'doing 现在分词 ≠ 进行时谓语',
   'reading 是现在分词作非谓语；is reading 是进行时谓语。结构上区分：doing 前面有 am/is/are 就是进行时谓语（be+doing 一起作谓语），没有 be 就是现在分词。');

-- 2. anchor span：s-nf-anchor 的 "feeling"（34-41）——feeling 前面没有 am/is/are，是现在分词实例
INSERT INTO sentence_spans (id, sentence_id, grammar_point_id, start, "end") VALUES
  ('sp-nf-ing-vs-prog', 's-nf-anchor', 'gp-ing-vs-progressive', 34, 41);

-- 3. 对比例句 ×4（每句同时含"进行时谓语 be+doing"和"现在分词 doing"，形成对照）
INSERT INTO sentences (id, level_id, kind, en, zh, prompt_kind, image_url, sort_order) VALUES
  ('s-nf1-p10', 'nonfinite-1', 'playable', 'She is reading a book, feeling happy.', '她正在读书，感到开心。', 'zh', NULL, 10),
  ('s-nf1-p11', 'nonfinite-1', 'playable', 'He is watching TV, thinking about the test.', '他正在看电视，想着考试。', 'zh', NULL, 11),
  ('s-nf1-p12', 'nonfinite-1', 'playable', 'They are playing basketball, laughing loudly.', '他们正在打篮球，笑得很大声。', 'zh', NULL, 12),
  ('s-nf1-p13', 'nonfinite-1', 'playable', 'I am cooking dinner, listening to music.', '我正在做晚饭，听着音乐。', 'zh', NULL, 13);

-- 4. 新 slot 定义（复用优先，无现成才新建）
INSERT INTO slots (id, role, correct, distractors) VALUES
  ('sl-v-is-reading', 'V', 'is reading', '["reads","is read","reading"]'::jsonb),
  ('sl-o-a-book', 'O', 'a book', '["the book","books","an book"]'::jsonb),
  ('sl-v-is-watching', 'V', 'is watching', '["watches","is watched","watching"]'::jsonb),
  ('sl-pp-a-thinking', 'PP-A', 'thinking', '["to think","thought","thinks"]'::jsonb),
  ('sl-a-about-the-test', 'A', 'about the test', '["about tests","about a test","for the test"]'::jsonb),
  ('sl-v-are-playing', 'V', 'are playing', '["play","are played","playing"]'::jsonb),
  ('sl-pp-a-laughing', 'PP-A', 'laughing', '["to laugh","laughed","laughs"]'::jsonb),
  ('sl-a-loudly', 'A', 'loudly', '["loud","louder","loudness"]'::jsonb),
  ('sl-v-am-cooking', 'V', 'am cooking', '["cook","am cooked","cooking"]'::jsonb),
  ('sl-o-dinner', 'O', 'dinner', '["dinners","the dinner","a dinner"]'::jsonb),
  ('sl-pp-a-listening', 'PP-A', 'listening', '["to listen","listened","listens"]'::jsonb),
  ('sl-a-to-music', 'A', 'to music', '["to the music","for music","at music"]'::jsonb);

-- 5. sentence_slot_refs（slot_index = 原句 LTR 顺序，0 起连续）
INSERT INTO sentence_slot_refs (sentence_id, slot_index, slot_id) VALUES
  -- She is reading a book, feeling happy.
  ('s-nf1-p10', 0, 'sl-s-she'),
  ('s-nf1-p10', 1, 'sl-v-is-reading'),
  ('s-nf1-p10', 2, 'sl-o-a-book'),
  ('s-nf1-p10', 3, 'sl-pp-a-feeling'),
  ('s-nf1-p10', 4, 'sl-c-happy'),
  -- He is watching TV, thinking about the test.
  ('s-nf1-p11', 0, 'sl-s-he'),
  ('s-nf1-p11', 1, 'sl-v-is-watching'),
  ('s-nf1-p11', 2, 'sl-o-tv'),
  ('s-nf1-p11', 3, 'sl-pp-a-thinking'),
  ('s-nf1-p11', 4, 'sl-a-about-the-test'),
  -- They are playing basketball, laughing loudly.
  ('s-nf1-p12', 0, 'sl-s-they'),
  ('s-nf1-p12', 1, 'sl-v-are-playing'),
  ('s-nf1-p12', 2, 'sl-o-basketball'),
  ('s-nf1-p12', 3, 'sl-pp-a-laughing'),
  ('s-nf1-p12', 4, 'sl-a-loudly'),
  -- I am cooking dinner, listening to music.
  ('s-nf1-p13', 0, 'sl-s-i'),
  ('s-nf1-p13', 1, 'sl-v-am-cooking'),
  ('s-nf1-p13', 2, 'sl-o-dinner'),
  ('s-nf1-p13', 3, 'sl-pp-a-listening'),
  ('s-nf1-p13', 4, 'sl-a-to-music');

COMMIT;
