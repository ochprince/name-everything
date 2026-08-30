-- Grammar Everything: 新章节「宾语和表语」4 关
-- obj-1 及物动词必须有宾语（exchange A for B / with sb）
-- obj-2 非谓语作宾语（like/enjoy/finish + doing；learn/want/decide + to do）
-- obj-3 宾语从句（that 可省略；if/whether 引导）
-- pred-1 表语的构成（名词/代词/非谓语/介词短语/形容词）
-- Author: Hermes Agent, 2026-08-30
BEGIN;

-- 1. 新章节（用户明确要求新章节深入宾语和表语，released=true 直接上线）
INSERT INTO chapters (id, title_zh, description_zh, sort_order, released) VALUES
  ('obj-pred', '宾语和表语', '及物动词的宾语、非谓语作宾语、宾语从句、表语的构成。', 5, true);

-- 2. 新语法点
INSERT INTO grammar_points (id, title_zh, body_zh) VALUES
  ('gp-obj-required', '及物动词必须有宾语',
   '及物动词（如 exchange / buy / make）后面必须接宾语，句子才完整。exchange A for B = 用 A 换 B（for 后接换得的事物）；exchange sth with sb = 和某人交换某物（with 后接人）。'),
  ('gp-obj-for-with', 'exchange 的 for / with 搭配',
   'for 后接置换得到的事物：I exchange my phone for your watch.（我用我的手机换你的手表）；with 后接交换的对象（人）：He exchanges ideas with his teammates.（他和队友交流想法）。'),
  ('gp-nonfinite-object', '非谓语作宾语',
   'like / enjoy / finish 等动词后接动名词（doing）作宾语；learn / want / decide 等动词后接不定式（to do）作宾语。'),
  ('gp-gerund-object', '动名词作宾语',
   'like / enjoy / finish / keep 等动词后接动名词作宾语，表示习惯性或经常性的动作。如 I like staying in Chongqing.（我喜欢住在重庆）。'),
  ('gp-object-clause', '宾语从句',
   '一个句子作及物动词的宾语。陈述内容用 that 引导，that 可以省略：I think (that) he is right.（我认为他是对的）；表示"是否"用 if / whether 引导：I am wondering if dinosaurs can be revived.（我在想恐龙能否复活）。从句一律用陈述语序。例句中 dinosaurs 用复数，指代恐龙这一类生物。'),
  ('gp-predicative-forms', '表语的构成',
   '表语位于系动词之后，说明主语的属性、身份或状态。可作表语的成分：名词（She is a teacher.）、代词（This book is mine.）、形容词（The book is interesting.）、非谓语（My hobby is playing chess. / Her dream is to become a doctor.）、介词短语（The cat is under the chair.）。');

-- 3. 新关卡
INSERT INTO levels (id, chapter_id, sort_order, grammar_point_id, pass_threshold, lives, fall_duration_ms) VALUES
  ('obj-1', 'obj-pred', 1, 'gp-obj-required', NULL, NULL, NULL),
  ('obj-2', 'obj-pred', 2, 'gp-nonfinite-object', NULL, NULL, NULL),
  ('obj-3', 'obj-pred', 3, 'gp-object-clause', NULL, NULL, NULL),
  ('pred-1', 'obj-pred', 4, 'gp-predicative-forms', NULL, NULL, NULL);

