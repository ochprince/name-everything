-- Grammar Everything: obj-1 报错修复两处
-- 1) s-obj1-p1：中文「她用旧自行车换了一辆新的」用「了」= 过去，英文改一般过去时
--    （sl-v-exchanges 仍被 s-obj1-p2 使用，不动；新建 sl-v-exchanged）
-- 2) s-obj1-p4：I want to → I would like to（更礼貌的说法），for a bigger size → for a larger one
--    （sl-s-i / sl-inf-to-exchange / sl-o-this-shirt 复用；新建 sl-v-would-like / sl-a-for-a-larger-one）
-- Author: Hermes Agent, 2026-09-13

BEGIN;

-- 1) s-obj1-p1: She exchanges her old bike for a new one. → She exchanged her old bike for a new one.
INSERT INTO slots (id, role, correct, distractors) VALUES
  ('sl-v-exchanged', 'V', 'exchanged', '["exchange","exchanges","exchanging"]'::jsonb);

UPDATE sentences
SET en = 'She exchanged her old bike for a new one.'
WHERE id = 's-obj1-p1';

UPDATE sentence_slot_refs
SET slot_id = 'sl-v-exchanged'
WHERE sentence_id = 's-obj1-p1' AND slot_index = 1;

-- 2) s-obj1-p4: I want to exchange this shirt for a bigger size. → I would like to exchange this shirt for a larger one.
INSERT INTO slots (id, role, correct, distractors) VALUES
  ('sl-v-would-like', 'V', 'would like', '["will like","would likes","would liking"]'::jsonb),
  ('sl-a-for-a-larger-one', 'A', 'for a larger one', '["for a larger ones","to a larger one","for larger one"]'::jsonb);

UPDATE sentences
SET en = 'I would like to exchange this shirt for a larger one.'
WHERE id = 's-obj1-p4';

UPDATE sentence_slot_refs
SET slot_id = 'sl-v-would-like'
WHERE sentence_id = 's-obj1-p4' AND slot_index = 1;

UPDATE sentence_slot_refs
SET slot_id = 'sl-a-for-a-larger-one'
WHERE sentence_id = 's-obj1-p4' AND slot_index = 4;

COMMIT;
