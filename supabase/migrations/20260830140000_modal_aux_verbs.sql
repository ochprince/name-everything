-- Grammar Everything: 谓语动词体系扩展
-- 1) predicate 章重排 + 新增 2 关（verb-type-1 及物/不及物、linking-1 系动词六类）
-- 2) 新章「情态动词」6 关（总论/原形/过去推测/虚拟责备/should 两解/used to）
-- 3) 新章「助动词」2 关（总览/do 家族）
-- Author: Hermes Agent, 2026-08-30
BEGIN;

-- ============ 1. 新章节 ============
INSERT INTO chapters (id, title_zh, description_zh, sort_order, released) VALUES
  ('modal', '情态动词', '情态动词表达主观态度：推测、请求、命令、能力、希望、应该。', 6, true),
  ('aux', '助动词', 'be / do / have / will 协助构成时态、否定、疑问、强调、被动。', 7, true);

-- ============ 2. predicate 章重排（动词分类打头 → 情态入门 → 系动词 → 变形 → 祈使） ============
UPDATE levels SET sort_order = 2 WHERE id = 'modal-1';
UPDATE levels SET sort_order = 4 WHERE id = 'verb-form-1';
UPDATE levels SET sort_order = 5 WHERE id = 'verb-form-2';

-- ============ 3. 新语法点 ============
INSERT INTO grammar_points (id, title_zh, body_zh) VALUES
  ('gp-verb-type', '动词分类：及物与不及物',
   '实义动词分及物和不及物：及物动词后直接接宾语（I love music. 我喜欢音乐）；不及物动词必须加介词才能接宾语（I listen to music. 我听音乐，✗ I listen music）。系动词、情态动词、助动词见后文。'),
  ('gp-intransitive-prep', '不及物动词加介词接宾语',
   '不及物动词不能直接接宾语，必须加介词：listen to music（听音乐）、look at the picture（看画）、wait for the bus（等公交车）、depend on her friends（依赖朋友）。介词不能省：✗ I listen music.'),
  ('gp-linking-six', '系动词六类',
   '系动词后接表语，说明主语的属性、身份或状态，分六类：①状态 be（She is happy.）②感官 look/sound/taste/smell/feel（The soup tastes good.）③变化 become/get/turn/grow/fall/come/go（He became a doctor.）④持续 keep/stay/remain（She keeps quiet.）⑤表象 seem/appear（He seems very tired.）⑥结果 prove（The story proved true.）。'),
  ('gp-linking-sensory', '感官系动词',
   'look / sound / taste / smell / feel 后接形容词（不是副词）作表语：The soup tastes good.（✗ tastes well）；She looks happy.（✗ looks happily）。'),
  ('gp-modal-overview', '情态动词总论',
   '情态动词表达说话人的主观态度（请求、推测、命令、能力、希望、应该、敢于），不能单独作谓语，后接动词原形。主要情态动词：may/might、must、can/could、dare、shall/should、will/would、need。may 表请求（May I help you?）和推测；must 表命令（You must go out.）和肯定推测（He must be ill.）；can 表能力（Can you help me?）和推测（He can''t be a teacher.）。'),
  ('gp-modal-forms', '情态动词后接动词原形',
   '情态动词后一律接动词原形：①一般：情态+do（You must finish your homework.）②完成：情态+have done（She may have left.）③进行：情态+be doing（He must be sleeping now.）④完成进行：情态+have been doing（They must have been waiting for us.）。无论什么结构，情态动词后面的 do / have / be 都是原形。'),
  ('gp-modal-past-guess', '情态动词+have done：对过去推测',
   'must have done 过去一定做过（He must have finished his work.）；may/might have done 过去可能做过（She may have missed the bus.）；can''t/couldn''t have done 过去不可能做过（He can''t have forgotten the meeting.）。'),
  ('gp-modal-past-blame', '情态动词+have done：虚拟与责备',
   'should have done 本应该做（实际没做）：He should have worked hard.（他本应该努力，实际没努力）；could have done 本可以做（实际没做）：She could have passed the exam.（她本可以通过考试）；needn''t have done 本不必做（实际做了）：You needn''t have bought the ticket.（你本不必买票）。这类结构暗示事实与愿望相反。'),
  ('gp-should-two-meanings', 'should 的两种「应当」',
   'should + do 有两种语境：①暗示现状不努力：He should work hard.（他本该努力，现在却不努力）②单纯建议：He should work hard.（不清楚当下状态，只是规劝）。只有 should have done（虚拟）才确定暗示过去事实未完成：He should have worked hard.（他本应该努力，实际当时没有努力）。'),
  ('gp-used-to', 'used to vs be used to',
   'used to + do 表过去常做，暗示现在不做了：I used to get up early.（我过去常早起，现在不早起了）。be used to + doing 表过去到现在一直做、习惯做：I am used to getting up early.（我一直习惯早起）。区分：used to 后接动词原形；be used to 后接动名词。'),
  ('gp-aux-overview', '助动词总览',
   '助动词 be / do / have / will，协助实义动词构成时态、否定、疑问、强调、被动，不能单独作谓语：I don''t like you.（do 协助否定）；Do you like music?（do 协助疑问）；She is reading a book.（be 协助进行时）；The cake was made by my mother.（be 协助被动）；I have finished my homework.（have 协助完成时）；We will visit the museum tomorrow.（will 协助将来时）。'),
  ('gp-aux-do', 'do 助动词',
   'do / does / did 协助构成否定、疑问、强调，后接动词原形：否定 don''t / doesn''t / didn''t + 原形（I don''t like you.）；疑问 Do / Does / Did + 主语 + 原形（Do you like music?）；强调 do / does / did + 原形（I do like this song.）。does / did 已含时态与人称信息，后面的动词必须回归原形（✗ She doesn''t likes coffee.）。');

-- ============ 4. 新关卡 ============
INSERT INTO levels (id, chapter_id, sort_order, grammar_point_id, pass_threshold, lives, fall_duration_ms) VALUES
  -- predicate 章扩充
  ('verb-type-1', 'predicate', 1, 'gp-verb-type', NULL, NULL, NULL),
  ('linking-1', 'predicate', 3, 'gp-linking-six', NULL, NULL, NULL),
  -- 情态动词章
  ('mv-1', 'modal', 1, 'gp-modal-overview', NULL, NULL, NULL),
  ('mv-2', 'modal', 2, 'gp-modal-forms', NULL, NULL, NULL),
  ('mv-3', 'modal', 3, 'gp-modal-past-guess', NULL, NULL, NULL),
  ('mv-4', 'modal', 4, 'gp-modal-past-blame', NULL, NULL, NULL),
  ('mv-5', 'modal', 5, 'gp-should-two-meanings', NULL, NULL, NULL),
  ('mv-6', 'modal', 6, 'gp-used-to', NULL, NULL, NULL),
  -- 助动词章
  ('ax-1', 'aux', 1, 'gp-aux-overview', NULL, NULL, NULL),
  ('ax-2', 'aux', 2, 'gp-aux-do', NULL, NULL, NULL);

