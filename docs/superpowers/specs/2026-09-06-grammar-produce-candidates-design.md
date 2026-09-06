# 举一反三：造句候选资产与人工审核

## 目标

AI 判定合格的造句沉淀为**候选资产**（非正式题库），本机可导出给管理员；管理员用 Skill 补结构后以 migration 入库。正式 `sentences` / slots 仍只读课包。

## 决议

| 项 | 选择 |
|----|------|
| 粒度 | `en` + `zh` + `level_id`（两列文本，非 JSON 糊一块） |
| 本机 | `grammar/produce-candidates/v1`，「我的」复制 / 下载 / 清空 |
| 远程 | `grammar_produce_candidates` anon 仅 INSERT；无 status |
| 中文 | 与判定同轮 AI 产出 |
| 审核 | Skill 吃导出 JSON / 粘贴；staging 只防丢，不回写状态 |

## 数据

**本机条目：** `id`, `level_id`, `en`, `zh`, `created_at`

**表 `grammar_produce_candidates`：** 同上 + 可选 `device_id`；RLS 仅 INSERT。

**API：** `recordProduceCandidate({ levelId, en, zh, deviceId? })` — 本机必写；已配 Supabase 则 best-effort INSERT。

## 「我的」

与语法报错并列：条数、复制、下载 `grammar-produce-candidates.json`、清空。导出可 enrichment 关卡标题（只读 pack）。

## Skill

`grammar-produce-ingest`：输入候选 → 审质量 → 补 span/slots → migration 挂到目标 level。不 UPDATE staging。

## 接线

关卡末题门闩见 `2026-09-06-grammar-produce-gate-design.md`；判定合格后调用 `recordProduceCandidate`。
