-- Grammar Everything: 主动语态 → 被动语态（主语切换 + 省略施动者实现客观）
-- 新开 level passive-1（predicate 章第 4 关）。语态是谓语上的新结构
-- （be + 过去分词构成被动谓语，受动者作语法主语），不属于已有关卡的
-- 应用/变体，故新开。
-- 例：Many people think pollution is serious.（主动，施动者作主语）
--      Pollution is thought to be serious.（被动，受动者作主语，省略 by many people 更客观）
--      People should never skip breakfast. → Breakfast should never be skipped.
-- Author: Hermes Agent, 2026-08-25
BEGIN;

-- 1. 新 grammar_points（umbrella + 子规则）
INSERT INTO grammar_points (id, title_zh, body_zh) VALUES
  ('gp-passive', '被动语态',
   '主动句主语是施动者；变被动后，受动者成为语法主语，谓语变成 be + 过去分词。施动者用 by 引出，可以省略。'),
  ('gp-passive-objective', '被动实现客观',
   '写作中借助被动实现客观的核心，是省略 by + 施动者——不写"谁做的"，人为视角就消失。Pollution is thought to be serious. 就比 Many people think pollution is serious. 客观。');

-- 2. 新 level（predicate 章第 4 关）
INSERT INTO levels (id, chapter_id, sort_order, grammar_point_id, pass_threshold, lives, fall_duration_ms) VALUES
  ('passive-1', 'predicate', 4, 'gp-passive', NULL, NULL, NULL);

-- 3. 句子：1 anchor（被动句，展示 be+done 结构）+ 3 playable（主动/被动成对对照）
INSERT INTO sentences (id, level_id, kind, en, zh, prompt_kind, image_url, sort_order) VALUES
  ('s-pv-anchor', 'passive-1', 'anchor', 'Pollution is thought to be serious.', '污染被认为是严重的。', 'zh', NULL, 0),
  ('s-pv1-p1', 'passive-1', 'playable', 'Many people think pollution is serious.', '许多人认为污染是严重的。', 'zh', NULL, 1),
  ('s-pv1-p2', 'passive-1', 'playable', 'People should never skip breakfast.', '人们绝不应该不吃早餐。', 'zh', NULL, 2),
  ('s-pv1-p3', 'passive-1', 'playable', 'Breakfast should never be skipped.', '早餐绝不应该被跳过。', 'zh', NULL, 3);

-- 4. anchor spans（只挂 anchor；learning page 可点击）
INSERT INTO sentence_spans (id, sentence_id, grammar_point_id, start, "end") VALUES
  ('sp-pv-passive', 's-pv-anchor', 'gp-passive', 10, 20),           -- is thought
  ('sp-pv-objective', 's-pv-anchor', 'gp-passive-objective', 0, 9), -- Pollution（受动者作主语，施动者被省略）
  ('sp-pv-inf', 's-pv-anchor', 'gp-inf-to-do', 21, 34);             -- to be serious

-- 5. 新 slot 定义（复用优先；无现成才新建）
INSERT INTO slots (id, role, correct, distractors) VALUES
  ('sl-s-pollution', 'S', 'Pollution', '["The pollution","Pollutions","Polluted"]'::jsonb),
  ('sl-v-is-thought', 'V', 'is thought', '["thought","is thinking","is think"]'::jsonb),
  ('sl-inf-to-be-serious', 'INF', 'to be serious', '["being serious","to serious","be serious"]'::jsonb),
  ('sl-s-many-people', 'S', 'Many people', '["Much people","Many person","The many people"]'::jsonb),
  ('sl-v-think', 'V', 'think', '["thinks","thinking","thought"]'::jsonb),
  ('sl-s-pollution-2', 'S', 'pollution', '["Pollution","pollutions","the pollution"]'::jsonb),
  ('sl-c-serious', 'C', 'serious', '["seriously","seriousness","seriouser"]'::jsonb),
  ('sl-s-people', 'S', 'People', '["The people","Peoples","a people"]'::jsonb),
  ('sl-mod-should', 'MOD', 'should', '["must","can","will"]'::jsonb),
  ('sl-a-never', 'A', 'never', '["not","no","ever"]'::jsonb),
  ('sl-v-skip', 'V', 'skip', '["skips","skipped","skipping"]'::jsonb),
  ('sl-o-breakfast', 'O', 'breakfast', '["breakfasts","the breakfast","a breakfast"]'::jsonb),
  ('sl-s-breakfast', 'S', 'Breakfast', '["The breakfast","Breakfasts","A breakfast"]'::jsonb),
  ('sl-pp-p-skipped', 'PP-P', 'skipped', '["skip","skipping","was skipped"]'::jsonb);

-- 6. sentence_slot_refs（slot_index = 原句 LTR 顺序，0 起连续；复用 sl-v-is / sl-v-be）
INSERT INTO sentence_slot_refs (sentence_id, slot_index, slot_id) VALUES
  -- Pollution is thought to be serious.（anchor：受动者作主语 + be+done 被动谓语）
  ('s-pv-anchor', 0, 'sl-s-pollution'),
  ('s-pv-anchor', 1, 'sl-v-is-thought'),
  ('s-pv-anchor', 2, 'sl-inf-to-be-serious'),
  -- Many people think pollution is serious.（主动：施动者 many people 作主语）
  ('s-pv1-p1', 0, 'sl-s-many-people'),
  ('s-pv1-p1', 1, 'sl-v-think'),
  ('s-pv1-p1', 2, 'sl-s-pollution-2'),
  ('s-pv1-p1', 3, 'sl-v-is'),
  ('s-pv1-p1', 4, 'sl-c-serious'),
  -- People should never skip breakfast.（主动 + 情态：skip 原形，breakfast 是宾语）
  ('s-pv1-p2', 0, 'sl-s-people'),
  ('s-pv1-p2', 1, 'sl-mod-should'),
  ('s-pv1-p2', 2, 'sl-a-never'),
  ('s-pv1-p2', 3, 'sl-v-skip'),
  ('s-pv1-p2', 4, 'sl-o-breakfast'),
  -- Breakfast should never be skipped.（被动 + 情态：breakfast 变主语，be+skipped 被动谓语）
  ('s-pv1-p3', 0, 'sl-s-breakfast'),
  ('s-pv1-p3', 1, 'sl-mod-should'),
  ('s-pv1-p3', 2, 'sl-a-never'),
  ('s-pv1-p3', 3, 'sl-v-be'),
  ('s-pv1-p3', 4, 'sl-pp-p-skipped');

COMMIT;
