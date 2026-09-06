# AI Worker

Name Everything 的 AI 任务队列 **生产者**。

静态前端（如 GitHub Pages）不能持有模型厂商密钥。本进程跑在你自管的机器上：从 Supabase 领取任务 → 按 `capability` 执行 → 写回结果并通知等待中的客户端。浏览器只负责入队与等待（当前入口是 `completeText()`；文生图 / 语音等可复用同一协议）。

## 为什么需要它

| 角色 | 位置 | 职责 |
|------|------|------|
| 消费者 | 浏览器（anon / publishable key） | `INSERT` 进 `ai_jobs`；用 Realtime Broadcast + `get_ai_job` 等待 |
| 生产者 | 本 worker（service role） | `claim_ai_job` → 限额 → 调厂商 API → `UPDATE` + Broadcast |
| 队列 | Supabase `ai_jobs` | 统一任务形态：`capability`、`input`、`output`、`status` |

适合：SPA 没有可信后端，或跑模型的机器没有对外 HTTPS。结果整段写回（不流式），客户端更简单，也更贴合 Realtime 免费额度。

## 能力（`capability`）

| 值 | 状态 | 说明 |
|----|------|------|
| `text` | 已实现 | DashScope OpenAI 兼容 Responses API |
| `image` | 占位 | 入队后标 `unsupported_capability` |
| `tts` | 占位 | 同上 |

新增能力：扩展 `src/ai/` 下的共享类型与 `input`/`output`，在领取循环里加分支即可；队列表与客户端等待路径可保持不变。

## 前端对接（文生文）

推荐只走仓库里的客户端封装，不要自己拼 INSERT / 轮询，除非你在写新能力或调试。

### 前置条件

1. Supabase 已应用 `ai_jobs` 与 `app_config` 相关 migration（见 `supabase/migrations/`、`DATABASE.md`）。
2. 前端 `.env.local` 有 `VITE_SUPABASE_URL`、`VITE_SUPABASE_PUBLISHABLE_KEY`（与 worker 同一项目）。
3. 本 worker 已启动，且配置了 `SUPABASE_*`、`DASHSCOPE_API_KEY`。
4. 调用方的 `deviceId` 已写入 `app_config` 键 `ai.allow_device_ids`（见下文「开通设备」）。

### 调用方式

入口：`src/ai/client.ts` 的 `completeText()`。设备码：`getOrCreateDeviceId()`。**门闩：** `isAiAllowed(deviceId)`（`src/ai/allowance.ts` → RPC `ai_is_allowed`）。

实现任何 AI UI / 流程时：

1. `const ok = await isAiAllowed(deviceId)`；`ok === false` → **不渲染**该能力，走非 AI 主流程。
2. 仅在 `ok` 时调用 `completeText`（函数内部也会再检查，未开通直接 `AiJobError('quota_users')`，避免白入队）。

```ts
import { completeText, AiJobError } from '../ai/client'
import { isAiAllowed } from '../ai/allowance'
import { getOrCreateDeviceId } from '../ai/deviceId'

const deviceId = getOrCreateDeviceId()
if (!(await isAiAllowed(deviceId))) {
  // 隐藏 AI 能力
} else {
  try {
    const result = await completeText({
      deviceId,
      instructions: '只输出一句英文，不要解释',
      input: '用英语说：今天天气不错',
    })
    console.log(result.text)
  } catch (e) {
    if (e instanceof AiJobError) {
      // e.code：quota_users、quota_daily、rate_limited、model_error、timeout …
    }
    throw e
  }
}
```

`completeText` 内部顺序：

1. `isAiAllowed`；未开通 → 抛 `quota_users`（不 INSERT）。
2. 生成 job `id`，`INSERT` 进 `ai_jobs`。
3. 订阅 Realtime Broadcast `ai-job:{id}` 事件 `done`。
4. 每 300ms `get_ai_job(p_id)` 回退。
5. 终态或 15s `timeout`。

### 与 UI 的约定

- App **没有**通用 AI 对话页；新功能在练习 / 挑战等流程里按门闩接入。
- 「我的 → 设备码」始终显示，并标 **已开通 / 未开通**。
- 不要把 service role 或厂商 Key 写进前端。

### 开通设备

允许名单在通用表 `app_config`，键 `ai.allow_device_ids`（JSON 字符串数组）。空数组 = 无人可用。worker 每轮领取前从库刷新，改名单**不必重启**。

```sql
-- 追加一台设备（把 <device-uuid> 换成「我的」复制的码）
UPDATE app_config
SET value = value || jsonb_build_array('<device-uuid>'),
    updated_at = now()
WHERE key = 'ai.allow_device_ids'
  AND NOT (value @> jsonb_build_array('<device-uuid>'));
```

