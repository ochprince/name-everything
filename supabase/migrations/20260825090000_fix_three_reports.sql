-- Grammar Everything: 修复 3 处用户报错（2026-08-25 导出）
-- 1. sp-pv-s：Pollution 上的知识点与正文重复 → 删除（用户首选）
-- 2. sl-s-there：干扰项 "There's" 吞掉后面 is/are（There's an apple 语法成立）
--    → 换为不与 is/are 组成合法结构的 There 家族干扰项（该 slot 被 subject-4 全部 4 句复用）
-- 3. s-vf-p2："Tom is hungry and eats lunch."（饿了+经常吃午饭，逻辑怪）
--    → "Tom is hungry and wants lunch."（饿了+想吃午饭），slot-4 复用已存在的 sl-v-wants
-- Author: Hermes Agent, 2026-08-25
BEGIN;

-- 1. 删除 pollution 上重复的知识点 span
DELETE FROM sentence_spans WHERE id = 'sp-pv-s';

-- 2. There's → 安全干扰项（Their/It/The 均不与 is/are 构成合法谓语）
UPDATE slots
SET distractors = '["Their","It","The"]'::jsonb
WHERE id = 'sl-s-there';

-- 3. s-vf-p2 逻辑修复 + slot 复用 sl-v-wants，清理孤儿 sl-v-eats-2
UPDATE sentences
SET en = 'Tom is hungry and wants lunch.', zh = '汤姆饿了，想吃午饭。'
WHERE id = 's-vf-p2';

UPDATE sentence_slot_refs
SET slot_id = 'sl-v-wants'
WHERE sentence_id = 's-vf-p2' AND slot_index = 4;

DELETE FROM slots WHERE id = 'sl-v-eats-2';

COMMIT;
