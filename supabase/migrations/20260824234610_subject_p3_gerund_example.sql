BEGIN;

-- 主语章节：非谓语做主语的标杆例句替换（用户指定）
-- "Swimming in summer is fun." → "Being young and rich is his characteristic."
-- 与 anchor "Youth and richness are his characteristics." 形成
-- 名词短语做主语 vs 动名词短语做主语 的同义对照。

-- 1. 知识点正文补充非谓语示例
UPDATE grammar_points
SET body_zh = '主语的成分：名词/名词短语、代词、非谓语、从句。名词做主语：Youth and richness are his characteristics.（并列名词短语）；非谓语做主语：Being young and rich is his characteristic.（动名词短语）。注意：可数名词做主语不能单独用原形（裸用单数）——Girls tend to love beauty. ✓（复数泛指）；girl 单用 ✗，要说 a girl 或 the girl。'
WHERE id = 'gp-subject-forms';

-- 2. 替换 p3 例句
UPDATE sentences SET en = 'Being young and rich is his characteristic.', zh = '年轻又富有是他的特点。' WHERE id = 's-subj-p3';

-- 3. 新 slot（动名词短语做主语整空；表语单数版，与 anchor 复数表语对照）
INSERT INTO slots (id, role, correct, distractors) VALUES
  ('sl-ger-being-young-and-rich', 'GER', 'Being young and rich', '["Be young and rich","Being young and richer","Being youth and rich"]'::jsonb),
  ('sl-c-his-characteristic', 'C', 'his characteristic', '["his characteristics","he characteristic","him characteristic"]'::jsonb);

-- 4. 重写 p3 的 refs（slot_index = LTR）
DELETE FROM sentence_slot_refs WHERE sentence_id = 's-subj-p3';

INSERT INTO sentence_slot_refs (sentence_id, slot_index, slot_id) VALUES
  ('s-subj-p3', 0, 'sl-ger-being-young-and-rich'),
  ('s-subj-p3', 1, 'sl-v-is-2'),
  ('s-subj-p3', 2, 'sl-c-his-characteristic');

COMMIT;