-- 4. 句子：每关 1 anchor + 5 playable（共 24 句）
INSERT INTO sentences (id, level_id, kind, en, zh, prompt_kind, image_url, sort_order) VALUES
  -- obj-1 及物动词必须有宾语（exchange 搭配）
  ('s-obj1-anchor', 'obj-1', 'anchor', 'I exchange my phone for your watch.', '我用我的手机换你的手表。', 'zh', NULL, 0),
  ('s-obj1-p1', 'obj-1', 'playable', 'She exchanges her old bike for a new one.', '她用旧自行车换了一辆新的。', 'zh', NULL, 1),
  ('s-obj1-p2', 'obj-1', 'playable', 'He exchanges ideas with his teammates.', '他和队友交流想法。', 'zh', NULL, 2),
  ('s-obj1-p3', 'obj-1', 'playable', 'We exchange gifts with each other at Christmas.', '我们圣诞节互换了礼物。', 'zh', NULL, 3),
  ('s-obj1-p4', 'obj-1', 'playable', 'I want to exchange this shirt for a bigger size.', '我想把这件衬衫换成大一号的。', 'zh', NULL, 4),
  ('s-obj1-p5', 'obj-1', 'playable', 'They exchange greetings with the guests.', '他们和客人互致问候。', 'zh', NULL, 5),
  -- obj-2 非谓语作宾语
  ('s-obj2-anchor', 'obj-2', 'anchor', 'I like staying in Chongqing.', '我喜欢住在重庆。', 'zh', NULL, 0),
  ('s-obj2-p1', 'obj-2', 'playable', 'My son has learned to be honest and kind.', '我儿子已经学会了诚实善良。', 'zh', NULL, 1),
  ('s-obj2-p2', 'obj-2', 'playable', 'He enjoys playing basketball after school.', '他喜欢放学后打篮球。', 'zh', NULL, 2),
  ('s-obj2-p3', 'obj-2', 'playable', 'She finished writing her report last night.', '她昨晚写完了报告。', 'zh', NULL, 3),
  ('s-obj2-p4', 'obj-2', 'playable', 'They decided to visit the museum this weekend.', '他们决定这周末去参观博物馆。', 'zh', NULL, 4),
  ('s-obj2-p5', 'obj-2', 'playable', 'I want to travel around the world.', '我想环游世界。', 'zh', NULL, 5),
  -- obj-3 宾语从句
  ('s-obj3-anchor', 'obj-3', 'anchor', 'I am wondering if dinosaurs can be revived.', '我在想恐龙能否复活。', 'zh', NULL, 0),
  ('s-obj3-p1', 'obj-3', 'playable', 'I think he is right.', '我认为他是对的。', 'zh', NULL, 1),
  ('s-obj3-p2', 'obj-3', 'playable', 'She believes the train will arrive on time.', '她相信火车会准点到达。', 'zh', NULL, 2),
  ('s-obj3-p3', 'obj-3', 'playable', 'He asked me if I liked music.', '他问我是否喜欢音乐。', 'zh', NULL, 3),
  ('s-obj3-p4', 'obj-3', 'playable', 'I wonder whether she will come tomorrow.', '我想知道她明天会不会来。', 'zh', NULL, 4),
  ('s-obj3-p5', 'obj-3', 'playable', 'We know that the earth is round.', '我们知道地球是圆的。', 'zh', NULL, 5),
  -- pred-1 表语的构成
  ('s-pred1-anchor', 'pred-1', 'anchor', 'The book is interesting.', '这本书很有趣。', 'zh', NULL, 0),
  ('s-pred1-p1', 'pred-1', 'playable', 'She is a teacher.', '她是一名老师。', 'zh', NULL, 1),
  ('s-pred1-p2', 'pred-1', 'playable', 'This book is mine.', '这本书是我的。', 'zh', NULL, 2),
  ('s-pred1-p3', 'pred-1', 'playable', 'My hobby is playing chess.', '我的爱好是下棋。', 'zh', NULL, 3),
  ('s-pred1-p4', 'pred-1', 'playable', 'Her dream is to become a doctor.', '她的梦想是成为一名医生。', 'zh', NULL, 4),
  ('s-pred1-p5', 'pred-1', 'playable', 'The cat is under the chair.', '猫在椅子下面。', 'zh', NULL, 5);

