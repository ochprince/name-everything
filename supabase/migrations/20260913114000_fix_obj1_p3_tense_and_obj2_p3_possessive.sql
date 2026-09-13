-- Grammar Everything: obj-1 p3 时态 + obj-2 p3 物主代词（用户报错，按推荐口径）
-- 1) s-obj1-p3：中文「我们圣诞节互换了礼物」带「了」= 过去，英文改一般过去时
--    （复用上一 migration 新建的 sl-v-exchanged；sl-v-exchange 仍被 anchor / p5 使用，不动）
-- 2) s-obj2-p3：中文「她昨晚写完了报告」没有说「她的」，英文去掉 her，保证中文→英文唯一
--    （sl-v-finished / sl-ger-writing / sl-a-last-night 复用；新建 sl-o-the-report）
-- Author: Hermes Agent, 2026-09-13

BEGIN;

-- 1) s-obj1-p3: We exchange gifts with each other at Christmas. → We exchanged gifts with each other at Christmas.
UPDATE sentences
SET en = 'We exchanged gifts with each other at Christmas.'
WHERE id = 's-obj1-p3';

UPDATE sentence_slot_refs
SET slot_id = 'sl-v-exchanged'
WHERE sentence_id = 's-obj1-p3' AND slot_index = 1;

-- 2) s-obj2-p3: She finished writing her report last night. → She finished writing the report last night.
INSERT INTO slots (id, role, correct, distractors) VALUES
  ('sl-o-the-report', 'O', 'the report', '["the reports","a report","reports"]'::jsonb);

UPDATE sentences
SET en = 'She finished writing the report last night.'
WHERE id = 's-obj2-p3';

UPDATE sentence_slot_refs
SET slot_id = 'sl-o-the-report'
WHERE sentence_id = 's-obj2-p3' AND slot_index = 3;

COMMIT;
