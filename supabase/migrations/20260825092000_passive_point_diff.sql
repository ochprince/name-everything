-- Grammar Everything: 被动语态主知识点与 is thought 挂载点差异化
-- 用户反馈（2026-08-25）：
-- 1. gp-passive（主知识点）= 完整知识 + 用户提供的例句（主语切换 +
--    省略施动者实现客观 + 主动/被动成对例句）
-- 2. is thought 上的 span = 新建子点 gp-passive-form，只强调被动
--    形态识别（be + 过去分词），不再与主知识点重复
-- Author: Hermes Agent, 2026-08-25
BEGIN;

-- 1. 主知识点补全：用户第 7 条完整知识 + 例句
UPDATE grammar_points SET body_zh =
  '主动语态改为被动语态时，句子语法主语会发生切换：主动句主语一般为动作施动者，改为被动后原句受动者成为语法主语，施动者可省略。写作中借助被动实现客观的核心就是省略 by + 施动者，隐匿人为视角。例：Many people think pollution is serious.（主动，语法主语 many people）；Pollution is thought to be serious.（被动，语法主语 pollution，省略施动者 by many people 文风更客观）。例：People should never skip breakfast. Breakfast should never be skipped.'
  WHERE id = 'gp-passive';

-- 2. 新子点：被动谓语形态识别（挂在 is thought 上）
INSERT INTO grammar_points (id, title_zh, body_zh) VALUES
  ('gp-passive-form', '被动谓语 be + 过去分词',
   '被动句的谓语是 be + 过去分词：is thought = is + thought；should be skipped = should + be + skipped。看到 be + done 就是被动谓语，别当一般过去时。');

-- 3. is thought span 改挂新子点（与主知识点差异化）
UPDATE sentence_spans SET grammar_point_id = 'gp-passive-form'
  WHERE id = 'sp-pv-passive';

COMMIT;
