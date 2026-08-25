-- Grammar Everything: passive-1 从 predicate 章移到 subject 章
-- 依据用户反馈（2026-08-25）：
-- 1. 该知识点的教学重心是"主语身份切换"（施动者→受动者），
--    放主语章（subject-5）更贴；语态形态（be+done）是次要信息。
-- 2. "被动实现客观"不作为独立点挂在名词 Pollution 上——语义错位；
--    并入 gp-passive 正文，spans 改挂："Pollution"（受动者主语）
--    与 "is thought"（被动谓语）都挂 gp-passive。
-- Author: Hermes Agent, 2026-08-25
BEGIN;

-- 1. 关卡换章：predicate → subject，排第 5 关
UPDATE levels SET chapter_id = 'subject', sort_order = 5 WHERE id = 'passive-1';

-- 2. 移除挂在名词上的客观点（先删 span 再删 grammar_point，FK RESTRICT）
DELETE FROM sentence_spans WHERE id = 'sp-pv-objective';
DELETE FROM grammar_points WHERE id = 'gp-passive-objective';

-- 3. gp-passive 正文重写：主语视角开头，客观性并入（一卡覆盖第 7 条全部内容）
UPDATE grammar_points SET body_zh =
  '主动句的主语是动作的施动者；变成被动句后，原句的受动者成为语法主语，谓语变为 be + 过去分词。施动者用 by 引出、可省略——省略 by + 施动者，被动句就显得客观，人为视角消失。'
  WHERE id = 'gp-passive';

-- 4. "Pollution"（受动者主语）挂 gp-passive；"is thought"（被动谓语）保持挂 gp-passive
INSERT INTO sentence_spans (id, sentence_id, grammar_point_id, start, "end") VALUES
  ('sp-pv-s', 's-pv-anchor', 'gp-passive', 0, 9);

COMMIT;
