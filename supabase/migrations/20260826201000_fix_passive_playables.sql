-- Grammar Everything 内容修复（报错 b73375bc）：
-- passive-1 是被动语态关，p1/p2 原为主动句，全部替换为被动句。
--   s-pv1-p1: Many people think pollution is serious. → The window was broken by the boy.
--   s-pv1-p2: People should never skip breakfast.    → English is spoken in many countries.
-- 复用 sl-v-is（is 槽位）；其余 10 个槽位为新建。旧槽位保留（可能被其他句引用）。

BEGIN;

UPDATE sentences
SET en = 'The window was broken by the boy.',
    zh = '窗户被那个男孩打破了。'
WHERE id = 's-pv1-p1';

UPDATE sentences
SET en = 'English is spoken in many countries.',
    zh = '英语在许多国家被使用。'
WHERE id = 's-pv1-p2';

INSERT INTO slots (id, role, correct, distractors) VALUES
  ('sl-s-the-window', 'S', 'The window', '["The windows","Windows","A windows"]'::jsonb),
  ('sl-v-was', 'V', 'was', '["is","were","are"]'::jsonb),
  ('sl-pp-p-broken', 'PP', 'broken', '["broke","breaking","breaks"]'::jsonb),
  ('sl-a-by', 'A', 'by', '["from","of","at"]'::jsonb),
  ('sl-a-the-boy', 'A', 'the boy', '["boy","a boys","the boy''s"]'::jsonb),
  ('sl-s-english', 'S', 'English', '["Englishes","An English","The English"]'::jsonb),
  ('sl-pp-p-spoken', 'PP', 'spoken', '["speak","speaks","speaking"]'::jsonb),
  ('sl-a-in', 'A', 'in', '["at","on","from"]'::jsonb),
  ('sl-a-many', 'A', 'many', '["much","many of","a much"]'::jsonb),
  ('sl-a-countries', 'A', 'countries', '["country","countrys","the country"]'::jsonb);

DELETE FROM sentence_slot_refs WHERE sentence_id IN ('s-pv1-p1', 's-pv1-p2');

INSERT INTO sentence_slot_refs (sentence_id, slot_index, slot_id) VALUES
  ('s-pv1-p1', 0, 'sl-s-the-window'),
  ('s-pv1-p1', 1, 'sl-v-was'),
  ('s-pv1-p1', 2, 'sl-pp-p-broken'),
  ('s-pv1-p1', 3, 'sl-a-by'),
  ('s-pv1-p1', 4, 'sl-a-the-boy'),
  ('s-pv1-p2', 0, 'sl-s-english'),
  ('s-pv1-p2', 1, 'sl-v-is'),
  ('s-pv1-p2', 2, 'sl-pp-p-spoken'),
  ('s-pv1-p2', 3, 'sl-a-in'),
  ('s-pv1-p2', 4, 'sl-a-many'),
  ('s-pv1-p2', 5, 'sl-a-countries');

COMMIT;
