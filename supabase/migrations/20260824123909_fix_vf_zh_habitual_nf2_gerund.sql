BEGIN;

-- Fix reported content issues (2026-08-24 user feedback):
--
-- 1) verb-form-1 playables s-vf-p1/p2/p3: zh used 「在…」(progressive marker),
--    which makes the -ing distractor (watching/eating/reading) the "correct"
--    translation of the Chinese, contradicting the simple-present answer.
--    Reword zh to a habitual reading so distractors stay valid boundaries.
UPDATE sentences SET zh = '他很累，经常看电视。' WHERE id = 's-vf-p1';
UPDATE sentences SET zh = '汤姆饿了，经常吃午饭。' WHERE id = 's-vf-p2';
UPDATE sentences SET zh = '玛丽很安静，经常读书。' WHERE id = 's-vf-p3';

-- 2) nonfinite-2 playable s-nf2-p5: "My hobby is to collect stamps." is
--    grammatically valid (infinitive as subject complement), so it is not a
--    real distractor for the gerund complement. Replace with past participle,
--    which is clearly wrong after "My hobby is ...".
UPDATE slots
SET distractors = '["collect stamps","collects stamps","collected stamps"]'::jsonb
WHERE id = 'sl-ger-collecting-stamps';

COMMIT;
