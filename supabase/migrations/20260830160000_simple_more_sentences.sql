-- Grammar Everything: simple 章 5 关各补充 3 个 playable 例句（4 → 7 句/关）
-- 仅追加句子+slots+refs，不动 anchor/spans/知识点；过关门槛随 playable 数自动更新
-- Author: Hermes Agent, 2026-08-30
BEGIN;

INSERT INTO sentences (id, level_id, kind, en, zh, prompt_kind, image_url, sort_order) VALUES
  -- sv-1 主谓（不及物动词）
  ('s-sv-p4', 'sv-1', 'playable', 'We sing.', '我们唱歌。', 'zh', NULL, 4),
  ('s-sv-p5', 'sv-1', 'playable', 'The birds fly.', '鸟儿飞。', 'zh', NULL, 5),
  ('s-sv-p6', 'sv-1', 'playable', 'He smiles.', '他微笑。', 'zh', NULL, 6),
  -- svo-1 主谓宾（及物动词）
  ('s-svo-p4', 'svo-1', 'playable', 'We eat rice.', '我们吃米饭。', 'zh', NULL, 4),
  ('s-svo-p5', 'svo-1', 'playable', 'She opens the door.', '她打开门。', 'zh', NULL, 5),
  ('s-svo-p6', 'svo-1', 'playable', 'He plays the piano.', '他弹钢琴。', 'zh', NULL, 6),
  -- spc-1 主系表
  ('s-spc-p4', 'spc-1', 'playable', 'She is tall.', '她很高。', 'zh', NULL, 4),
  ('s-spc-p5', 'spc-1', 'playable', 'We are students.', '我们是学生。', 'zh', NULL, 5),
  ('s-spc-p6', 'spc-1', 'playable', 'The sky is blue.', '天空是蓝色的。', 'zh', NULL, 6),
  -- dative-1 主谓双宾
  ('s-d1-p4', 'dative-1', 'playable', 'He gave me a gift.', '他给了我一件礼物。', 'zh', NULL, 4),
  ('s-d1-p5', 'dative-1', 'playable', 'She sent us a letter.', '她给我们寄了一封信。', 'zh', NULL, 5),
  ('s-d1-p6', 'dative-1', 'playable', 'They showed me a photo.', '他们给我看了一张照片。', 'zh', NULL, 6),
  -- svoc-1 主谓宾补
  ('s-svoc-p4', 'svoc-1', 'playable', 'We made him happy.', '我们让他开心。', 'zh', NULL, 4),
  ('s-svoc-p5', 'svoc-1', 'playable', 'They made her sad.', '他们让她难过。', 'zh', NULL, 5),
  ('s-svoc-p6', 'svoc-1', 'playable', 'The news made him angry.', '这个消息让他生气。', 'zh', NULL, 6);

INSERT INTO slots (id, role, correct, distractors) VALUES
  ('sl-v-sing', 'V', 'sing', '["sings","singing","sang"]'::jsonb),
  ('sl-s-the-birds', 'S', 'The birds', '["The bird","A birds","The bird is"]'::jsonb),
  ('sl-v-fly', 'V', 'fly', '["flies","flying","flew"]'::jsonb),
  ('sl-v-smiles', 'V', 'smiles', '["smile","smiling","smiled"]'::jsonb),
  ('sl-v-eat', 'V', 'eat', '["eats","eating","ate"]'::jsonb),
  ('sl-o-rice', 'O', 'rice', '["rices","a rice","the rice"]'::jsonb),
  ('sl-v-opens', 'V', 'opens', '["open","opening","opened"]'::jsonb),
  ('sl-c-tall', 'C', 'tall', '["tallness","talls","tallly"]'::jsonb),
  ('sl-c-students', 'C', 'students', '["student","a students","the student"]'::jsonb),
  ('sl-s-the-sky', 'S', 'The sky', '["The skies","Sky","A sky"]'::jsonb),
  ('sl-c-blue', 'C', 'blue', '["blues","blueful","a blue"]'::jsonb),
  ('sl-do-a-gift', 'DO', 'a gift', '["gift","an gift","a gifts"]'::jsonb),
  ('sl-do-a-letter', 'DO', 'a letter', '["letter","an letter","a letters"]'::jsonb),
  ('sl-s-the-news', 'S', 'The news', '["The newses","News","A news"]'::jsonb);