-- ============ 5. 句子（10 关，每关 1 anchor + 5-6 playable） ============
INSERT INTO sentences (id, level_id, kind, en, zh, prompt_kind, image_url, sort_order) VALUES
  -- verb-type-1 及物 vs 不及物
  ('s-vt1-anchor', 'verb-type-1', 'anchor', 'I listen to music.', '我听音乐。', 'zh', NULL, 0),
  ('s-vt1-p1', 'verb-type-1', 'playable', 'I love music.', '我喜欢音乐。', 'zh', NULL, 1),
  ('s-vt1-p2', 'verb-type-1', 'playable', 'He looks at the picture.', '他看着那幅画。', 'zh', NULL, 2),
  ('s-vt1-p3', 'verb-type-1', 'playable', 'They wait for the bus.', '他们等公交车。', 'zh', NULL, 3),
  ('s-vt1-p4', 'verb-type-1', 'playable', 'I watched a movie last night.', '我昨晚看了一部电影。', 'zh', NULL, 4),
  ('s-vt1-p5', 'verb-type-1', 'playable', 'She depends on her friends.', '她依赖她的朋友。', 'zh', NULL, 5),
  -- linking-1 系动词六类
  ('s-lk1-anchor', 'linking-1', 'anchor', 'The soup tastes good.', '这汤尝起来不错。', 'zh', NULL, 0),
  ('s-lk1-p1', 'linking-1', 'playable', 'She looks happy.', '她看起来很开心。', 'zh', NULL, 1),
  ('s-lk1-p2', 'linking-1', 'playable', 'He became a doctor.', '他成了一名医生。', 'zh', NULL, 2),
  ('s-lk1-p3', 'linking-1', 'playable', 'The weather gets cold in winter.', '冬天天气变冷。', 'zh', NULL, 3),
  ('s-lk1-p4', 'linking-1', 'playable', 'She keeps quiet in class.', '她上课保持安静。', 'zh', NULL, 4),
  ('s-lk1-p5', 'linking-1', 'playable', 'He seems very tired.', '他似乎很累。', 'zh', NULL, 5),
  ('s-lk1-p6', 'linking-1', 'playable', 'The story proved true.', '这个故事证明是真的。', 'zh', NULL, 6),
  -- mv-1 情态动词总论
  ('s-mv1-anchor', 'mv-1', 'anchor', 'He must be ill.', '他一定是病了。', 'zh', NULL, 0),
  ('s-mv1-p1', 'mv-1', 'playable', 'May I help you?', '需要我帮忙吗？', 'zh', NULL, 1),
  ('s-mv1-p2', 'mv-1', 'playable', 'It might be a girl.', '那可能是个女孩。', 'zh', NULL, 2),
  ('s-mv1-p3', 'mv-1', 'playable', 'Can you help me?', '你能帮我吗？', 'zh', NULL, 3),
  ('s-mv1-p4', 'mv-1', 'playable', 'He can''t be a teacher.', '他不可能是老师。', 'zh', NULL, 4),
  ('s-mv1-p5', 'mv-1', 'playable', 'I dare sleep in the forest.', '我敢睡在森林里。', 'zh', NULL, 5),
  -- mv-2 情态动词+动词原形
  ('s-mv2-anchor', 'mv-2', 'anchor', 'You must finish your homework.', '你必须完成作业。', 'zh', NULL, 0),
  ('s-mv2-p1', 'mv-2', 'playable', 'She may have left.', '她可能已经走了。', 'zh', NULL, 1),
  ('s-mv2-p2', 'mv-2', 'playable', 'He must be sleeping now.', '他现在一定在睡觉。', 'zh', NULL, 2),
  ('s-mv2-p3', 'mv-2', 'playable', 'They must have been waiting for us.', '他们一定一直在等我们。', 'zh', NULL, 3),
  ('s-mv2-p4', 'mv-2', 'playable', 'I can swim.', '我会游泳。', 'zh', NULL, 4),
  ('s-mv2-p5', 'mv-2', 'playable', 'He should study hard.', '他应该努力学习。', 'zh', NULL, 5),
  -- mv-3 情态+have done 过去推测
  ('s-mv3-anchor', 'mv-3', 'anchor', 'He must have finished his work.', '他一定已经完成了工作。', 'zh', NULL, 0),
  ('s-mv3-p1', 'mv-3', 'playable', 'She may have missed the bus.', '她可能错过了公交车。', 'zh', NULL, 1),
  ('s-mv3-p2', 'mv-3', 'playable', 'They might have arrived home.', '他们可能已经到家了。', 'zh', NULL, 2),
  ('s-mv3-p3', 'mv-3', 'playable', 'He can''t have forgotten the meeting.', '他不可能忘记会议。', 'zh', NULL, 3),
  ('s-mv3-p4', 'mv-3', 'playable', 'She couldn''t have said that.', '她不可能说那样的话。', 'zh', NULL, 4),
  ('s-mv3-p5', 'mv-3', 'playable', 'I must have left my keys at home.', '我一定是把钥匙落在家里了。', 'zh', NULL, 5),
  -- mv-4 情态+have done 虚拟责备
  ('s-mv4-anchor', 'mv-4', 'anchor', 'He should have worked hard.', '他本应该努力工作。', 'zh', NULL, 0),
  ('s-mv4-p1', 'mv-4', 'playable', 'You should have told me earlier.', '你本应该早点告诉我。', 'zh', NULL, 1),
  ('s-mv4-p2', 'mv-4', 'playable', 'She could have passed the exam.', '她本可以通过考试。', 'zh', NULL, 2),
  ('s-mv4-p3', 'mv-4', 'playable', 'We could have helped him.', '我们本可以帮他。', 'zh', NULL, 3),
  ('s-mv4-p4', 'mv-4', 'playable', 'You needn''t have bought the ticket.', '你本不必买票。', 'zh', NULL, 4),
  ('s-mv4-p5', 'mv-4', 'playable', 'I shouldn''t have said that.', '我本不应该说那话。', 'zh', NULL, 5),
  -- mv-5 should 两种「应当」
  ('s-mv5-anchor', 'mv-5', 'anchor', 'He should work hard.', '他应该努力工作。', 'zh', NULL, 0),
  ('s-mv5-p1', 'mv-5', 'playable', 'You should drink more water.', '你应该多喝水。', 'zh', NULL, 1),
  ('s-mv5-p2', 'mv-5', 'playable', 'She should apologize to him.', '她应该向他道歉。', 'zh', NULL, 2),
  ('s-mv5-p3', 'mv-5', 'playable', 'She should have finished her homework.', '她本应该完成作业。', 'zh', NULL, 3),
  ('s-mv5-p4', 'mv-5', 'playable', 'We should be quiet in the library.', '我们应在图书馆保持安静。', 'zh', NULL, 4),
  ('s-mv5-p5', 'mv-5', 'playable', 'You should have come earlier.', '你本应该早点来。', 'zh', NULL, 5),
  -- mv-6 used to vs be used to
  ('s-mv6-anchor', 'mv-6', 'anchor', 'I used to get up early.', '我过去常早起。', 'zh', NULL, 0),
  ('s-mv6-p1', 'mv-6', 'playable', 'He used to play basketball.', '他过去常打篮球。', 'zh', NULL, 1),
  ('s-mv6-p2', 'mv-6', 'playable', 'She used to live in Beijing.', '她过去住在北京。', 'zh', NULL, 2),
  ('s-mv6-p3', 'mv-6', 'playable', 'I am used to getting up early.', '我习惯早起。', 'zh', NULL, 3),
  ('s-mv6-p4', 'mv-6', 'playable', 'They are used to living here.', '他们习惯住在这里。', 'zh', NULL, 4),
  ('s-mv6-p5', 'mv-6', 'playable', 'We used to walk to school.', '我们过去常走路去上学。', 'zh', NULL, 5),
  -- ax-1 助动词总览
  ('s-ax1-anchor', 'ax-1', 'anchor', 'I don''t like you.', '我不喜欢你。', 'zh', NULL, 0),
  ('s-ax1-p1', 'ax-1', 'playable', 'Do you like music?', '你喜欢音乐吗？', 'zh', NULL, 1),
  ('s-ax1-p2', 'ax-1', 'playable', 'She is reading a book.', '她正在读书。', 'zh', NULL, 2),
  ('s-ax1-p3', 'ax-1', 'playable', 'The cake was made by my mother.', '蛋糕是我妈妈做的。', 'zh', NULL, 3),
  ('s-ax1-p4', 'ax-1', 'playable', 'I have finished my homework.', '我已经完成了作业。', 'zh', NULL, 4),
  ('s-ax1-p5', 'ax-1', 'playable', 'We will visit the museum tomorrow.', '我们明天将参观博物馆。', 'zh', NULL, 5),
  -- ax-2 do 家族
  ('s-ax2-anchor', 'ax-2', 'anchor', 'She doesn''t like coffee.', '她不喜欢咖啡。', 'zh', NULL, 0),
  ('s-ax2-p1', 'ax-2', 'playable', 'I didn''t watch TV last night.', '我昨晚没看电视。', 'zh', NULL, 1),
  ('s-ax2-p2', 'ax-2', 'playable', 'Do they play football?', '他们踢足球吗？', 'zh', NULL, 2),
  ('s-ax2-p3', 'ax-2', 'playable', 'Does he speak English?', '他说英语吗？', 'zh', NULL, 3),
  ('s-ax2-p4', 'ax-2', 'playable', 'I do like this song.', '我确实喜欢这首歌。', 'zh', NULL, 4),
  ('s-ax2-p5', 'ax-2', 'playable', 'He did finish the work.', '他确实完成了工作。', 'zh', NULL, 5);

