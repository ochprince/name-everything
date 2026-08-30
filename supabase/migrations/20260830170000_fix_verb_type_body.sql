-- Fix 报错 d2399ce8: gp-verb-type body 去掉末尾衔接句
-- 「系动词、情态动词、助动词见后文。」（用户要求）
-- Author: Hermes Agent, 2026-08-30
BEGIN;

UPDATE grammar_points
SET body_zh = '实义动词分及物和不及物：及物动词后直接接宾语（I love music. 我喜欢音乐）；不及物动词必须加介词才能接宾语（I listen to music. 我听音乐，✗ I listen music）。'
WHERE id = 'gp-verb-type';

COMMIT;
