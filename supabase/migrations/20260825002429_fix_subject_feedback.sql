BEGIN;

-- Fix 4 user feedback reports (2026-08-25) on subject chapter:

-- 1. s-subj3-p3: en 是 made（一般过去时），中文应体现过去——加「了」
UPDATE sentences SET zh = '他撒谎让我们生气了。' WHERE id = 's-subj3-p3';

-- 2. sp-subj3-v: 谓语只有 makes，me happy 是宾语+宾补，不属谓语
--    （识别范围 [30,44) → [30,35)），并补 me→gp-o、happy→gp-oc 两个 span
UPDATE sentence_spans SET "end" = 35 WHERE id = 'sp-subj3-v';
INSERT INTO sentence_spans (id, sentence_id, grammar_point_id, start, "end") VALUES
  ('sp-subj3-o', 's-subj3-anchor', 'gp-o', 36, 38),
  ('sp-subj3-oc', 's-subj3-anchor', 'gp-oc', 39, 44);

-- 3. sl-s-it: 干扰项 It's 与下一空 is 冲突（It's 整体成立，会造成歧义），
--    替换为 We（人称代词 + 主谓一致双重错误，五处引用句全部明确错误）
UPDATE slots SET distractors = '["Its","They","We"]'::jsonb WHERE id = 'sl-s-it';

-- 4. sp-subj2-v: 谓语只有 keeps（实义动词），snowing 是现在分词作宾语
--    （识别范围 [3,16) → [3,8)），并补 snowing→gp-ing-form 的 span
UPDATE sentence_spans SET "end" = 8 WHERE id = 'sp-subj2-v';
INSERT INTO sentence_spans (id, sentence_id, grammar_point_id, start, "end") VALUES
  ('sp-subj2-ing', 's-subj2-anchor', 'gp-ing-form', 9, 16);

COMMIT;
