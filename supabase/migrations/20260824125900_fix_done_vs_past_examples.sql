BEGIN;

-- Fix gp-done-vs-past (user feedback 2026-08-24):
-- "ended" is not a good passive absolute construction (intransitive reading
-- makes "The meeting ended, we left." read like a comma splice). Corrected
-- lesson per feedback: use transitive "canceled" for the contrast pair and
-- add the intransitive-verb pitfall ("The sun risen, we set off." ✗).
--
-- 1. Rewrite knowledge-point body with corrected examples + pitfall.
UPDATE grammar_points
SET body_zh = 'done 过去分词与过去式拼写相同，靠【句子有没有另一套主句谓语】区分：逗号前后先找主句谓语，有主句谓语就是分词非谓语，没有就是过去式谓语。例：The sports meeting was canceled.（单句，was + canceled 构成过去时被动谓语）；The sports meeting canceled, students went home.（独立主格，主句谓语是 went home）。坑：过去分词做独立主格，主语必须能以被动形式存在（及物动词）——The sun risen, we set off. ✗（rise 不及物，无被动），要说 The sun having risen, we set off. ✓'
WHERE id = 'gp-done-vs-past';

-- 2. Replace example sentences (ended → corrected pair).
--    p14: single clause, was + canceled = past passive predicate
--    p15: absolute construction with intransitive verb needs having + pp
UPDATE sentences SET en = 'The sports meeting was canceled.', zh = '运动会取消了。' WHERE id = 's-nf1-p14';
UPDATE sentences SET en = 'The sun having risen, we set off.', zh = '太阳升起后，我们出发了。' WHERE id = 's-nf1-p15';

-- 3. New slot definitions (no reusable existing slot for these).
INSERT INTO slots (id, role, correct, distractors) VALUES
  ('sl-s-the-sports-meeting', 'S', 'The sports meeting', '["A sports meeting","The sports match","This sports meeting"]'::jsonb),
  ('sl-v-was-canceled', 'V', 'was canceled', '["is canceled","were canceled","was cancel"]'::jsonb),
  ('sl-s-the-sun', 'S', 'The sun', '["A sun","The moon","The star"]'::jsonb),
  ('sl-pp-p-having-risen', 'PP-P', 'having risen', '["risen","had risen","to rise"]'::jsonb),
  ('sl-v-set-off', 'V', 'set off', '["sets off","setting off","set on"]'::jsonb);

-- 4. Rebuild refs for the two rewritten sentences (slot_index = LTR order).
DELETE FROM sentence_slot_refs WHERE sentence_id IN ('s-nf1-p14', 's-nf1-p15');

INSERT INTO sentence_slot_refs (sentence_id, slot_index, slot_id) VALUES
  -- The sports meeting was canceled.（单句：was + canceled = 过去时被动谓语）
  ('s-nf1-p14', 0, 'sl-s-the-sports-meeting'),
  ('s-nf1-p14', 1, 'sl-v-was-canceled'),
  -- The sun having risen, we set off.（独立主格：不及物动词用 having + 过去分词）
  ('s-nf1-p15', 0, 'sl-s-the-sun'),
  ('s-nf1-p15', 1, 'sl-pp-p-having-risen'),
  ('s-nf1-p15', 2, 'sl-s-we-2'),
  ('s-nf1-p15', 3, 'sl-v-set-off');

COMMIT;
