-- 图片词条中文释义里的转义残留还原（用户报错 b687bb39：check 卡片显示「支票（\u003dcheque）」）
-- 源数据（百词斩导出）把 = < > 写成了字面量 \u003d / \u003c / \u003e，入库时未解码。
-- 命中 12 条词：check favor theater laboratory mathematics wireless apartment
--              inspector thumb gasoline petrol primary
--   \u003d → =   （词典「同 / 缩写」记号：支票（=cheque）、实验室（=lab））
--   \u003c \u003e → 【 】（与库内既有的【化学】【律】【计算机】等标记统一）
BEGIN;

UPDATE picture_words
SET mean_cn = replace(
                replace(
                  replace(mean_cn, '\u003d', '='),
                  '\u003c', '【'),
                '\u003e', '】')
WHERE position('\u00' in mean_cn) > 0;

COMMIT;