-- 5. anchor spans（识别练习；playable 不挂 spans）
INSERT INTO sentence_spans (id, sentence_id, grammar_point_id, start, "end") VALUES
  -- obj-1: I / exchange / my phone / for your watch
  ('sp-obj1-s', 's-obj1-anchor', 'gp-s', 0, 1),
  ('sp-obj1-v', 's-obj1-anchor', 'gp-v', 2, 10),
  ('sp-obj1-o', 's-obj1-anchor', 'gp-o', 11, 19),
  ('sp-obj1-for', 's-obj1-anchor', 'gp-obj-for-with', 20, 34),
  -- obj-2: I / like / staying / in Chongqing
  ('sp-obj2-s', 's-obj2-anchor', 'gp-s', 0, 1),
  ('sp-obj2-v', 's-obj2-anchor', 'gp-v', 2, 6),
  ('sp-obj2-ger', 's-obj2-anchor', 'gp-gerund-object', 7, 14),
  -- obj-3: I / am wondering / if dinosaurs can be revived
  ('sp-obj3-s', 's-obj3-anchor', 'gp-s', 0, 1),
  ('sp-obj3-v', 's-obj3-anchor', 'gp-v', 2, 14),
  ('sp-obj3-clause', 's-obj3-anchor', 'gp-object-clause', 15, 42),
  -- pred-1: The book / is / interesting
  ('sp-pred1-s', 's-pred1-anchor', 'gp-s', 0, 8),
  ('sp-pred1-link', 's-pred1-anchor', 'gp-link', 9, 11),
  ('sp-pred1-c', 's-pred1-anchor', 'gp-c', 12, 23);

