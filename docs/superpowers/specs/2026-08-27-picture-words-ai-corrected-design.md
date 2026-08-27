# picture_words.ai_corrected：人工/AI 替换标记

**日期：** 2026-08-27  
**状态：** 已实现（字段名 `ai_corrected`；范围：库字段 + 文档 + 上传跳过已纠正行）

## 目标

给 `picture_words` 加一个布尔标记，区分「仍是百词斩原始资料」和「已按用户报错替换过图 / 例句 / 例句音频」的行。后续接入文生图与例句 TTS 时，替换完成后把该行写成 `true`。

## 决议

| 项 | 选择 |
|----|------|
| 列名 | `ai_corrected` |
| 类型 | `BOOLEAN NOT NULL DEFAULT false` |
| 现有行 | 全部 `false` |
| 写入时机 | 图 / 例句 / 例句音频替换进表之后设为 `true` |
| 查询 | `WHERE ai_corrected` |
| 索引 | 不建（词量不大） |
| 练习端 | 本轮不拉取、不展示 |

## 落地

- 新 migration：`ALTER TABLE picture_words ADD COLUMN ai_corrected BOOLEAN NOT NULL DEFAULT false;`
- 同步 `supabase/schema.sql`
- `DATABASE.md` 写明字段含义，以及上传脚本会跳过已纠正行
- `scripts/upload-picture-words.mjs`：上传前读出 `ai_corrected = true` 的 `word`，这些行整行跳过（含 `--replace`：不删、不覆盖）

已有 `trg_picture_words_bump_version` 会在 UPDATE 后 bump 版本；本轮不改 trigger。

## 非目标

- 文生图、例句 TTS、按 `asset_reports` 自动替换
- 练习 UI 读取或展示该字段
- 记录替换时间、替换了哪几列、报错 id
