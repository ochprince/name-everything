-- Grammar Everything: to be serious 增加主语补足语知识点
-- 用户反馈（2026-08-25）：
-- to be serious 是不定式作主语补足语；来源是主动句的宾语补足语在
-- 变被动后转成主语补足语；整句属主系表结构（S+V+C）。
-- 同区间 [21,34) 新增 span：点击 to be serious 会同时展示
-- 「不定式 to do」+「主语补足语」两张卡片（pointsForRange 聚合同区间）。
-- Author: Hermes Agent, 2026-08-25
BEGIN;

-- 1. 新知识点：主语补足语
INSERT INTO grammar_points (id, title_zh, body_zh) VALUES
  ('gp-subject-complement', '主语补足语',
   '被动句里补充说明主语（受动者）的成分，这里由不定式 to be serious 充当。来源：主动句 Many people think pollution (to be) serious 中，serious 是宾语补足语；变成被动后宾语变主语，宾语补足语随之转为主语补足语。整句 Pollution is thought to be serious. 属主系表结构（S+V+C）。');

-- 2. to be serious [21,34) 增加主语补足语 span（保留原不定式 span）
INSERT INTO sentence_spans (id, sentence_id, grammar_point_id, start, "end") VALUES
  ('sp-pv-subjcomp', 's-pv-anchor', 'gp-subject-complement', 21, 34);

COMMIT;