-- 6. 新 slot 定义（复用优先：sl-s-i/he/she/we/they、sl-v-is/am/want/enjoys/think、sl-o-me/basketball/the-museum、sl-inf-to-visit、sl-s-the-book/my-hobby 已存在直接复用）
INSERT INTO slots (id, role, correct, distractors) VALUES
  -- obj-1
  ('sl-v-exchange', 'V', 'exchange', '["exchanges","exchanging","exchanged"]'::jsonb),
  ('sl-v-exchanges', 'V', 'exchanges', '["exchange","exchanging","exchanged"]'::jsonb),
  ('sl-o-my-phone', 'O', 'my phone', '["my phones","mine phone","me phone"]'::jsonb),
  ('sl-o-her-old-bike', 'O', 'her old bike', '["her old bikes","hers old bike","she old bike"]'::jsonb),
  ('sl-o-ideas', 'O', 'ideas', '["idea","the idea","ideals"]'::jsonb),
  ('sl-o-gifts', 'O', 'gifts', '["gift","a gift","the gifts"]'::jsonb),
  ('sl-o-this-shirt', 'O', 'this shirt', '["this shirts","these shirt","these shirts"]'::jsonb),
  ('sl-o-greetings', 'O', 'greetings', '["greeting","a greeting","the greeting"]'::jsonb),
  ('sl-inf-to-exchange', 'INF', 'to exchange', '["to exchanging","exchanging","exchange"]'::jsonb),
  ('sl-a-for-your-watch', 'A', 'for your watch', '["for you watch","to your watch","for your watches"]'::jsonb),
  ('sl-a-for-a-new-one', 'A', 'for a new one', '["for new one","to a new one","for a new ones"]'::jsonb),
  ('sl-a-with-his-teammates', 'A', 'with his teammates', '["with his teammate","to his teammates","with him teammates"]'::jsonb),
  ('sl-a-with-each-other', 'A', 'with each other', '["with each others","to each other","with other"]'::jsonb),
  ('sl-a-at-christmas', 'A', 'at Christmas', '["in Christmas","on Christmas","at Christmases"]'::jsonb),
  ('sl-a-for-a-bigger-size', 'A', 'for a bigger size', '["for a bigger sizes","to a bigger size","for bigger size"]'::jsonb),
  ('sl-a-with-the-guests', 'A', 'with the guests', '["with the guest","to the guests","with guests"]'::jsonb),
  -- obj-2
  ('sl-v-like', 'V', 'like', '["likes","liking","liked"]'::jsonb),
  ('sl-v-has-learned', 'V', 'has learned', '["have learned","has learn","has learning"]'::jsonb),
  ('sl-v-finished', 'V', 'finished', '["finish","finishes","finishing"]'::jsonb),
  ('sl-v-decided', 'V', 'decided', '["decide","decides","deciding"]'::jsonb),
  ('sl-o-her-report', 'O', 'her report', '["her reports","hers report","she report"]'::jsonb),
  ('sl-s-my-son', 'S', 'My son', '["My sons","Mine son","Mine sons"]'::jsonb),
  ('sl-ger-staying', 'GER', 'staying', '["stay","stays","stayed"]'::jsonb),
  ('sl-ger-playing', 'GER', 'playing', '["play","plays","to play"]'::jsonb),
  ('sl-ger-writing', 'GER', 'writing', '["write","writes","to write"]'::jsonb),
  ('sl-inf-to-be-honest-and-kind', 'INF', 'to be honest and kind', '["to being honest and kind","being honest and kind","to be honest and kindly"]'::jsonb),
  ('sl-inf-to-travel', 'INF', 'to travel', '["traveling","to traveling","travel"]'::jsonb),
  ('sl-a-in-chongqing', 'A', 'in Chongqing', '["on Chongqing","at Chongqing","to Chongqing"]'::jsonb),
  ('sl-a-after-school', 'A', 'after school', '["after the school","after schools","after a school"]'::jsonb),
  ('sl-a-last-night', 'A', 'last night', '["last nights","the last night","yesterday night"]'::jsonb),
  ('sl-a-this-weekend', 'A', 'this weekend', '["this weekends","in this weekend","at this weekend"]'::jsonb),
  ('sl-a-around-the-world', 'A', 'around the world', '["around world","around the worlds","across the worlds"]'::jsonb),
  -- obj-3
  ('sl-v-wondering', 'V', 'wondering', '["wonder","wonders","wondered"]'::jsonb),
  ('sl-v-believes', 'V', 'believes', '["believe","believing","believed"]'::jsonb),
  ('sl-v-asked', 'V', 'asked', '["ask","asks","asking"]'::jsonb),
  ('sl-v-wonder', 'V', 'wonder', '["wonders","wondering","wondered"]'::jsonb),
  ('sl-v-know', 'V', 'know', '["knows","knowing","knew"]'::jsonb),
  ('sl-o-if-dinosaurs-can-be-revived', 'O', 'if dinosaurs can be revived', '["if dinosaur can be revived","that dinosaurs can be revived","if dinosaurs can revive"]'::jsonb),
  ('sl-o-he-is-right', 'O', 'he is right', '["him is right","he are right","he is rights"]'::jsonb),
  ('sl-o-the-train-will-arrive-on-time', 'O', 'the train will arrive on time', '["the train will arrives on time","will the train arrive on time","the train will arrive at time"]'::jsonb),
  ('sl-o-if-i-liked-music', 'O', 'if I liked music', '["if I like music","that I liked music","if me liked music"]'::jsonb),
  ('sl-o-whether-she-will-come-tomorrow', 'O', 'whether she will come tomorrow', '["that she will come tomorrow","whether she will comes tomorrow","whether she came tomorrow"]'::jsonb),
  ('sl-o-that-the-earth-is-round', 'O', 'that the earth is round', '["that the earth are round","that the earth is rounds","that earth is round"]'::jsonb),
  -- pred-1
  ('sl-s-this-book', 'S', 'This book', '["This books","These book","These books"]'::jsonb),
  ('sl-s-her-dream', 'S', 'Her dream', '["Her dreams","Hers dream","Her dreaming"]'::jsonb),
  ('sl-s-the-cat', 'S', 'The cat', '["The cats","Cat","The a cat"]'::jsonb),
  ('sl-c-interesting', 'C', 'interesting', '["interested","interest","interests"]'::jsonb),
  ('sl-c-a-teacher', 'C', 'a teacher', '["a teachers","teacher","an teacher"]'::jsonb),
  ('sl-c-mine', 'C', 'mine', '["my","myself","mines"]'::jsonb),
  ('sl-c-playing-chess', 'C', 'playing chess', '["play chess","plays chess","played chess"]'::jsonb),
  ('sl-c-to-become-a-doctor', 'C', 'to become a doctor', '["become a doctor","to becoming a doctor","to become doctor"]'::jsonb),
  ('sl-c-under-the-chair', 'C', 'under the chair', '["under chair","under the chairs","under the a chair"]'::jsonb);

