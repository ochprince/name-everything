-- Grammar Everything: 新章节「主语」+ 第一个知识点「主语的成分」
-- 主语的成分：名词/名词短语、代词、非谓语、从句。
-- 扩展：可数名词做主语不能单用原形（Girls ✓ / girl ✗）。
-- Author: Hermes Agent, 2026-08-24
BEGIN;

-- 1. 新章节（released=true，用户明确要求新增章节进游戏）
INSERT INTO chapters (id, title_zh, description_zh, sort_order, released) VALUES
  ('subject', '主语', '名词、代词、非谓语、从句做主语。', 4, true);

-- 2. 新语法点
INSERT INTO grammar_points (id, title_zh, body_zh) VALUES
  ('gp-subject-forms', '主语的成分',
   '主语的成分：名词/名词短语、代词、非谓语、从句。名词做主语：Youth and richness are his characteristics.（并列名词短语做主语）。注意：可数名词做主语不能单独用原形（裸用单数）——Girls tend to love beauty. ✓（复数泛指）；girl 单用 ✗，要说 a girl 或 the girl。');

-- 3. 新关卡
INSERT INTO levels (id, chapter_id, sort_order, grammar_point_id, pass_threshold, lives, fall_duration_ms) VALUES
  ('subject-1', 'subject', 1, 'gp-subject-forms', NULL, NULL, NULL);

-- 4. 句子：1 anchor + 4 playable（覆盖四种成分）
INSERT INTO sentences (id, level_id, kind, en, zh, prompt_kind, image_url, sort_order) VALUES
  ('s-subj-anchor', 'subject-1', 'anchor', 'Youth and richness are his characteristics.', '青春和富有是他的特点。', 'zh', NULL, 0),
  ('s-subj-p1', 'subject-1', 'playable', 'Girls tend to love beauty.', '女孩们往往爱美。', 'zh', NULL, 1),
  ('s-subj-p2', 'subject-1', 'playable', 'She reads books every day.', '她每天读书。', 'zh', NULL, 2),
  ('s-subj-p3', 'subject-1', 'playable', 'Swimming in summer is fun.', '夏天游泳很有趣。', 'zh', NULL, 3),
  ('s-subj-p4', 'subject-1', 'playable', 'What he said made us laugh.', '他说的话让我们笑了。', 'zh', NULL, 4);

-- 5. anchor spans（识别练习：主语→gp-s，be→gp-be-forms，表语→gp-c）
INSERT INTO sentence_spans (id, sentence_id, grammar_point_id, start, "end") VALUES
  ('sp-subj-s', 's-subj-anchor', 'gp-s', 0, 18),
  ('sp-subj-be', 's-subj-anchor', 'gp-be-forms', 19, 22),
  ('sp-subj-c', 's-subj-anchor', 'gp-c', 23, 42);

-- 6. 新 slot 定义（复用优先；以下均无现成定义）
INSERT INTO slots (id, role, correct, distractors) VALUES
  ('sl-s-youth-and-richness', 'S', 'Youth and richness', '["Young and richness","Youth and rich","Youth and the richness"]'::jsonb),
  ('sl-c-his-characteristics', 'C', 'his characteristics', '["his characteristic","he characteristics","him characteristics"]'::jsonb),
  ('sl-s-girls', 'S', 'Girls', '["Girl","A girl","The girl"]'::jsonb),
  ('sl-v-tend', 'V', 'tend', '["tends","tending","tended"]'::jsonb),
  ('sl-inf-to-love', 'INF', 'to love', '["loving","to loving","love"]'::jsonb),
  ('sl-o-beauty', 'O', 'beauty', '["beauties","beautiful","beautifully"]'::jsonb),
  ('sl-a-every-day', 'A', 'every day', '["everyday","every days","each days"]'::jsonb),
  ('sl-ger-swimming', 'GER', 'Swimming', '["Swim","Swims","Swimmer"]'::jsonb),
  ('sl-a-in-summer', 'A', 'in summer', '["on summer","at summer","in summers"]'::jsonb),
  ('sl-c-fun', 'C', 'fun', '["funny","funs","a fun"]'::jsonb),
  ('sl-s-what-he-said', 'S', 'What he said', '["What he say","That he said","What did he say"]'::jsonb);

-- 7. sentence_slot_refs（slot_index = 原句 LTR 顺序，0 起连续；复用 sl-v-are/sl-s-she/sl-v-reads/sl-o-books/sl-v-is-2/sl-v-made/sl-o-us/sl-v-laugh）
INSERT INTO sentence_slot_refs (sentence_id, slot_index, slot_id) VALUES
  -- Youth and richness are his characteristics.（anchor：并列名词短语做主语）
  ('s-subj-anchor', 0, 'sl-s-youth-and-richness'),
  ('s-subj-anchor', 1, 'sl-v-are'),
  ('s-subj-anchor', 2, 'sl-c-his-characteristics'),
  -- Girls tend to love beauty.（名词复数做主语，Girl 裸用 ✗）
  ('s-subj-p1', 0, 'sl-s-girls'),
  ('s-subj-p1', 1, 'sl-v-tend'),
  ('s-subj-p1', 2, 'sl-inf-to-love'),
  ('s-subj-p1', 3, 'sl-o-beauty'),
  -- She reads books every day.（代词做主语）
  ('s-subj-p2', 0, 'sl-s-she'),
  ('s-subj-p2', 1, 'sl-v-reads'),
  ('s-subj-p2', 2, 'sl-o-books'),
  ('s-subj-p2', 3, 'sl-a-every-day'),
  -- Swimming in summer is fun.（动名词做主语）
  ('s-subj-p3', 0, 'sl-ger-swimming'),
  ('s-subj-p3', 1, 'sl-a-in-summer'),
  ('s-subj-p3', 2, 'sl-v-is-2'),
  ('s-subj-p3', 3, 'sl-c-fun'),
  -- What he said made us laugh.（从句做主语）
  ('s-subj-p4', 0, 'sl-s-what-he-said'),
  ('s-subj-p4', 1, 'sl-v-made'),
  ('s-subj-p4', 2, 'sl-o-us'),
  ('s-subj-p4', 3, 'sl-v-laugh');

COMMIT;