INSERT INTO sentence_slot_refs (sentence_id, slot_index, slot_id) VALUES
  -- sv-1: We sing. / The birds fly. / He smiles.
  ('s-sv-p4', 0, 'sl-s-we'),
  ('s-sv-p4', 1, 'sl-v-sing'),
  ('s-sv-p5', 0, 'sl-s-the-birds'),
  ('s-sv-p5', 1, 'sl-v-fly'),
  ('s-sv-p6', 0, 'sl-s-he'),
  ('s-sv-p6', 1, 'sl-v-smiles'),
  -- svo-1: We eat rice. / She opens the door. / He plays the piano.
  ('s-svo-p4', 0, 'sl-s-we'),
  ('s-svo-p4', 1, 'sl-v-eat'),
  ('s-svo-p4', 2, 'sl-o-rice'),
  ('s-svo-p5', 0, 'sl-s-she'),
  ('s-svo-p5', 1, 'sl-v-opens'),
  ('s-svo-p5', 2, 'sl-o-the-door'),
  ('s-svo-p6', 0, 'sl-s-he'),
  ('s-svo-p6', 1, 'sl-v-plays'),
  ('s-svo-p6', 2, 'sl-o-the-piano'),
  -- spc-1: She is tall. / We are students. / The sky is blue.
  ('s-spc-p4', 0, 'sl-s-she'),
  ('s-spc-p4', 1, 'sl-v-is'),
  ('s-spc-p4', 2, 'sl-c-tall'),
  ('s-spc-p5', 0, 'sl-s-we'),
  ('s-spc-p5', 1, 'sl-v-are'),
  ('s-spc-p5', 2, 'sl-c-students'),
  ('s-spc-p6', 0, 'sl-s-the-sky'),
  ('s-spc-p6', 1, 'sl-v-is'),
  ('s-spc-p6', 2, 'sl-c-blue'),
  -- dative-1: He gave me a gift. / She sent us a letter. / They showed me a photo.
  ('s-d1-p4', 0, 'sl-s-he'),
  ('s-d1-p4', 1, 'sl-v-gave'),
  ('s-d1-p4', 2, 'sl-io-me'),
  ('s-d1-p4', 3, 'sl-do-a-gift'),
  ('s-d1-p5', 0, 'sl-s-she'),
  ('s-d1-p5', 1, 'sl-v-sent'),
  ('s-d1-p5', 2, 'sl-io-us'),
  ('s-d1-p5', 3, 'sl-do-a-letter'),
  ('s-d1-p6', 0, 'sl-s-they'),
  ('s-d1-p6', 1, 'sl-v-showed'),
  ('s-d1-p6', 2, 'sl-io-me'),
  ('s-d1-p6', 3, 'sl-do-a-photo'),
  -- svoc-1: We made him happy. / They made her sad. / The news made him angry.
  ('s-svoc-p4', 0, 'sl-s-we'),
  ('s-svoc-p4', 1, 'sl-v-made'),
  ('s-svoc-p4', 2, 'sl-o-him'),
  ('s-svoc-p4', 3, 'sl-oc-happy'),
  ('s-svoc-p5', 0, 'sl-s-they'),
  ('s-svoc-p5', 1, 'sl-v-made'),
  ('s-svoc-p5', 2, 'sl-o-her'),
  ('s-svoc-p5', 3, 'sl-oc-sad'),
  ('s-svoc-p6', 0, 'sl-s-the-news'),
  ('s-svoc-p6', 1, 'sl-v-made'),
  ('s-svoc-p6', 2, 'sl-o-him'),
  ('s-svoc-p6', 3, 'sl-oc-angry');

COMMIT;