### 手动入队（调试）

| 列 | 示例 |
|----|------|
| `id` | `crypto.randomUUID()` |
| `capability` | `'text'` |
| `status` | `'queued'` |
| `device_id` | 已在 `ai.allow_device_ids` 中的 id |
| `input` | `{ "input": "…", "instructions": "…" }` |

### 验收

```bash
npx tsx scripts/ai-text-smoke.ts
```

脚本会用 service role 临时写入一个 **`smoke.` + 高熵 hex** 设备码（非 UUID、难猜），测完再从名单移除。需 `.env.local` 含 `SUPABASE_SERVICE_ROLE_KEY`，且 worker 在跑。应打印 `text: pong`。

## 环境要求

- Node.js 20+
- 已应用 `ai_jobs` 相关 migration 的 Supabase 项目（见 `supabase/migrations/`）
- 你启用的能力所对应的厂商密钥（当前 `text` 使用 DashScope）
- 一台能出站访问 Supabase 与厂商 API 的常驻主机（VPS、家里机器、容器等）

切勿把 `SUPABASE_SERVICE_ROLE_KEY` 或厂商密钥放进 Vite / GitHub Pages Secrets。

## 配置

复制 [`env.example`](./env.example) 到**仓库外**的环境文件（或已被 ignore 的本地路径），填入真实值，并由进程管理器加载。建议权限 `600`。

| 变量 | 含义 |
|------|------|
| `SUPABASE_URL` | 与 Web 应用同一项目的 URL |
| `SUPABASE_SERVICE_ROLE_KEY` | service role（绕过 RLS，仅服务端） |
| `DASHSCOPE_API_KEY` | 当前 `text` 能力的密钥（其它厂商另增变量） |
| `AI_QUOTA_PER_USER_PER_DAY` | 每设备每天上限（UTC）。`0` = 不限 |
| `AI_QUOTA_PER_USER_PER_MINUTE` | 每设备每分钟上限。`0` = 不限 |
| `AI_QUOTA_GLOBAL_PER_MINUTE` | 全站每分钟上限。`0` = 不限 |

设备准入不在环境变量里，而在 `app_config.ai.allow_device_ids`（见上文「开通设备」）。改名单无需重启 worker。日/分钟限额改 env 后需 `systemctl restart`。

## 本地开发

在仓库根目录，导出上述环境变量后：

```bash
npm install
npm run ai-worker
```

单测：

```bash
npx vitest run ai-worker src/ai
```

## 部署示例（systemd）

主机与路径由你自定。本目录的 unit 文件是模板，安装前请改 `WorkingDirectory`、`EnvironmentFile`、`ExecStart`。

```bash
# 在 worker 主机上
git clone <本仓库> /path/to/name-everything
cd /path/to/name-everything
npm ci

mkdir -p /etc/name-everything
cp ai-worker/env.example /etc/name-everything/ai-worker.env
chmod 600 /etc/name-everything/ai-worker.env
# 编辑密钥与数字限额

cp ai-worker/name-everything-ai-worker.service /etc/systemd/system/
# 按实际路径修改 unit
systemctl daemon-reload
systemctl enable --now name-everything-ai-worker
```

更新代码：

```bash
cd /path/to/name-everything
git pull --ff-only
npm ci
systemctl daemon-reload
systemctl restart name-everything-ai-worker
```

只改数字限额：

```bash
# 编辑 EnvironmentFile 后
systemctl restart name-everything-ai-worker
```

常用命令：

```bash
systemctl status name-everything-ai-worker --no-pager
journalctl -u name-everything-ai-worker -n 80 --no-pager
journalctl -u name-everything-ai-worker -f
```

## 冒烟测试

`.env.local` 需含 `VITE_SUPABASE_*` 与 `SUPABASE_SERVICE_ROLE_KEY`，worker 在跑：

```bash
npx tsx scripts/ai-text-smoke.ts
```

脚本临时写入 `smoke.<高熵>` 到允许名单，测完移除。应出现 `text: pong`。

## 任务错误码

写入 `ai_jobs.error`：

`quota_users` · `quota_daily` · `rate_limited` · `input_too_large` · `unsupported_capability` · `model_timeout` · `model_error` · `worker_stale`

## 安全说明

- publishable / anon key 本就会出现在前端；靠 RLS 限制客户端只能 INSERT、不能列表；`ai_is_allowed` 只返回 boolean。
- service role 与厂商密钥只留在 worker / 冒烟脚本环境，绝不提交进 Git。
- `device_id` 不是强身份；用 `app_config` 名单与全局限额控制滥用。
