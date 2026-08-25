# Grammar content：按表版本 + IndexedDB 缓存

**日期：** 2026-08-25  
**状态：** 已实现（客户端缓存 + migration 待部署）

## 目标

- 启动时优先用 IndexedDB 缓存组装 pack，尽快进 App
- 后台拉取 `content_table_versions`；仅重拉 version 变化的表
- 静默写回缓存并 `setGrammarPack` / `setGameTuning`（进行中的一局可继续持有旧引用）
- Migration 写入 `produce_answer_ratio` / `produce_fall_duration_factor`；内容表变更由 trigger 自动 bump 版本

## 决议

| 项 | 选择 |
|----|------|
| 版本来源 | `content_table_versions` + AFTER INSERT/UPDATE/DELETE trigger |
| 本地存储 | IndexedDB |
| 启动策略 | 有缓存先用；后台校验更新（stale-while-revalidate） |
| 热更新 | 静默更新内存 pack；不打断当前局 |
| Tuning 新 key | SQL migration upsert |

## 纳入版本的表

`chapters`, `grammar_points`, `levels`, `sentences`, `sentence_spans`, `slots`, `sentence_slot_refs`, `game_tuning`

`slots` 与 `sentence_slot_refs` 分表缓存；任一方变更后本地重新 `resolveSentenceSlots`。

## 非目标

- 行级增量 / tombstone
- 更新提示 UI
- 离线编辑内容
