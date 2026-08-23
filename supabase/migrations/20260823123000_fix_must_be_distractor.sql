BEGIN;

-- Cross-slot swallow: distractor "must be" includes next slot correct "be".
UPDATE sentence_slots
SET distractors = '["should","can","will"]'::jsonb
WHERE id IN (
  's-mod-anchor-slot-1',
  's-mod-p1-slot-1',
  's-mod-p2-slot-1',
  's-mod-p3-slot-1'
);

COMMIT;