-- ============ 6. anchor spans ============
INSERT INTO sentence_spans (id, sentence_id, grammar_point_id, start, "end") VALUES
  -- verb-type-1: I / listen / to music
  ('sp-vt1-s', 's-vt1-anchor', 'gp-s', 0, 1),
  ('sp-vt1-v', 's-vt1-anchor', 'gp-v', 2, 8),
  ('sp-vt1-prep', 's-vt1-anchor', 'gp-intransitive-prep', 9, 17),
  -- linking-1: The soup / tastes / good
  ('sp-lk1-s', 's-lk1-anchor', 'gp-s', 0, 8),
  ('sp-lk1-v', 's-lk1-anchor', 'gp-linking-sensory', 9, 15),
  ('sp-lk1-c', 's-lk1-anchor', 'gp-c', 16, 20),
  -- mv-1: He / must be ill
  ('sp-mv1-s', 's-mv1-anchor', 'gp-s', 0, 2),
  ('sp-mv1-mod', 's-mv1-anchor', 'gp-modal-overview', 3, 14),
  -- mv-2: You / must / finish your homework
  ('sp-mv2-s', 's-mv2-anchor', 'gp-s', 0, 3),
  ('sp-mv2-mod', 's-mv2-anchor', 'gp-modal-forms', 4, 8),
  -- mv-3: He / must have finished his work
  ('sp-mv3-s', 's-mv3-anchor', 'gp-s', 0, 2),
  ('sp-mv3-v', 's-mv3-anchor', 'gp-modal-past-guess', 3, 21),
  -- mv-4: He / should have worked hard
  ('sp-mv4-s', 's-mv4-anchor', 'gp-s', 0, 2),
  ('sp-mv4-v', 's-mv4-anchor', 'gp-modal-past-blame', 3, 21),
  -- mv-5: He / should / work hard
  ('sp-mv5-s', 's-mv5-anchor', 'gp-s', 0, 2),
  ('sp-mv5-mod', 's-mv5-anchor', 'gp-should-two-meanings', 3, 9),
  -- mv-6: I / used to / get up early
  ('sp-mv6-s', 's-mv6-anchor', 'gp-s', 0, 1),
  ('sp-mv6-v', 's-mv6-anchor', 'gp-used-to', 2, 9),
  -- ax-1: I / don't / like you
  ('sp-ax1-s', 's-ax1-anchor', 'gp-s', 0, 1),
  ('sp-ax1-aux', 's-ax1-anchor', 'gp-aux-overview', 2, 7),
  -- ax-2: She / doesn't / like coffee
  ('sp-ax2-s', 's-ax2-anchor', 'gp-s', 0, 3),
  ('sp-ax2-aux', 's-ax2-anchor', 'gp-aux-do', 4, 11);

