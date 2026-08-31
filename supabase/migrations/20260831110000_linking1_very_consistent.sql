-- Grammar Everything: linking-1（系动词六类）「很/very」统一——全关不用 very
-- 中文的「很」多为虚化用法（凑音节），不等于英文 very（全库 18 句含「很」的
-- 例句 16 句英文都不配 very，如 spc-1 "She is happy. 她很开心。"；modal-1 的
-- very 对应的是「非常」）。p5 "He seems very tired." 是全库唯一「很→very」特例，
-- 去掉 very 与全库惯例一致；中文「他似乎很累。」保留（与 p1「她看起来很开心」对应）。
-- 复用 sl-c-tired（spc-1 已用：They are tired. 他们很累。）
-- Author: Hermes Agent, 2026-08-31
BEGIN;

UPDATE sentences SET en = 'He seems tired.' WHERE id = 's-lk1-p5';
UPDATE sentence_slot_refs SET slot_id = 'sl-c-tired' WHERE sentence_id = 's-lk1-p5' AND slot_index = 2;

COMMIT;
