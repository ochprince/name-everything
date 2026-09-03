-- Grammar: subject-4 p2 换句（用户报障，同中文例句考两遍 + grounds 拟人化）
--   p2 原句 There are grounds that can explain my perspective.（zh 与 p3 完全相同，
--   且 that 从句让 grounds 充当 explain 施动者——理由自己"解释"观点，拟人化不地道）
--   → 整句替换为 There is a robot that can wash the dishes.（that 从句考点保留，
--     主语换成真能做出动作的名词；zh 一并更新，消除同关同中文考两遍）
--   连带：gp-there-be 知识点正文的 that 从句示范句与错误示范句同步换新。
-- Author: Hermes Agent, 2026-09-03
BEGIN;

INSERT INTO slots (id, role, correct, distractors) VALUES
  ('sl-s-a-robot', 'S', 'a robot', '["robots","a robots","robot''s"]'::jsonb),
  ('sl-mod-that-can-wash', 'MOD', 'that can wash', '["can wash","that can washes","that can washing"]'::jsonb);

UPDATE sentences
SET en = 'There is a robot that can wash the dishes.',
    zh = '有一个机器人可以洗碗。'
WHERE id = 's-subj4-p2';

DELETE FROM sentence_slot_refs WHERE sentence_id = 's-subj4-p2';

INSERT INTO sentence_slot_refs (sentence_id, slot_index, slot_id) VALUES
  ('s-subj4-p2', 0, 'sl-s-there'),
  ('s-subj4-p2', 1, 'sl-v-is-2'),
  ('s-subj4-p2', 2, 'sl-s-a-robot'),
  ('s-subj4-p2', 3, 'sl-mod-that-can-wash'),
  ('s-subj4-p2', 4, 'sl-o-the-dishes');

UPDATE grammar_points
SET body_zh = 'There 作引导词，真正的主语是 There be 后面的名词：There is an apple in her bag.（真正主语是 an apple）；There are four seasons in a year.。There be 后不能直接跟第二个谓语动词：加从句用关系代词 that/which 作从句主语修饰真正主语——There is a robot that can wash the dishes.；加非谓语用不定式作后置定语——There are grounds to explain my perspective.；错误写法 There is a robot can wash the dishes.（两套谓语无连接）'
WHERE id = 'gp-there-be';

COMMIT;
