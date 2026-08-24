-- Grammar Everything: 主语章节 3 个新知识点，各自独立成 level
--   subject-2  代词 it 做主语（天气/温度/时间/距离）
--   subject-3  主语从句（that 引导 + it 形式主语改写）
--   subject-4  There be 句型（真正主语在 be 后 + 扩展）
-- Author: Hermes Agent, 2026-08-24
BEGIN;

-- ============ 1. 语法点 ×3 ============
INSERT INTO grammar_points (id, title_zh, body_zh) VALUES
  ('gp-subject-it', 'it 做主语（天气/时间/距离）',
   'it 做主语时不指具体的人或物，专门谈论天气、温度、时间、距离：It keeps snowing.（雪一直在下）；It is eight o''clock.（现在八点了）。'),
  ('gp-subject-clause', '主语从句（that 引导）',
   '一个完整的独立句子不能直接充当另一个句子的成分，要变成从句并由引导词引导，不能裸放。that 引导陈述语气的主语从句时只起引导作用、不充当从句成分、不可省略：That she will come to my school makes me happy.（That she will come to my school 整体做主句主语）。这类 that 主语从句可改写为 it 作形式主语、从句后置：It makes me happy that she will come to my school.——it 只是语法占位，that 从句才是真正的逻辑主语。'),
  ('gp-there-be', 'There be 句型',
   'There 作引导词，真正的主语是 There be 后面的名词：There is an apple in her bag.（真正主语是 an apple）；There are four seasons in a year.。There be 后不能直接跟第二个谓语动词：加从句用关系代词 that/which 作从句主语修饰真正主语——There are grounds that can explain my perspective.；加非谓语用不定式作后置定语——There are grounds to explain my perspective.；错误写法 There are grounds can explain my perspective.（两套谓语无连接）');

-- ============ 2. 关卡 ×3 ============
INSERT INTO levels (id, chapter_id, sort_order, grammar_point_id, pass_threshold, lives, fall_duration_ms) VALUES
  ('subject-2', 'subject', 2, 'gp-subject-it', NULL, NULL, NULL),
  ('subject-3', 'subject', 3, 'gp-subject-clause', NULL, NULL, NULL),
  ('subject-4', 'subject', 4, 'gp-there-be', NULL, NULL, NULL);

-- ============ 3. 句子 ×12（3 anchor + 9 playable）============
INSERT INTO sentences (id, level_id, kind, en, zh, prompt_kind, image_url, sort_order) VALUES
  -- subject-2: it 做主语
  ('s-subj2-anchor', 'subject-2', 'anchor', 'It keeps snowing.', '雪一直在下。', 'zh', NULL, 0),
  ('s-subj2-p1', 'subject-2', 'playable', 'It is so hot.', '天气真热。', 'zh', NULL, 1),
  ('s-subj2-p2', 'subject-2', 'playable', 'It is eight o''clock.', '现在八点了。', 'zh', NULL, 2),
  ('s-subj2-p3', 'subject-2', 'playable', 'It is a long way home.', '回家的路很长。', 'zh', NULL, 3),
  -- subject-3: 主语从句
  ('s-subj3-anchor', 'subject-3', 'anchor', 'That she will come to my school makes me happy.', '她会来我的学校让我很开心。', 'zh', NULL, 0),
  ('s-subj3-p1', 'subject-3', 'playable', 'That he is honest is important.', '他诚实很重要。', 'zh', NULL, 1),
  ('s-subj3-p2', 'subject-3', 'playable', 'It makes me happy that she will come to my school.', '她会来我的学校让我很开心。', 'zh', NULL, 2),
  ('s-subj3-p3', 'subject-3', 'playable', 'That he lied made us angry.', '他撒谎让我们很生气。', 'zh', NULL, 3),
  -- subject-4: There be
  ('s-subj4-anchor', 'subject-4', 'anchor', 'There is an apple in her bag.', '她的包里有一个苹果。', 'zh', NULL, 0),
  ('s-subj4-p1', 'subject-4', 'playable', 'There are four seasons in a year.', '一年有四个季节。', 'zh', NULL, 1),
  ('s-subj4-p2', 'subject-4', 'playable', 'There are grounds that can explain my perspective.', '有一些理由可以解释我的观点。', 'zh', NULL, 2),
  ('s-subj4-p3', 'subject-4', 'playable', 'There are grounds to explain my perspective.', '有一些理由可以解释我的观点。', 'zh', NULL, 3);

-- ============ 4. anchor spans ×6（识别练习，挂共享点）============
INSERT INTO sentence_spans (id, sentence_id, grammar_point_id, start, "end") VALUES
  ('sp-subj2-s', 's-subj2-anchor', 'gp-s', 0, 2),
  ('sp-subj2-v', 's-subj2-anchor', 'gp-v', 3, 16),
  ('sp-subj3-s', 's-subj3-anchor', 'gp-s', 0, 31),
  ('sp-subj3-v', 's-subj3-anchor', 'gp-v', 32, 46),
  ('sp-subj4-s', 's-subj4-anchor', 'gp-s', 9, 17),
  ('sp-subj4-be', 's-subj4-anchor', 'gp-be-forms', 6, 8);

