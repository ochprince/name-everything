-- Grammar: passive-1 两处多译形态误伤修复（用户报障 2d3c9d79 / ecfd6a24）
--   ① p1 zh「那个男孩」直译 that boy 合理（中文无冠词，那个↔the/that 固有歧义）
--      → zh 去指示词，消除严格比对误伤源；en 不动
--   ② p2 zh「使用」↔ en spoken 动词不匹配（上次修复遗留）——学习者写 is used 完全合理
--      → en 改 used，PP 槽 spoken→used（sl-pp-p-spoken 仅 p2 引用，旧槽留孤儿无害）
-- Author: Hermes Agent, 2026-09-03
BEGIN;

UPDATE sentences
SET zh = '窗户被男孩打破了。'
WHERE id = 's-pv1-p1';

UPDATE sentences
SET en = 'English is used in many countries.'
WHERE id = 's-pv1-p2';

INSERT INTO slots (id, role, correct, distractors) VALUES
  ('sl-pp-p-used', 'PP', 'used', '["use","uses","using"]'::jsonb);

UPDATE sentence_slot_refs
SET slot_id = 'sl-pp-p-used'
WHERE sentence_id = 's-pv1-p2' AND slot_index = 2;

COMMIT;
