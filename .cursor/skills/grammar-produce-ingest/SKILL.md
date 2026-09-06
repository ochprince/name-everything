---
name: grammar-produce-ingest
description: >-
  Ingest learner AI-passed grammar produce candidates (exported
  grammar-produce-candidates.json or pasted rows with en/zh/level_id) into
  Grammar Everything via SQL migrations. Use when reviewing 造句候选 / produce
  candidates for admin入库 — not for fixing existing rows (grammar-content-fix)
  or authoring a new knowledge point from scratch (grammar-content-pack).
---

# Grammar Produce Ingest

把**举一反三合格造句候选**审过后，补全课包结构（spans / slots / distractors），写成 Supabase migration 挂进目标 `level_id`。

**Announce at start:** "I'm using the grammar-produce-ingest skill."

Staging 表 `grammar_produce_candidates` 仅防丢归档；**不要** UPDATE accepted/rejected。正式题库只靠 migration。

## 与其它 skill 的分工

| Skill | 何时 |
|-------|------|
| **本 skill** | 候选 `en`/`zh`/`level_id` → 新 playable 句入库 |
| [grammar-content-fix](../grammar-content-fix/SKILL.md) | 修已有句子 / 干扰项 / span |
| [grammar-content-pack](../grammar-content-pack/SKILL.md) | 从知识点新建知识点 / 关卡 |

表形状以 `supabase/schema.sql` 为准。环境要求与 content-pack 相同（`.env.local` 读库校验、migration 部署）。

## 输入

- 「我的 → 造句候选」导出的 `grammar-produce-candidates.json`
- 或粘贴若干条：`{ id?, level_id, en, zh, created_at?, level_title? }`

## 流程

1. 去重 / 拒垃圾（非目标语法、不自然、过短、与关卡 anchor 过近复制）
2. 确认目标 `level_id` 存在；默认把通过句加为该关 **playable**（`kind = playable`）
3. 为每句设计 `sentence_spans`、挖空 `slots` + `sentence_slot_refs`（质量门同 content-pack）
4. 写**新** migration（不改已应用 migration）
5. `npm run grammar:validate`（及需要时 coverage）
6. 部署 migration（`supabase db push` 或 GitHub 集成）

## 导出字段备忘

| 字段 | 含义 |
|------|------|
| `en` / `zh` | 两列文本，已是 AI 判过的英文 + 中文 |
| `level_id` | 来源关卡 |
| `level_title` | 导出时 enrichment，可选 |

不自动写入 `sentences`；浏览器不能 INSERT 题库表。
