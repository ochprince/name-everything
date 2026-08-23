-- Grammar Everything: done 过去分词 vs 过去式（识别技巧）
-- 合并进 nonfinite-1（非谓语三种形态）关。拼写完全相同，靠【句子有没有
-- 另外一套主句谓语】区分：逗号前后先找主句谓语——有主句谓语，done 形就是
-- 过去分词非谓语；单句只有它，就是过去式谓语。
-- 例：The meeting ended.（ended=过去式谓语）；The meeting ended, we left.
--     （独立主格，ended=过去分词非谓语，主句谓语是 left）
-- Author: Hermes Agent, 2026-08-23
BEGIN;

-- 1. 新 grammar_point（识别技巧，学习页可点击卡片）
INSERT INTO grammar_points (id, title_zh, body_zh) VALUES
  ('gp-done-vs-past', 'done 过去分词 ≠ 过去式',
   'ended 拼写既是过去式也是过去分词。The meeting ended. 单句没有别的谓语，ended 是过去式谓语；The meeting ended, we left. 里主句谓语是 left，ended 就是过去分词非谓语。区分方法：逗号前后先找主句谓语，有主句谓语就是分词，没有就是过去式。');

-- 2. anchor span：s-nf-anchor 的 "excited"（52-59）——主句已有谓语 went，excited 是过去分词
INSERT INTO sentence_spans (id, sentence_id, grammar_point_id, start, "end") VALUES
  ('sp-nf-done-vs-past', 's-nf-anchor', 'gp-done-vs-past', 52, 59);

-- 3. 对比例句 ×4（单句过去式 vs 独立主格分词，形成对照）
INSERT INTO sentences (id, level_id, kind, en, zh, prompt_kind, image_url, sort_order) VALUES
  ('s-nf1-p14', 'nonfinite-1', 'playable', 'The meeting ended.', '会议结束了。', 'zh', NULL, 14),
  ('s-nf1-p15', 'nonfinite-1', 'playable', 'The meeting ended, we left.', '会议结束后，我们离开了。', 'zh', NULL, 15),
  ('s-nf1-p16', 'nonfinite-1', 'playable', 'The work finished, they went home.', '工作完成后，他们回家了。', 'zh', NULL, 16),
  ('s-nf1-p17', 'nonfinite-1', 'playable', 'The book closed, she slept.', '书合上后，她睡着了。', 'zh', NULL, 17);

-- 4. 新 slot 定义（复用优先，无现成才新建）
INSERT INTO slots (id, role, correct, distractors) VALUES
  ('sl-s-the-meeting', 'S', 'The meeting', '["A meeting","The meetings","This meeting"]'::jsonb),
  ('sl-v-ended', 'V', 'ended', '["end","ends","ending"]'::jsonb),
  ('sl-pp-p-ended', 'PP-P', 'ended', '["was ended","ending","end"]'::jsonb),
  ('sl-s-we-2', 'S', 'we', '["us","our","they"]'::jsonb),
  ('sl-v-left', 'V', 'left', '["leave","leaves","leaving"]'::jsonb),
  ('sl-s-the-work', 'S', 'The work', '["A work","Works","The works"]'::jsonb),
  ('sl-pp-p-finished', 'PP-P', 'finished', '["was finished","finishing","finish"]'::jsonb),
  ('sl-a-home', 'A', 'home', '["to home","the home","homes"]'::jsonb),
  ('sl-s-the-book', 'S', 'The book', '["A book","Books","The books"]'::jsonb),
  ('sl-pp-p-closed', 'PP-P', 'closed', '["was closed","closing","close"]'::jsonb),
  ('sl-v-slept', 'V', 'slept', '["sleep","sleeps","sleeping"]'::jsonb);

-- 5. sentence_slot_refs（slot_index = 原句 LTR 顺序，0 起连续）
INSERT INTO sentence_slot_refs (sentence_id, slot_index, slot_id) VALUES
  -- The meeting ended.（单句：ended 是过去式谓语）
  ('s-nf1-p14', 0, 'sl-s-the-meeting'),
  ('s-nf1-p14', 1, 'sl-v-ended'),
  -- The meeting ended, we left.（独立主格：ended 分词，left 主句谓语）
  ('s-nf1-p15', 0, 'sl-s-the-meeting'),
  ('s-nf1-p15', 1, 'sl-pp-p-ended'),
  ('s-nf1-p15', 2, 'sl-s-we-2'),
  ('s-nf1-p15', 3, 'sl-v-left'),
  -- The work finished, they went home.（独立主格）
  ('s-nf1-p16', 0, 'sl-s-the-work'),
  ('s-nf1-p16', 1, 'sl-pp-p-finished'),
  ('s-nf1-p16', 2, 'sl-s-they-3'),
  ('s-nf1-p16', 3, 'sl-v-went'),
  ('s-nf1-p16', 4, 'sl-a-home'),
  -- The book closed, she slept.（独立主格）
  ('s-nf1-p17', 0, 'sl-s-the-book'),
  ('s-nf1-p17', 1, 'sl-pp-p-closed'),
  ('s-nf1-p17', 2, 'sl-s-she-5'),
  ('s-nf1-p17', 3, 'sl-v-slept');

COMMIT;
