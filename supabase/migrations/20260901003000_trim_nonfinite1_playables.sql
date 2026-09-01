BEGIN;

-- 压缩 nonfinite-1（非谓语三种形态）playables：17 → 11
-- 用户要求（2026-09-01）：去掉各组近重复句，保留代表；refs 由 ON DELETE CASCADE 自动清理

DELETE FROM sentences WHERE id IN (
  's-nf-p2',   -- 与 s-nf-p1 同句型（went to... feeling...）
  's-nf1-p7',  -- 与 s-nf1-p4 重复（want to）
  's-nf1-p12', -- 与 s-nf1-p10 同构（is doing + doing 伴随）
  's-nf1-p13', -- 同上
  's-nf1-p15', -- 独立主格 having risen 偏难（知识点正文已有说明）
  's-nf1-p17'  -- 与 s-nf1-p16 同构（The... closed, she slept）
);

-- 按批注改写 s-nf1-p5：表达爱好优先用 likes doing（动名词短语作宾语）
UPDATE sentences SET en = 'He likes playing basketball.' WHERE id = 's-nf1-p5';

-- 新 slot：playing basketball 动名词短语作宾语（边界干扰：不定式/谓语形式）
INSERT INTO slots (id, role, correct, distractors) VALUES
  ('sl-o-playing-basketball', 'O', 'playing basketball', '["to play basketball","plays basketball","play basketball"]'::jsonb);

-- 重建 p5 槽位（slot_index = LTR 顺序）
DELETE FROM sentence_slot_refs WHERE sentence_id = 's-nf1-p5';
INSERT INTO sentence_slot_refs (sentence_id, slot_index, slot_id) VALUES
  ('s-nf1-p5', 0, 'sl-s-he'),
  ('s-nf1-p5', 1, 'sl-v-likes'),
  ('s-nf1-p5', 2, 'sl-o-playing-basketball');

-- 保留句 sort_order 重排为连续 1..11（anchor 保持 0）
UPDATE sentences SET sort_order = 1  WHERE id = 's-nf-p1';
UPDATE sentences SET sort_order = 2  WHERE id = 's-nf-p3';
UPDATE sentences SET sort_order = 3  WHERE id = 's-nf1-p4';
UPDATE sentences SET sort_order = 4  WHERE id = 's-nf1-p5';
UPDATE sentences SET sort_order = 5  WHERE id = 's-nf1-p6';
UPDATE sentences SET sort_order = 6  WHERE id = 's-nf1-p8';
UPDATE sentences SET sort_order = 7  WHERE id = 's-nf1-p9';
UPDATE sentences SET sort_order = 8  WHERE id = 's-nf1-p10';
UPDATE sentences SET sort_order = 9  WHERE id = 's-nf1-p11';
UPDATE sentences SET sort_order = 10 WHERE id = 's-nf1-p14';
UPDATE sentences SET sort_order = 11 WHERE id = 's-nf1-p16';

COMMIT;