-- ============ 5. 新 slot ×15（复用 sl-v-is-2 / sl-v-are / sl-v-made / sl-o-us / sl-o-me / sl-oc-happy / sl-oc-angry）============
INSERT INTO slots (id, role, correct, distractors) VALUES
  -- subject-2
  ('sl-s-it', 'S', 'It', '["Its","It''s","They"]'::jsonb),
  ('sl-v-keeps-snowing', 'V', 'keeps snowing', '["keep snowing","keeps snow","keeps snowed"]'::jsonb),
  ('sl-c-so-hot', 'C', 'so hot', '["so hotter","such hot","so hotness"]'::jsonb),
  ('sl-c-eight-oclock', 'C', 'eight o''clock', '["eight clock","eight o''clocks","the eight o''clock"]'::jsonb),
  ('sl-c-a-long-way-home', 'C', 'a long way home', '["long way home","a long ways home","a long way to home"]'::jsonb),
  -- subject-3
  ('sl-s-that-she-will-come-to-my-school', 'S', 'That she will come to my school', '["She will come to my school","That she will comes to my school","What she will come to my school"]'::jsonb),
  ('sl-v-makes', 'V', 'makes', '["make","making","made"]'::jsonb),
  ('sl-s-that-he-is-honest', 'S', 'That he is honest', '["He is honest","That he honest","If he is honest"]'::jsonb),
  ('sl-c-important', 'C', 'important', '["importance","importantly","importants"]'::jsonb),
  ('sl-s-that-he-lied', 'S', 'That he lied', '["He lied","That he lies","If he lied"]'::jsonb),
  -- subject-4
  ('sl-s-there', 'S', 'There', '["Their","It","There''s"]'::jsonb),
  ('sl-s-an-apple', 'S', 'an apple', '["a apple","an apples","apples"]'::jsonb),
  ('sl-a-in-her-bag', 'A', 'in her bag', '["in she bag","into her bag","in her the bag"]'::jsonb),
  ('sl-s-four-seasons', 'S', 'four seasons', '["four season","a four seasons","four season''s"]'::jsonb),
  ('sl-a-in-a-year', 'A', 'in a year', '["in a years","on a year","at a year"]'::jsonb),
  ('sl-s-grounds', 'S', 'grounds', '["ground","a grounds","grounds''"]'::jsonb),
  ('sl-mod-that-can-explain', 'MOD', 'that can explain', '["can explain","that can explains","that can explaining"]'::jsonb),
  ('sl-o-my-perspective', 'O', 'my perspective', '["mine perspective","my a perspective","my perspective''s"]'::jsonb),
  ('sl-inf-to-explain', 'INF', 'to explain', '["explain","to explaining","for explain"]'::jsonb);

-- ============ 6. sentence_slot_refs（slot_index = LTR）============
INSERT INTO sentence_slot_refs (sentence_id, slot_index, slot_id) VALUES
  -- subject-2: It keeps snowing. / It is so hot. / It is eight o'clock. / It is a long way home.
  ('s-subj2-anchor', 0, 'sl-s-it'),
  ('s-subj2-anchor', 1, 'sl-v-keeps-snowing'),
  ('s-subj2-p1', 0, 'sl-s-it'),
  ('s-subj2-p1', 1, 'sl-v-is-2'),
  ('s-subj2-p1', 2, 'sl-c-so-hot'),
  ('s-subj2-p2', 0, 'sl-s-it'),
  ('s-subj2-p2', 1, 'sl-v-is-2'),
  ('s-subj2-p2', 2, 'sl-c-eight-oclock'),
  ('s-subj2-p3', 0, 'sl-s-it'),
  ('s-subj2-p3', 1, 'sl-v-is-2'),
  ('s-subj2-p3', 2, 'sl-c-a-long-way-home'),
  -- subject-3: that 主语从句 + it 形式主语改写
  ('s-subj3-anchor', 0, 'sl-s-that-she-will-come-to-my-school'),
  ('s-subj3-anchor', 1, 'sl-v-makes'),
  ('s-subj3-anchor', 2, 'sl-o-me'),
  ('s-subj3-anchor', 3, 'sl-oc-happy'),
  ('s-subj3-p1', 0, 'sl-s-that-he-is-honest'),
  ('s-subj3-p1', 1, 'sl-v-is-2'),
  ('s-subj3-p1', 2, 'sl-c-important'),
  ('s-subj3-p2', 0, 'sl-s-it'),
  ('s-subj3-p2', 1, 'sl-v-makes'),
  ('s-subj3-p2', 2, 'sl-o-me'),
  ('s-subj3-p2', 3, 'sl-oc-happy'),
  ('s-subj3-p2', 4, 'sl-s-that-she-will-come-to-my-school'),
  ('s-subj3-p3', 0, 'sl-s-that-he-lied'),
  ('s-subj3-p3', 1, 'sl-v-made'),
  ('s-subj3-p3', 2, 'sl-o-us'),
  ('s-subj3-p3', 3, 'sl-oc-angry'),
  -- subject-4: There be
  ('s-subj4-anchor', 0, 'sl-s-there'),
  ('s-subj4-anchor', 1, 'sl-v-is-2'),
  ('s-subj4-anchor', 2, 'sl-s-an-apple'),
  ('s-subj4-anchor', 3, 'sl-a-in-her-bag'),
  ('s-subj4-p1', 0, 'sl-s-there'),
  ('s-subj4-p1', 1, 'sl-v-are'),
  ('s-subj4-p1', 2, 'sl-s-four-seasons'),
  ('s-subj4-p1', 3, 'sl-a-in-a-year'),
  ('s-subj4-p2', 0, 'sl-s-there'),
  ('s-subj4-p2', 1, 'sl-v-are'),
  ('s-subj4-p2', 2, 'sl-s-grounds'),
  ('s-subj4-p2', 3, 'sl-mod-that-can-explain'),
  ('s-subj4-p2', 4, 'sl-o-my-perspective'),
  ('s-subj4-p3', 0, 'sl-s-there'),
  ('s-subj4-p3', 1, 'sl-v-are'),
  ('s-subj4-p3', 2, 'sl-s-grounds'),
  ('s-subj4-p3', 3, 'sl-inf-to-explain'),
  ('s-subj4-p3', 4, 'sl-o-my-perspective');

COMMIT;