-- ============ 7. 新 slot 定义（复用优先；标"复用"的在 refs 里直接引用既有 id） ============
INSERT INTO slots (id, role, correct, distractors) VALUES
  -- verb-type-1
  ('sl-v-listen', 'V', 'listen', '["listens","listening","listened"]'::jsonb),
  ('sl-v-love', 'V', 'love', '["loves","loving","loved"]'::jsonb),
  ('sl-v-looks', 'V', 'looks', '["look","looking","looked"]'::jsonb),
  ('sl-v-wait', 'V', 'wait', '["waits","waiting","waited"]'::jsonb),
  ('sl-v-watched', 'V', 'watched', '["watch","watches","watching"]'::jsonb),
  ('sl-v-depends', 'V', 'depends', '["depend","depending","depended"]'::jsonb),
  ('sl-a-to-music', 'A', 'to music', '["music","at music","for music"]'::jsonb),
  ('sl-a-at-the-picture', 'A', 'at the picture', '["the picture","at picture","on the picture"]'::jsonb),
  ('sl-a-for-the-bus', 'A', 'for the bus', '["the bus","for bus","to the bus"]'::jsonb),
  ('sl-o-a-movie', 'O', 'a movie', '["movies","an movie","a movies"]'::jsonb),
  ('sl-a-on-her-friends', 'A', 'on her friends', '["her friends","on her friend","to her friends"]'::jsonb),
  -- linking-1
  ('sl-s-the-soup', 'S', 'The soup', '["The soups","Soups","The a soup"]'::jsonb),
  ('sl-v-tastes', 'V', 'tastes', '["taste","tasting","tasted"]'::jsonb),
  ('sl-c-good', 'C', 'good', '["well","goodly","goods"]'::jsonb),
  ('sl-c-happy-2', 'C', 'happy', '["happily","happiness","happier"]'::jsonb),
  ('sl-v-became', 'V', 'became', '["become","becomes","becoming"]'::jsonb),
  ('sl-c-a-doctor', 'C', 'a doctor', '["doctor","an doctor","a doctors"]'::jsonb),
  ('sl-s-the-weather', 'S', 'The weather', '["The weathers","Weather","The a weather"]'::jsonb),
  ('sl-v-gets', 'V', 'gets', '["get","getting","got"]'::jsonb),
  ('sl-c-cold', 'C', 'cold', '["coldly","colder","coldness"]'::jsonb),
  ('sl-a-in-winter', 'A', 'in winter', '["on winter","at winter","in winters"]'::jsonb),
  ('sl-v-keeps', 'V', 'keeps', '["keep","keeping","kept"]'::jsonb),
  ('sl-a-in-class', 'A', 'in class', '["at class","in classes","on class"]'::jsonb),
  ('sl-v-seems', 'V', 'seems', '["seem","seeming","seemed"]'::jsonb),
  ('sl-s-the-story', 'S', 'The story', '["The stories","A story","The a story"]'::jsonb),
  ('sl-v-proved', 'V', 'proved', '["prove","proves","proving"]'::jsonb),
  ('sl-c-true', 'C', 'true', '["truly","truth","truely"]'::jsonb),
  -- mv-1 情态总论
  ('sl-c-ill', 'C', 'ill', '["illness","ills","illnesses"]'::jsonb),
  ('sl-mod-may', 'MOD', 'May', '["Must","Will","Would"]'::jsonb),
  ('sl-v-help', 'V', 'help', '["helps","helping","helped"]'::jsonb),
  ('sl-o-you', 'O', 'you', '["your","yours","yourself"]'::jsonb),
  ('sl-mod-might', 'MOD', 'might', '["must","can","should"]'::jsonb),
  ('sl-c-a-girl', 'C', 'a girl', '["girl","an girl","a girls"]'::jsonb),
  ('sl-mod-can', 'MOD', 'Can', '["May","Must","Do"]'::jsonb),
  ('sl-mod-cant', 'MOD', 'can''t', '["can","could","must"]'::jsonb),
  ('sl-mod-should', 'MOD', 'should', '["shall","would","must"]'::jsonb),
  ('sl-v-work', 'V', 'work', '["works","working","worked"]'::jsonb),
  ('sl-a-hard', 'A', 'hard', '["hardly","harder","hardest"]'::jsonb),
  ('sl-mod-dare', 'MOD', 'dare', '["dares","daring","dared"]'::jsonb),
  ('sl-v-sleep', 'V', 'sleep', '["sleeps","sleeping","slept"]'::jsonb),
  ('sl-a-in-the-forest', 'A', 'in the forest', '["in forest","on the forest","in the forests"]'::jsonb),
  -- mv-2 情态+原形
  ('sl-s-you', 'S', 'You', '["Your","Yours","Yourself"]'::jsonb),
  ('sl-v-finish', 'V', 'finish', '["finishes","finishing","finished"]'::jsonb),
  ('sl-o-your-homework', 'O', 'your homework', '["your homeworks","yours homework","you homework"]'::jsonb),
  ('sl-mod-may-2', 'MOD', 'may', '["might","must","can"]'::jsonb),
  ('sl-v-have-left', 'V', 'have left', '["has left","have leave","had left"]'::jsonb),
  ('sl-v-be-sleeping', 'V', 'be sleeping', '["is sleeping","be sleep","was sleeping"]'::jsonb),
  ('sl-a-now', 'A', 'now', '["then","nows","at now"]'::jsonb),
  ('sl-v-have-been-waiting', 'V', 'have been waiting', '["has been waiting","have been wait","had been waiting"]'::jsonb),
  ('sl-a-for-us', 'A', 'for us', '["for we","to us","for ours"]'::jsonb),
  ('sl-mod-can-2', 'MOD', 'can', '["could","must","should"]'::jsonb),
  ('sl-v-swim', 'V', 'swim', '["swims","swimming","swam"]'::jsonb),
  ('sl-v-study', 'V', 'study', '["studies","studying","studied"]'::jsonb),
  -- mv-3 过去推测
  ('sl-v-have-finished', 'V', 'have finished', '["has finished","have finish","had finished"]'::jsonb),
  ('sl-o-his-work', 'O', 'his work', '["his works","him work","his a work"]'::jsonb),
  ('sl-v-have-missed', 'V', 'have missed', '["has missed","have miss","had missed"]'::jsonb),
  ('sl-o-the-bus', 'O', 'the bus', '["a bus","the buses","bus"]'::jsonb),
  ('sl-v-have-arrived', 'V', 'have arrived', '["has arrived","have arrive","had arrived"]'::jsonb),
  ('sl-a-home', 'A', 'home', '["at home","to home","homes"]'::jsonb),
  ('sl-mod-couldnt', 'MOD', 'couldn''t', '["shouldn''t","mustn''t","didn''t"]'::jsonb),
  ('sl-v-have-said', 'V', 'have said', '["has said","have say","had said"]'::jsonb),
  ('sl-o-that', 'O', 'that', '["this","those","them"]'::jsonb),
  ('sl-v-have-forgotten', 'V', 'have forgotten', '["has forgotten","have forget","had forgotten"]'::jsonb),
  ('sl-o-the-meeting', 'O', 'the meeting', '["a meeting","the meetings","meeting"]'::jsonb),
  ('sl-o-my-keys', 'O', 'my keys', '["my key","mine keys","my a keys"]'::jsonb),
  -- mv-4 虚拟责备
  ('sl-v-have-worked', 'V', 'have worked', '["has worked","have work","had worked"]'::jsonb),
  ('sl-v-have-told', 'V', 'have told', '["has told","have tell","had told"]'::jsonb),
  ('sl-a-earlier', 'A', 'earlier', '["early","more earlier","earliest"]'::jsonb),
  ('sl-mod-could', 'MOD', 'could', '["can","would","should"]'::jsonb),
  ('sl-v-have-passed', 'V', 'have passed', '["has passed","have pass","had passed"]'::jsonb),
  ('sl-o-the-exam', 'O', 'the exam', '["an exam","the exams","exam"]'::jsonb),
  ('sl-v-have-helped', 'V', 'have helped', '["has helped","have help","had helped"]'::jsonb),
  ('sl-mod-neednt', 'MOD', 'needn''t', '["mustn''t","shouldn''t","wouldn''t"]'::jsonb),
  ('sl-v-have-bought', 'V', 'have bought', '["has bought","have buy","had bought"]'::jsonb),
  ('sl-o-the-ticket', 'O', 'the ticket', '["a ticket","the tickets","ticket"]'::jsonb),
  ('sl-mod-shouldnt', 'MOD', 'shouldn''t', '["can''t","mustn''t","wouldn''t"]'::jsonb),
  ('sl-o-her-homework', 'O', 'her homework', '["her homeworks","hers homework","she homework"]'::jsonb),
  -- mv-5 should 两解
  ('sl-v-drink', 'V', 'drink', '["drinks","drinking","drank"]'::jsonb),
  ('sl-o-more-water', 'O', 'more water', '["more waters","many water","much waters"]'::jsonb),
  ('sl-v-apologize', 'V', 'apologize', '["apologizes","apologizing","apologized"]'::jsonb),
  ('sl-a-to-him', 'A', 'to him', '["him","for him","to he"]'::jsonb),
  ('sl-v-have-come', 'V', 'have come', '["has come","have came","had come"]'::jsonb),
  ('sl-a-in-the-library', 'A', 'in the library', '["in library","on the library","at the library"]'::jsonb),
  -- mv-6 used to
  ('sl-v-used-to', 'V', 'used to', '["use to","uses to","used"]'::jsonb),
  ('sl-v-get-up', 'V', 'get up', '["gets up","getting up","got up"]'::jsonb),
  ('sl-a-early', 'A', 'early', '["earliest","earlyly","at early"]'::jsonb),
  ('sl-v-play', 'V', 'play', '["plays","playing","played"]'::jsonb),
  ('sl-v-live', 'V', 'live', '["lives","living","lived"]'::jsonb),
  ('sl-a-in-beijing', 'A', 'in Beijing', '["on Beijing","at Beijing","in beijing"]'::jsonb),
  ('sl-v-am-used-to', 'V', 'am used to', '["is used to","are used to","am use to"]'::jsonb),
  ('sl-ger-getting-up', 'GER', 'getting up', '["get up","gets up","got up"]'::jsonb),
  ('sl-v-are-used-to', 'V', 'are used to', '["is used to","was used to","are use to"]'::jsonb),
  ('sl-ger-living', 'GER', 'living', '["live","lives","lived"]'::jsonb),
  ('sl-a-here', 'A', 'here', '["there","at here","heres"]'::jsonb),
  ('sl-v-walk', 'V', 'walk', '["walks","walking","walked"]'::jsonb),
  ('sl-a-to-school', 'A', 'to school', '["at school","to the school","school"]'::jsonb),
  -- ax-1 助动词总览
  ('sl-aux-dont', 'AUX', 'don''t', '["doesn''t","didn''t","not"]'::jsonb),
  ('sl-aux-do', 'AUX', 'Do', '["Does","Did","Are"]'::jsonb),
  ('sl-s-you-2', 'S', 'you', '["your","yours","yourself"]'::jsonb),
  ('sl-s-the-cake', 'S', 'The cake', '["The cakes","A cake","The a cake"]'::jsonb),
  ('sl-v-was-made', 'V', 'was made', '["is made","were made","was make"]'::jsonb),
  ('sl-a-by-my-mother', 'A', 'by my mother', '["by my mothers","by me mother","from my mother"]'::jsonb),
  ('sl-o-my-homework', 'O', 'my homework', '["my homeworks","mine homework","my a homework"]'::jsonb),
  ('sl-aux-will', 'AUX', 'will', '["would","should","do"]'::jsonb),
  ('sl-v-visit', 'V', 'visit', '["visits","visiting","visited"]'::jsonb),
  ('sl-a-tomorrow', 'A', 'tomorrow', '["tomorrows","the tomorrow","yesterday"]'::jsonb),
  -- ax-2 do 家族
  ('sl-aux-doesnt', 'AUX', 'doesn''t', '["don''t","didn''t","not"]'::jsonb),
  ('sl-o-coffee', 'O', 'coffee', '["coffees","a coffee","the coffee"]'::jsonb),
  ('sl-aux-didnt', 'AUX', 'didn''t', '["don''t","doesn''t","not"]'::jsonb),
  ('sl-s-they-2', 'S', 'they', '["them","their","theirs"]'::jsonb),
  ('sl-o-football', 'O', 'football', '["the football","footballs","a football"]'::jsonb),
  ('sl-aux-does', 'AUX', 'Does', '["Do","Did","Is"]'::jsonb),
  ('sl-s-he-lower', 'S', 'he', '["him","she","they"]'::jsonb),
  ('sl-v-speak', 'V', 'speak', '["speaks","speaking","spoke"]'::jsonb),
  ('sl-o-english', 'O', 'English', '["englishes","the English","an English"]'::jsonb),
  ('sl-aux-do-emph', 'AUX', 'do', '["does","did","not"]'::jsonb),
  ('sl-o-this-song', 'O', 'this song', '["this songs","these song","these songs"]'::jsonb),
  ('sl-aux-did-emph', 'AUX', 'did', '["do","does","not"]'::jsonb),
  ('sl-o-the-work', 'O', 'the work', '["the works","a work","the a work"]'::jsonb);

