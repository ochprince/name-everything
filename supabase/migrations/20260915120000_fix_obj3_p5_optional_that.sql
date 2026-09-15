-- fix(content): obj-3 宾语从句 p5 统一 that 省略口径
-- 报错（提问型）：学生按中文「我们知道地球是圆的」写 We know the earth is round. 被判错，
-- 而同一关 p1 / p2 本来就是省略 that 的写法，gp-object-clause 正文也明写「that 可以省略」。
-- 语法口径：宾语从句的 that 可省（不省也对），此处无「必须保留 that」的语境。
-- 改动：
--   1) en 改为省略 that 的版本（与 p1/p2 及知识点正文一致）
--   2) 新建 O 槽 sl-o-the-earth-is-round（correct 去 that，干扰项改从句内部错误型：
--      主谓一致 / 词形 / 缺冠词），旧槽 sl-o-that-the-earth-is-round 变孤儿（仅本句引用，留着无害）
--   3) refs 的 slot_index=2 改指向新槽
BEGIN;

UPDATE sentences SET en = 'We know the earth is round.' WHERE id = 's-obj3-p5';

INSERT INTO slots (id, role, correct, distractors) VALUES
  ('sl-o-the-earth-is-round', 'O', 'the earth is round',
   '["the earth are round","the earth is rounds","earth is round"]'::jsonb);

UPDATE sentence_slot_refs SET slot_id = 'sl-o-the-earth-is-round'
 WHERE sentence_id = 's-obj3-p5' AND slot_index = 2;

COMMIT;
