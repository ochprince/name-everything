BEGIN;

-- Fix subject-3 validator errors (2026-08-25):
-- 1. "come" contains "me" → first-occurrence LTR check fails on anchor slot "me"
--    (me@16 < makes@32). Switch to "visit my school".
-- 2. Shared that-clause slot mixed case: anchor needs capital "That" (sentence
--    start), p2 needs lowercase "that" (mid-sentence). Split into two slots.

-- 1. 句子 en 修正
UPDATE sentences SET en = 'That she will visit my school makes me happy.' WHERE id = 's-subj3-anchor';
UPDATE sentences SET en = 'It makes me happy that she will visit my school.' WHERE id = 's-subj3-p2';

-- 2. 新 slot（句首大写 / 句中小写 各一）
INSERT INTO slots (id, role, correct, distractors) VALUES
  ('sl-s-that-she-will-visit-my-school', 'S', 'That she will visit my school', '["She will visit my school","That she will visits my school","What she will visit my school"]'::jsonb),
  ('sl-s-that-she-will-visit-my-school-2', 'S', 'that she will visit my school', '["she will visit my school","that she will visits my school","what she will visit my school"]'::jsonb);

-- 3. refs 指向新 slot
UPDATE sentence_slot_refs SET slot_id = 'sl-s-that-she-will-visit-my-school' WHERE sentence_id = 's-subj3-anchor' AND slot_index = 0;
UPDATE sentence_slot_refs SET slot_id = 'sl-s-that-she-will-visit-my-school-2' WHERE sentence_id = 's-subj3-p2' AND slot_index = 4;

-- 4. anchor spans 偏移随新句子更新
UPDATE sentence_spans SET start = 0, "end" = 29 WHERE id = 'sp-subj3-s';
UPDATE sentence_spans SET start = 30, "end" = 44 WHERE id = 'sp-subj3-v';

COMMIT;