-- ============ 8. sentence_slot_refs（slot_index = 原句 LTR 顺序） ============
INSERT INTO sentence_slot_refs (sentence_id, slot_index, slot_id) VALUES
  -- verb-type-1 anchor: I listen to music.
  ('s-vt1-anchor', 0, 'sl-s-i'),
  ('s-vt1-anchor', 1, 'sl-v-listen'),
  ('s-vt1-anchor', 2, 'sl-a-to-music'),
  -- verb-type-1 p1: I love music.
  ('s-vt1-p1', 0, 'sl-s-i'),
  ('s-vt1-p1', 1, 'sl-v-love'),
  ('s-vt1-p1', 2, 'sl-o-music'),
  -- verb-type-1 p2: He looks at the picture.
  ('s-vt1-p2', 0, 'sl-s-he'),
  ('s-vt1-p2', 1, 'sl-v-looks'),
  ('s-vt1-p2', 2, 'sl-a-at-the-picture'),
  -- verb-type-1 p3: They wait for the bus.
  ('s-vt1-p3', 0, 'sl-s-they'),
  ('s-vt1-p3', 1, 'sl-v-wait'),
  ('s-vt1-p3', 2, 'sl-a-for-the-bus'),
  -- verb-type-1 p4: I watched a movie last night.
  ('s-vt1-p4', 0, 'sl-s-i'),
  ('s-vt1-p4', 1, 'sl-v-watched'),
  ('s-vt1-p4', 2, 'sl-o-a-movie'),
  ('s-vt1-p4', 3, 'sl-a-last-night'),
  -- verb-type-1 p5: She depends on her friends.
  ('s-vt1-p5', 0, 'sl-s-she'),
  ('s-vt1-p5', 1, 'sl-v-depends'),
  ('s-vt1-p5', 2, 'sl-a-on-her-friends'),
  -- linking-1 anchor: The soup tastes good.
  ('s-lk1-anchor', 0, 'sl-s-the-soup'),
  ('s-lk1-anchor', 1, 'sl-v-tastes'),
  ('s-lk1-anchor', 2, 'sl-c-good'),
  -- linking-1 p1: She looks happy.
  ('s-lk1-p1', 0, 'sl-s-she'),
  ('s-lk1-p1', 1, 'sl-v-looks'),
  ('s-lk1-p1', 2, 'sl-c-happy-2'),
  -- linking-1 p2: He became a doctor.
  ('s-lk1-p2', 0, 'sl-s-he'),
  ('s-lk1-p2', 1, 'sl-v-became'),
  ('s-lk1-p2', 2, 'sl-c-a-doctor'),
  -- linking-1 p3: The weather gets cold in winter.
  ('s-lk1-p3', 0, 'sl-s-the-weather'),
  ('s-lk1-p3', 1, 'sl-v-gets'),
  ('s-lk1-p3', 2, 'sl-c-cold'),
  ('s-lk1-p3', 3, 'sl-a-in-winter'),
  -- linking-1 p4: She keeps quiet in class.
  ('s-lk1-p4', 0, 'sl-s-she'),
  ('s-lk1-p4', 1, 'sl-v-keeps'),
  ('s-lk1-p4', 2, 'sl-c-quiet'),
  ('s-lk1-p4', 3, 'sl-a-in-class'),
  -- linking-1 p5: He seems very tired.
  ('s-lk1-p5', 0, 'sl-s-he'),
  ('s-lk1-p5', 1, 'sl-v-seems'),
  ('s-lk1-p5', 2, 'sl-c-very-tired'),
  -- linking-1 p6: The story proved true.
  ('s-lk1-p6', 0, 'sl-s-the-story'),
  ('s-lk1-p6', 1, 'sl-v-proved'),
  ('s-lk1-p6', 2, 'sl-c-true'),
  -- mv-1 anchor: He must be ill.
  ('s-mv1-anchor', 0, 'sl-s-he'),
  ('s-mv1-anchor', 1, 'sl-mod-must'),
  ('s-mv1-anchor', 2, 'sl-v-be'),
  ('s-mv1-anchor', 3, 'sl-c-ill'),
  -- mv-1 p1: May I help you?
  ('s-mv1-p1', 0, 'sl-mod-may'),
  ('s-mv1-p1', 1, 'sl-s-i'),
  ('s-mv1-p1', 2, 'sl-v-help'),
  ('s-mv1-p1', 3, 'sl-o-you'),
  -- mv-1 p2: It might be a girl.
  ('s-mv1-p2', 0, 'sl-s-it'),
  ('s-mv1-p2', 1, 'sl-mod-might'),
  ('s-mv1-p2', 2, 'sl-v-be'),
  ('s-mv1-p2', 3, 'sl-c-a-girl'),
  -- mv-1 p3: Can you help me?
  ('s-mv1-p3', 0, 'sl-mod-can'),
  ('s-mv1-p3', 1, 'sl-s-you-2'),
  ('s-mv1-p3', 2, 'sl-v-help'),
  ('s-mv1-p3', 3, 'sl-o-me'),
  -- mv-1 p4: He can't be a teacher.
  ('s-mv1-p4', 0, 'sl-s-he'),
  ('s-mv1-p4', 1, 'sl-mod-cant'),
  ('s-mv1-p4', 2, 'sl-v-be'),
  ('s-mv1-p4', 3, 'sl-c-a-teacher'),
  -- mv-1 p5: I dare sleep in the forest.
  ('s-mv1-p5', 0, 'sl-s-i'),
  ('s-mv1-p5', 1, 'sl-mod-dare'),
  ('s-mv1-p5', 2, 'sl-v-sleep'),
  ('s-mv1-p5', 3, 'sl-a-in-the-forest'),
  -- mv-2 anchor: You must finish your homework.
  ('s-mv2-anchor', 0, 'sl-s-you'),
  ('s-mv2-anchor', 1, 'sl-mod-must'),
  ('s-mv2-anchor', 2, 'sl-v-finish'),
  ('s-mv2-anchor', 3, 'sl-o-your-homework'),
  -- mv-2 p1: She may have left.
  ('s-mv2-p1', 0, 'sl-s-she'),
  ('s-mv2-p1', 1, 'sl-mod-may-2'),
  ('s-mv2-p1', 2, 'sl-v-have-left'),
  -- mv-2 p2: He must be sleeping now.
  ('s-mv2-p2', 0, 'sl-s-he'),
  ('s-mv2-p2', 1, 'sl-mod-must'),
  ('s-mv2-p2', 2, 'sl-v-be-sleeping'),
  ('s-mv2-p2', 3, 'sl-a-now'),
  -- mv-2 p3: They must have been waiting for us.
  ('s-mv2-p3', 0, 'sl-s-they'),
  ('s-mv2-p3', 1, 'sl-mod-must'),
  ('s-mv2-p3', 2, 'sl-v-have-been-waiting'),
  ('s-mv2-p3', 3, 'sl-a-for-us'),
  -- mv-2 p4: I can swim.
  ('s-mv2-p4', 0, 'sl-s-i'),
  ('s-mv2-p4', 1, 'sl-mod-can-2'),
  ('s-mv2-p4', 2, 'sl-v-swim'),
  -- mv-2 p5: He should study hard.
  ('s-mv2-p5', 0, 'sl-s-he'),
  ('s-mv2-p5', 1, 'sl-mod-should'),
  ('s-mv2-p5', 2, 'sl-v-study'),
  ('s-mv2-p5', 3, 'sl-a-hard'),
  -- mv-3 anchor: He must have finished his work.
  ('s-mv3-anchor', 0, 'sl-s-he'),
  ('s-mv3-anchor', 1, 'sl-mod-must'),
  ('s-mv3-anchor', 2, 'sl-v-have-finished'),
  ('s-mv3-anchor', 3, 'sl-o-his-work'),
  -- mv-3 p1: She may have missed the bus.
  ('s-mv3-p1', 0, 'sl-s-she'),
  ('s-mv3-p1', 1, 'sl-mod-may-2'),
  ('s-mv3-p1', 2, 'sl-v-have-missed'),
  ('s-mv3-p1', 3, 'sl-o-the-bus'),
  -- mv-3 p2: They might have arrived home.
  ('s-mv3-p2', 0, 'sl-s-they'),
  ('s-mv3-p2', 1, 'sl-mod-might'),
  ('s-mv3-p2', 2, 'sl-v-have-arrived'),
  ('s-mv3-p2', 3, 'sl-a-home'),
  -- mv-3 p3: He can't have forgotten the meeting.
  ('s-mv3-p3', 0, 'sl-s-he'),
  ('s-mv3-p3', 1, 'sl-mod-cant'),
  ('s-mv3-p3', 2, 'sl-v-have-forgotten'),
  ('s-mv3-p3', 3, 'sl-o-the-meeting'),
  -- mv-3 p4: She couldn't have said that.
  ('s-mv3-p4', 0, 'sl-s-she'),
  ('s-mv3-p4', 1, 'sl-mod-couldnt'),
  ('s-mv3-p4', 2, 'sl-v-have-said'),
  ('s-mv3-p4', 3, 'sl-o-that'),
  -- mv-3 p5: I must have left my keys at home.
  ('s-mv3-p5', 0, 'sl-s-i'),
  ('s-mv3-p5', 1, 'sl-mod-must'),
  ('s-mv3-p5', 2, 'sl-v-have-left'),
  ('s-mv3-p5', 3, 'sl-o-my-keys'),
  ('s-mv3-p5', 4, 'sl-a-at-home'),
  -- mv-4 anchor: He should have worked hard.
  ('s-mv4-anchor', 0, 'sl-s-he'),
  ('s-mv4-anchor', 1, 'sl-mod-should'),
  ('s-mv4-anchor', 2, 'sl-v-have-worked'),
  ('s-mv4-anchor', 3, 'sl-a-hard'),
  -- mv-4 p1: You should have told me earlier.
  ('s-mv4-p1', 0, 'sl-s-you'),
  ('s-mv4-p1', 1, 'sl-mod-should'),
  ('s-mv4-p1', 2, 'sl-v-have-told'),
  ('s-mv4-p1', 3, 'sl-o-me'),
  ('s-mv4-p1', 4, 'sl-a-earlier'),
  -- mv-4 p2: She could have passed the exam.
  ('s-mv4-p2', 0, 'sl-s-she'),
  ('s-mv4-p2', 1, 'sl-mod-could'),
  ('s-mv4-p2', 2, 'sl-v-have-passed'),
  ('s-mv4-p2', 3, 'sl-o-the-exam'),
  -- mv-4 p3: We could have helped him.
  ('s-mv4-p3', 0, 'sl-s-we'),
  ('s-mv4-p3', 1, 'sl-mod-could'),
  ('s-mv4-p3', 2, 'sl-v-have-helped'),
  ('s-mv4-p3', 3, 'sl-o-him'),
  -- mv-4 p4: You needn't have bought the ticket.
  ('s-mv4-p4', 0, 'sl-s-you'),
  ('s-mv4-p4', 1, 'sl-mod-neednt'),
  ('s-mv4-p4', 2, 'sl-v-have-bought'),
  ('s-mv4-p4', 3, 'sl-o-the-ticket'),
  -- mv-4 p5: I shouldn't have said that.
  ('s-mv4-p5', 0, 'sl-s-i'),
  ('s-mv4-p5', 1, 'sl-mod-shouldnt'),
  ('s-mv4-p5', 2, 'sl-v-have-said'),
  ('s-mv4-p5', 3, 'sl-o-that'),
  -- mv-5 anchor: He should work hard.
  ('s-mv5-anchor', 0, 'sl-s-he'),
  ('s-mv5-anchor', 1, 'sl-mod-should'),
  ('s-mv5-anchor', 2, 'sl-v-work'),
  ('s-mv5-anchor', 3, 'sl-a-hard'),
  -- mv-5 p1: You should drink more water.
  ('s-mv5-p1', 0, 'sl-s-you'),
  ('s-mv5-p1', 1, 'sl-mod-should'),
  ('s-mv5-p1', 2, 'sl-v-drink'),
  ('s-mv5-p1', 3, 'sl-o-more-water'),
  -- mv-5 p2: She should apologize to him.
  ('s-mv5-p2', 0, 'sl-s-she'),
  ('s-mv5-p2', 1, 'sl-mod-should'),
  ('s-mv5-p2', 2, 'sl-v-apologize'),
  ('s-mv5-p2', 3, 'sl-a-to-him'),
  -- mv-5 p3: She should have finished her homework.
  ('s-mv5-p3', 0, 'sl-s-she'),
  ('s-mv5-p3', 1, 'sl-mod-should'),
  ('s-mv5-p3', 2, 'sl-v-have-finished'),
  ('s-mv5-p3', 3, 'sl-o-her-homework'),
  -- mv-5 p4: We should be quiet in the library.
  ('s-mv5-p4', 0, 'sl-s-we'),
  ('s-mv5-p4', 1, 'sl-mod-should'),
  ('s-mv5-p4', 2, 'sl-v-be'),
  ('s-mv5-p4', 3, 'sl-c-quiet'),
  ('s-mv5-p4', 4, 'sl-a-in-the-library'),
  -- mv-5 p5: You should have come earlier.
  ('s-mv5-p5', 0, 'sl-s-you'),
  ('s-mv5-p5', 1, 'sl-mod-should'),
  ('s-mv5-p5', 2, 'sl-v-have-come'),
  ('s-mv5-p5', 3, 'sl-a-earlier'),
  -- mv-6 anchor: I used to get up early.
  ('s-mv6-anchor', 0, 'sl-s-i'),
  ('s-mv6-anchor', 1, 'sl-v-used-to'),
  ('s-mv6-anchor', 2, 'sl-v-get-up'),
  ('s-mv6-anchor', 3, 'sl-a-early'),
  -- mv-6 p1: He used to play basketball.
  ('s-mv6-p1', 0, 'sl-s-he'),
  ('s-mv6-p1', 1, 'sl-v-used-to'),
  ('s-mv6-p1', 2, 'sl-v-play'),
  ('s-mv6-p1', 3, 'sl-o-basketball'),
  -- mv-6 p2: She used to live in Beijing.
  ('s-mv6-p2', 0, 'sl-s-she'),
  ('s-mv6-p2', 1, 'sl-v-used-to'),
  ('s-mv6-p2', 2, 'sl-v-live'),
  ('s-mv6-p2', 3, 'sl-a-in-beijing'),
  -- mv-6 p3: I am used to getting up early.
  ('s-mv6-p3', 0, 'sl-s-i'),
  ('s-mv6-p3', 1, 'sl-v-am-used-to'),
  ('s-mv6-p3', 2, 'sl-ger-getting-up'),
  ('s-mv6-p3', 3, 'sl-a-early'),
  -- mv-6 p4: They are used to living here.
  ('s-mv6-p4', 0, 'sl-s-they'),
  ('s-mv6-p4', 1, 'sl-v-are-used-to'),
  ('s-mv6-p4', 2, 'sl-ger-living'),
  ('s-mv6-p4', 3, 'sl-a-here'),
  -- mv-6 p5: We used to walk to school.
  ('s-mv6-p5', 0, 'sl-s-we'),
  ('s-mv6-p5', 1, 'sl-v-used-to'),
  ('s-mv6-p5', 2, 'sl-v-walk'),
  ('s-mv6-p5', 3, 'sl-a-to-school'),
  -- ax-1 anchor: I don't like you.
  ('s-ax1-anchor', 0, 'sl-s-i'),
  ('s-ax1-anchor', 1, 'sl-aux-dont'),
  ('s-ax1-anchor', 2, 'sl-v-like'),
  ('s-ax1-anchor', 3, 'sl-o-you'),
  -- ax-1 p1: Do you like music?
  ('s-ax1-p1', 0, 'sl-aux-do'),
  ('s-ax1-p1', 1, 'sl-s-you-2'),
  ('s-ax1-p1', 2, 'sl-v-like'),
  ('s-ax1-p1', 3, 'sl-o-music'),
  -- ax-1 p2: She is reading a book.
  ('s-ax1-p2', 0, 'sl-s-she'),
  ('s-ax1-p2', 1, 'sl-v-is-reading'),
  ('s-ax1-p2', 2, 'sl-o-a-book'),
  -- ax-1 p3: The cake was made by my mother.
  ('s-ax1-p3', 0, 'sl-s-the-cake'),
  ('s-ax1-p3', 1, 'sl-v-was-made'),
  ('s-ax1-p3', 2, 'sl-a-by-my-mother'),
  -- ax-1 p4: I have finished my homework.
  ('s-ax1-p4', 0, 'sl-s-i'),
  ('s-ax1-p4', 1, 'sl-v-have-finished'),
  ('s-ax1-p4', 2, 'sl-o-my-homework'),
  -- ax-1 p5: We will visit the museum tomorrow.
  ('s-ax1-p5', 0, 'sl-s-we'),
  ('s-ax1-p5', 1, 'sl-aux-will'),
  ('s-ax1-p5', 2, 'sl-v-visit'),
  ('s-ax1-p5', 3, 'sl-o-the-museum'),
  ('s-ax1-p5', 4, 'sl-a-tomorrow'),
  -- ax-2 anchor: She doesn't like coffee.
  ('s-ax2-anchor', 0, 'sl-s-she'),
  ('s-ax2-anchor', 1, 'sl-aux-doesnt'),
  ('s-ax2-anchor', 2, 'sl-v-like'),
  ('s-ax2-anchor', 3, 'sl-o-coffee'),
  -- ax-2 p1: I didn't watch TV last night.
  ('s-ax2-p1', 0, 'sl-s-i'),
  ('s-ax2-p1', 1, 'sl-aux-didnt'),
  ('s-ax2-p1', 2, 'sl-v-watch'),
  ('s-ax2-p1', 3, 'sl-o-tv'),
  ('s-ax2-p1', 4, 'sl-a-last-night'),
  -- ax-2 p2: Do they play football?
  ('s-ax2-p2', 0, 'sl-aux-do'),
  ('s-ax2-p2', 1, 'sl-s-they-2'),
  ('s-ax2-p2', 2, 'sl-v-play'),
  ('s-ax2-p2', 3, 'sl-o-football'),
  -- ax-2 p3: Does he speak English?
  ('s-ax2-p3', 0, 'sl-aux-does'),
  ('s-ax2-p3', 1, 'sl-s-he-lower'),
  ('s-ax2-p3', 2, 'sl-v-speak'),
  ('s-ax2-p3', 3, 'sl-o-english'),
  -- ax-2 p4: I do like this song.
  ('s-ax2-p4', 0, 'sl-s-i'),
  ('s-ax2-p4', 1, 'sl-aux-do-emph'),
  ('s-ax2-p4', 2, 'sl-v-like'),
  ('s-ax2-p4', 3, 'sl-o-this-song'),
  -- ax-2 p5: He did finish the work.
  ('s-ax2-p5', 0, 'sl-s-he'),
  ('s-ax2-p5', 1, 'sl-aux-did-emph'),
  ('s-ax2-p5', 2, 'sl-v-finish'),
  ('s-ax2-p5', 3, 'sl-o-the-work');

COMMIT;