-- 7. sentence_slot_refs（slot_index = 原句 LTR 顺序，0 起连续；复用已有 sl-*）
INSERT INTO sentence_slot_refs (sentence_id, slot_index, slot_id) VALUES
  -- obj-1 anchor: I exchange my phone for your watch.
  ('s-obj1-anchor', 0, 'sl-s-i'),
  ('s-obj1-anchor', 1, 'sl-v-exchange'),
  ('s-obj1-anchor', 2, 'sl-o-my-phone'),
  ('s-obj1-anchor', 3, 'sl-a-for-your-watch'),
  -- obj-1 p1: She exchanges her old bike for a new one.
  ('s-obj1-p1', 0, 'sl-s-she'),
  ('s-obj1-p1', 1, 'sl-v-exchanges'),
  ('s-obj1-p1', 2, 'sl-o-her-old-bike'),
  ('s-obj1-p1', 3, 'sl-a-for-a-new-one'),
  -- obj-1 p2: He exchanges ideas with his teammates.
  ('s-obj1-p2', 0, 'sl-s-he'),
  ('s-obj1-p2', 1, 'sl-v-exchanges'),
  ('s-obj1-p2', 2, 'sl-o-ideas'),
  ('s-obj1-p2', 3, 'sl-a-with-his-teammates'),
  -- obj-1 p3: We exchange gifts with each other at Christmas.
  ('s-obj1-p3', 0, 'sl-s-we'),
  ('s-obj1-p3', 1, 'sl-v-exchange'),
  ('s-obj1-p3', 2, 'sl-o-gifts'),
  ('s-obj1-p3', 3, 'sl-a-with-each-other'),
  ('s-obj1-p3', 4, 'sl-a-at-christmas'),
  -- obj-1 p4: I want to exchange this shirt for a bigger size.
  ('s-obj1-p4', 0, 'sl-s-i'),
  ('s-obj1-p4', 1, 'sl-v-want'),
  ('s-obj1-p4', 2, 'sl-inf-to-exchange'),
  ('s-obj1-p4', 3, 'sl-o-this-shirt'),
  ('s-obj1-p4', 4, 'sl-a-for-a-bigger-size'),
  -- obj-1 p5: They exchange greetings with the guests.
  ('s-obj1-p5', 0, 'sl-s-they'),
  ('s-obj1-p5', 1, 'sl-v-exchange'),
  ('s-obj1-p5', 2, 'sl-o-greetings'),
  ('s-obj1-p5', 3, 'sl-a-with-the-guests'),
  -- obj-2 anchor: I like staying in Chongqing.
  ('s-obj2-anchor', 0, 'sl-s-i'),
  ('s-obj2-anchor', 1, 'sl-v-like'),
  ('s-obj2-anchor', 2, 'sl-ger-staying'),
  ('s-obj2-anchor', 3, 'sl-a-in-chongqing'),
  -- obj-2 p1: My son has learned to be honest and kind.
  ('s-obj2-p1', 0, 'sl-s-my-son'),
  ('s-obj2-p1', 1, 'sl-v-has-learned'),
  ('s-obj2-p1', 2, 'sl-inf-to-be-honest-and-kind'),
  -- obj-2 p2: He enjoys playing basketball after school.
  ('s-obj2-p2', 0, 'sl-s-he'),
  ('s-obj2-p2', 1, 'sl-v-enjoys'),
  ('s-obj2-p2', 2, 'sl-ger-playing'),
  ('s-obj2-p2', 3, 'sl-o-basketball'),
  ('s-obj2-p2', 4, 'sl-a-after-school'),
  -- obj-2 p3: She finished writing her report last night.
  ('s-obj2-p3', 0, 'sl-s-she'),
  ('s-obj2-p3', 1, 'sl-v-finished'),
  ('s-obj2-p3', 2, 'sl-ger-writing'),
  ('s-obj2-p3', 3, 'sl-o-her-report'),
  ('s-obj2-p3', 4, 'sl-a-last-night'),
  -- obj-2 p4: They decided to visit the museum this weekend.
  ('s-obj2-p4', 0, 'sl-s-they'),
  ('s-obj2-p4', 1, 'sl-v-decided'),
  ('s-obj2-p4', 2, 'sl-inf-to-visit'),
  ('s-obj2-p4', 3, 'sl-o-the-museum'),
  ('s-obj2-p4', 4, 'sl-a-this-weekend'),
  -- obj-2 p5: I want to travel around the world.
  ('s-obj2-p5', 0, 'sl-s-i'),
  ('s-obj2-p5', 1, 'sl-v-want'),
  ('s-obj2-p5', 2, 'sl-inf-to-travel'),
  ('s-obj2-p5', 3, 'sl-a-around-the-world'),
  -- obj-3 anchor: I am wondering if dinosaurs can be revived.
  ('s-obj3-anchor', 0, 'sl-s-i'),
  ('s-obj3-anchor', 1, 'sl-v-am'),
  ('s-obj3-anchor', 2, 'sl-v-wondering'),
  ('s-obj3-anchor', 3, 'sl-o-if-dinosaurs-can-be-revived'),
  -- obj-3 p1: I think he is right.
  ('s-obj3-p1', 0, 'sl-s-i'),
  ('s-obj3-p1', 1, 'sl-v-think'),
  ('s-obj3-p1', 2, 'sl-o-he-is-right'),
  -- obj-3 p2: She believes the train will arrive on time.
  ('s-obj3-p2', 0, 'sl-s-she'),
  ('s-obj3-p2', 1, 'sl-v-believes'),
  ('s-obj3-p2', 2, 'sl-o-the-train-will-arrive-on-time'),
  -- obj-3 p3: He asked me if I liked music.
  ('s-obj3-p3', 0, 'sl-s-he'),
  ('s-obj3-p3', 1, 'sl-v-asked'),
  ('s-obj3-p3', 2, 'sl-o-me'),
  ('s-obj3-p3', 3, 'sl-o-if-i-liked-music'),
  -- obj-3 p4: I wonder whether she will come tomorrow.
  ('s-obj3-p4', 0, 'sl-s-i'),
  ('s-obj3-p4', 1, 'sl-v-wonder'),
  ('s-obj3-p4', 2, 'sl-o-whether-she-will-come-tomorrow'),
  -- obj-3 p5: We know that the earth is round.
  ('s-obj3-p5', 0, 'sl-s-we'),
  ('s-obj3-p5', 1, 'sl-v-know'),
  ('s-obj3-p5', 2, 'sl-o-that-the-earth-is-round'),
  -- pred-1 anchor: The book is interesting.
  ('s-pred1-anchor', 0, 'sl-s-the-book'),
  ('s-pred1-anchor', 1, 'sl-v-is'),
  ('s-pred1-anchor', 2, 'sl-c-interesting'),
  -- pred-1 p1: She is a teacher.
  ('s-pred1-p1', 0, 'sl-s-she'),
  ('s-pred1-p1', 1, 'sl-v-is'),
  ('s-pred1-p1', 2, 'sl-c-a-teacher'),
  -- pred-1 p2: This book is mine.
  ('s-pred1-p2', 0, 'sl-s-this-book'),
  ('s-pred1-p2', 1, 'sl-v-is'),
  ('s-pred1-p2', 2, 'sl-c-mine'),
  -- pred-1 p3: My hobby is playing chess.
  ('s-pred1-p3', 0, 'sl-s-my-hobby'),
  ('s-pred1-p3', 1, 'sl-v-is'),
  ('s-pred1-p3', 2, 'sl-c-playing-chess'),
  -- pred-1 p4: Her dream is to become a doctor.
  ('s-pred1-p4', 0, 'sl-s-her-dream'),
  ('s-pred1-p4', 1, 'sl-v-is'),
  ('s-pred1-p4', 2, 'sl-c-to-become-a-doctor'),
  -- pred-1 p5: The cat is under the chair.
  ('s-pred1-p5', 0, 'sl-s-the-cat'),
  ('s-pred1-p5', 1, 'sl-v-is'),
  ('s-pred1-p5', 2, 'sl-c-under-the-chair');

COMMIT;
