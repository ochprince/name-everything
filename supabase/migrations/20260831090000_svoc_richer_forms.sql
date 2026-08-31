-- Grammar Everything: svoc-1（主谓宾补）例句丰富化——谓语与宾补形态多样化
-- 替换 p2/p3/p4/p5：谓语 made → found / painted / keep / call；宾补情绪形容词 → 状态/颜色/名词
-- 保留 anchor + p1 + p6（make + 情绪形容词 经典句型仍有 3 句代表）
-- 复用 sl-s-we / sl-s-he-2 / sl-s-they / sl-o-the-door / sl-o-the-room / sl-o-her
-- Author: Hermes Agent, 2026-08-31
BEGIN;

-- 1. 替换 playable 例句（en/zh）
UPDATE sentences SET en = 'We found the door open.', zh = '我们发现门开着。' WHERE id = 's-svoc-p2';
UPDATE sentences SET en = 'He painted the wall white.', zh = '他把墙刷成了白色。' WHERE id = 's-svoc-p3';
UPDATE sentences SET en = 'We keep the room clean.', zh = '我们保持房间干净。' WHERE id = 's-svoc-p4';
UPDATE sentences SET en = 'They call her Lily.', zh = '他们叫她莉莉。' WHERE id = 's-svoc-p5';

-- 2. 新槽位（9 个，id 已查 live DB 无冲突）
INSERT INTO slots (id, role, correct, distractors) VALUES
  ('sl-v-found', 'V', 'found', '["finds","finding","find"]'::jsonb),
  ('sl-oc-open', 'OC', 'open', '["opened","opening","opens"]'::jsonb),
  ('sl-v-painted', 'V', 'painted', '["paints","painting","paint"]'::jsonb),
  ('sl-o-the-wall', 'O', 'the wall', '["the walls","a wall","walls"]'::jsonb),
  ('sl-oc-white', 'OC', 'white', '["whites","whitish","a white"]'::jsonb),
  ('sl-v-keep', 'V', 'keep', '["keeps","keeping","kept"]'::jsonb),
  ('sl-oc-clean', 'OC', 'clean', '["cleans","cleaned","cleaning"]'::jsonb),
  ('sl-v-call', 'V', 'call', '["calls","calling","called"]'::jsonb),
  ('sl-oc-lily', 'OC', 'Lily', '["Lilys","a Lily","the Lily"]'::jsonb);

-- 3. 重挂 sentence_slot_refs（slot_index = 原句 LTR 顺序）
-- p2: We found the door open.
UPDATE sentence_slot_refs SET slot_id = 'sl-v-found' WHERE sentence_id = 's-svoc-p2' AND slot_index = 1;
UPDATE sentence_slot_refs SET slot_id = 'sl-o-the-door' WHERE sentence_id = 's-svoc-p2' AND slot_index = 2;
UPDATE sentence_slot_refs SET slot_id = 'sl-oc-open' WHERE sentence_id = 's-svoc-p2' AND slot_index = 3;
-- p3: He painted the wall white.
UPDATE sentence_slot_refs SET slot_id = 'sl-v-painted' WHERE sentence_id = 's-svoc-p3' AND slot_index = 1;
UPDATE sentence_slot_refs SET slot_id = 'sl-o-the-wall' WHERE sentence_id = 's-svoc-p3' AND slot_index = 2;
UPDATE sentence_slot_refs SET slot_id = 'sl-oc-white' WHERE sentence_id = 's-svoc-p3' AND slot_index = 3;
-- p4: We keep the room clean.
UPDATE sentence_slot_refs SET slot_id = 'sl-v-keep' WHERE sentence_id = 's-svoc-p4' AND slot_index = 1;
UPDATE sentence_slot_refs SET slot_id = 'sl-o-the-room' WHERE sentence_id = 's-svoc-p4' AND slot_index = 2;
UPDATE sentence_slot_refs SET slot_id = 'sl-oc-clean' WHERE sentence_id = 's-svoc-p4' AND slot_index = 3;
-- p5: They call her Lily.
UPDATE sentence_slot_refs SET slot_id = 'sl-v-call' WHERE sentence_id = 's-svoc-p5' AND slot_index = 1;
UPDATE sentence_slot_refs SET slot_id = 'sl-o-her' WHERE sentence_id = 's-svoc-p5' AND slot_index = 2;
UPDATE sentence_slot_refs SET slot_id = 'sl-oc-lily' WHERE sentence_id = 's-svoc-p5' AND slot_index = 3;

COMMIT;
