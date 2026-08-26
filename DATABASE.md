# 数据库与备份

词库和语法课存在线上的 Supabase 数据库。打开应用后从那里拉取。

- **表结构**以 `supabase/schema.sql` 为准。
- **不要**在仓库里再放一份内容种子（没有 `supabase/seed.sql`），也**不要**把成千上万行数据写进 migration。词汇用上传脚本写入远程表；语法课包写成 `supabase/migrations/` 下的新 SQL。

## 有哪些表

- **语法：** `chapters`、`grammar_points`、`levels`、`sentences`、`sentence_spans`、`slots`、`sentence_slot_refs`、`game_tuning`
- **词汇：** `picture_words`
- **报错：** `asset_reports`。用户在语法或词汇练习里提交报错时，本机一定会记下，「我的」可复制或下载。配了读库用的 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_PUBLISHABLE_KEY` 时，会同时写入此表。

## 应用怎么读

应用走 Data API，并用 IndexedDB 按表缓存：首次全量拉取后，之后只重拉 `content_table_versions` 有变化的表（内容写入时由 DB trigger bump 版本）。

## 不进库的数据

词汇练习进度（strong / warm / forgot / 批次 offset）只存在浏览器。「我的挑战」里收藏的例句和最近几次挑战记录也只存在本机。

## 表结构 / DDL

在 `supabase/migrations/` 新增 SQL，并同步 `supabase/schema.sql`，push 到 `main` 后由 GitHub 关联的 Supabase 应用。不要改已经应用过的 migration。

## 语法课包行数据

写成 `supabase/migrations/` 下的新 SQL（见 `.cursor/skills/grammar-content-pack`），push 后应用。校验：

```bash
npm run grammar:validate
npm run grammar:coverage
```

## 词汇记忆行数据（CET4）

不走 migration。远程已有 `picture_words` 表之后，从同级目录 `my_app`（`assets/data/words/cet4-all`）上传：

1. 复制 `.env.example` → `.env.local`（真实值勿提交）。
2. 应用读库：`VITE_SUPABASE_URL`、`VITE_SUPABASE_PUBLISHABLE_KEY`（Dashboard → **Project Settings → API** → publishable / anon）。
3. 仅上传脚本需要：`SUPABASE_SERVICE_ROLE_KEY`（同一页 → **service_role**）。不要加 `VITE`_ 前缀，不要放进 GitHub Pages Secrets，不要 commit。
4. 执行：

```bash
npm run pictures:upload
# 需要重建乱序 / 全量覆盖时：
npm run pictures:upload -- --replace
```

脚本只写入媒体文件名，CDN 前缀由前端拼接。可用 `PICTURE_WORDS_SOURCE_DIR` 覆盖源目录。源 JSON 变更后重新上传；表结构变更仍走 migration + GitHub。

另设 `SUPABASE_PROJECT_REF` 供 CLI link / dump。GitHub Pages 构建只需仓库 Secrets 中的 Vite 变量（见 `deploy-pages.yml`）。`SUPABASE_DB_PASSWORD` 只给 Supabase CLI / `psql` dump：写在 shell 或 `.env.local`，不要用 `VITE_*`。

## Free 套餐备份

Pro 及以上由平台每日自动备份。Free 没有，需要本机 dump。CLI 用 `npx supabase`（不必全局安装）。`db dump` 会起 Docker 跑 `pg_dump`，先打开 Docker Desktop。先在 shell 加载 `.env.local`（bash：`set -a && source .env.local && set +a`），以便使用 `$SUPABASE_PROJECT_REF`。

一次配置：

```bash
npx supabase login
npx supabase link --project-ref "$SUPABASE_PROJECT_REF"
```

密码在 Dashboard：**Project Settings → Database**。然后：

```bash
export SUPABASE_DB_PASSWORD='YOUR_DATABASE_PASSWORD'

npx supabase db dump --linked -f supabase/backups/schema.YYYYMMDD.sql
npx supabase db dump --linked --data-only -f supabase/backups/data.YYYYMMDD.sql
```

默认 dump **不含行数据**；语法课包与 `picture_words` 必须加 `--data-only`。文件写在 `supabase/backups/`（已 gitignore），不要 commit dump，也不要提交任何 key / 密码。完整快照从这些 dump 或（升级套餐后的）平台备份恢复，不要再造一份 `seed.sql`。