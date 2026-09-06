# AI 文生文底层模块

**日期：** 2026-09-06  
**状态：** 待实现

## 目标

在不把千问 Key 放进 GitHub Pages 的前提下，提供可复用的文生文调用。浏览器是调用方/消费者，VPS 上的 worker 是被调用方/生产者，Supabase 只做通信队列。本期交底层（队列表 + worker + `completeText()`）以及「我的」里一枚设备码复制，供管理员写入白名单后开通 AI。不接语法中阶判定、问答、场景挑战，不提供 AI 对话入口。

同一套任务协议预留 `image` / `tts`，本期遇之立即失败，接口形状以后不改。

## 决议

| 项 | 选择 |
|----|------|
| 调用方 | GitHub Pages 浏览器（anon / publishable key） |
| 生产者 | 自管主机上的常驻 worker，不对外开 HTTP、不需要域名和证书 |
| 通道 | 表 `ai_jobs` + public Realtime Broadcast + RPC 读单行 |
| 结果 | 整段写回，不流式 |
| 登录 | 不上。控量在 worker，限额全部可配置 |
| 开通 | 用户在「我的」复制设备码发给管理员；管理员写入 `AI_QUOTA_ALLOW_DEVICE_IDS` 并重启 worker |
| 频道 | public，名 `ai-job:{jobId}`。任务 UUID 即读票 |
| 默认模型 | `qwen3.8-flash`；`reasoning.effort = none` |
| 前端 API | `completeText({ input, instructions?, deviceId, timeoutMs? })` |
| App UI | 「我的」仅设备码复制，无 AI 对话入口 |

## 非目标

- 中阶造句判定、章节问答、场景挑战玩法
- 文生图、TTS 的真实调用
- Supabase Auth / 匿名登录 / private 频道
- 改 `asset_reports` 的远程 INSERT
- 多轮 `previous_response_id`、思考链展示、function calling
- 给 VPS 配域名、证书、反代

## 链路

```
completeText()
  → INSERT ai_jobs (id 客户端生成, status=queued)
  → 订阅 public 频道 ai-job:{id}
  → 并行：300ms 调 get_ai_job(id)
                                 worker 每 ~200ms claim_ai_job()
                                 限流 → 千问 Responses API（整段，超时 ~12s）
                                 UPDATE completed|failed|rejected
                                 Broadcast event=done
  ← 先到者：广播 或 RPC；15s 仍无则超时
```

秒级来自：领取轮询 ≤200ms + 千问 1–3s + 一条广播。时间主要在模型，不在队列。

## 表 `ai_jobs`

| 列 | 类型 | 约束 |
|----|------|------|
| `id` | UUID | PK，客户端生成 |
| `capability` | TEXT | `text` \| `image` \| `tts` |
| `status` | TEXT | `queued` \| `running` \| `completed` \| `failed` \| `rejected` |
| `device_id` | TEXT | NOT NULL，本机 UUID，限流用 |
| `input` | JSONB | NOT NULL，见下 |
| `output` | JSONB | 成功才有 |
| `error` | TEXT | 失败/拒绝原因 |
| `created_at` | TIMESTAMPTZ | DEFAULT now() |
| `claimed_at` | TIMESTAMPTZ | 领取时写入 |
| `completed_at` | TIMESTAMPTZ | 终态时写入 |

`input`（`capability = text`）：

```json
{
  "instructions": "可选系统指令",
  "input": "用户文本，或 Responses 风格消息数组",
  "model": "可选覆盖，默认 qwen3.8-flash",
  "temperature": 0.2,
  "max_output_tokens": 512
}
```

`output`：

```json
{
  "text": "模型正文",
  "model": "实际模型",
  "usage": { "input_tokens": 0, "output_tokens": 0, "total_tokens": 0 }
}
```

INSERT 时 `input` 序列化后超过 32KiB 的任务，worker 标 `rejected`（`input_too_large`），不打模型。

终态行保留 7 天，worker 循环里删除更旧的 `completed` / `failed` / `rejected`。

## 权限与 RPC

anon key 会出现在 Pages 包里。安全靠 GRANT + RLS，不靠藏 key。

- anon：**INSERT only**，且 `status = 'queued'`、`output IS NULL`、`error IS NULL`、`claimed_at IS NULL`、`completed_at IS NULL`
- anon：**不能 SELECT**（禁止 `select * from ai_jobs`）
- `get_ai_job(p_id uuid) RETURNS ai_jobs`：`SECURITY DEFINER`，`GRANT EXECUTE TO anon`。知道 id 才能读一行
- `claim_ai_job() RETURNS ai_jobs`：`SECURITY DEFINER`，无行可领时返回 NULL。`FOR UPDATE SKIP LOCKED` 取最早 `queued`，标 `running`。`REVOKE` public/anon/authenticated，只 `GRANT EXECUTE` 给 `service_role`
- worker 用 **service role** UPDATE 终态、维护 `ai_quota_devices`，并往 public 频道发广播
- `ai_quota_devices`：anon 无任何权限

Realtime：public 频道，不登录可订。频道名含 UUID，与 `get_ai_job(id)` 同一把钥匙。漏订或刷新靠 RPC 回退。

## 前端模块

路径：`src/ai/`（与 `src/lib/supabase.ts` 并列的横切能力，不属于某个练习 feature）。

| 文件 | 职责 |
|------|------|
| `types.ts` | 任务协议、capability、status、input/output。worker 可复用 |
| `deviceId.ts` | `localStorage` 持久化 UUID；没有则创建 |
| `client.ts` | `completeText()`：insert → 广播 + 300ms RPC → 15s 超时 |

`completeText` 行为：

1. 需要已配置 `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY`，否则抛错
2. 生成 `id`，INSERT `capability: 'text'`
3. 订阅 `ai-job:{id}` 事件 `done`；同时每 300ms `rpc('get_ai_job')`
4. 收到 `completed` 则返回 `{ id, text, usage, model }`
5. `failed` / `rejected` 抛错，带 `error` 文案
6. 15s 内无终态：退订并抛超时。库里任务可能稍后完成，客户端不再读

默认 `timeoutMs = 15_000`。不在本期接到任何页面或路由。

## VPS worker

路径：`ai-worker/`。Node + TypeScript，和前端共用 `src/ai/types.ts`。依赖官方 `openai` SDK，走千问 OpenAI 兼容 Responses API：

- `baseURL`: `https://dashscope.aliyuncs.com/compatible-mode/v1`
- `apiKey`: 环境变量 `DASHSCOPE_API_KEY`
- `client.responses.create({ model, input, instructions, reasoning: { effort: 'none' }, store: false })`
- 取 `output_text`（或从 `output` 里 `type=message` 的文本拼接）

机器：自管 VPS / 服务器。**不监听端口**。出站 HTTPS 到 Supabase 与 DashScope。

进程：`systemd` 单元 `name-everything-ai-worker`。密钥在服务器环境文件（如 `/etc/name-everything/ai-worker.env`），不进 Git、不加 `VITE_` 前缀、不进 GitHub Pages Secrets。

实现时 SSH 看机器上已有 Node / git 布局，再落 unit 文件。部署：仓库 pull → 安装依赖 → `systemctl restart name-everything-ai-worker`。

循环（单进程即可）：

1. 删除 7 天前的终态行
2. 将 `running` 且 `claimed_at` 超过 30s 的行标 `failed`（`worker_stale`）并广播
3. `claim_ai_job()`；空则等 ~200ms
4. `image` / `tts` → `failed` / `unsupported_capability`，广播
5. 限额不通过 → `rejected`（`quota_users` / `quota_daily` / `rate_limited`），广播，不打模型
6. `input` 过大 → `rejected` / `input_too_large`
7. 调千问，硬超时 12s；429/5xx 再试 1 次
8. 成功 `completed` + `output`；失败 `failed` + `error`
9. 广播 event `done`，payload 为 `{ id, status, text?, error? }`（成功带 `text`，失败带 `error`）。单条远小于免费版 256KB。前端订到即可结束等待；RPC 只用于漏听或刷新。

## 限额（worker，调模型前）

限额只存在 worker 配置里（VPS 环境文件），前端不可信、也不下发。无登录时「用户」= `device_id`。改配额只改配置并重启 worker，不改表、不改 Pages。

配置项与默认值：

| 配置 | 环境变量 | 默认 | 含义 |
|------|----------|------|------|
| `maxUsers` | `AI_QUOTA_MAX_USERS` | `20` | 允许多少个不同用户。`0` = 不限制人数 |
| `allowDeviceIds` | `AI_QUOTA_ALLOW_DEVICE_IDS` | 空 | 逗号分隔白名单。非空时只放行这些 `device_id`，不再用先到先占 |
| `perUserPerDay` | `AI_QUOTA_PER_USER_PER_DAY` | `50` | 每用户每天（UTC）可调用次数。`0` = 不限制 |
| `perUserPerMinute` | `AI_QUOTA_PER_USER_PER_MINUTE` | `20` | 每用户每 60s，防连点。`0` = 不限制 |
| `globalPerMinute` | `AI_QUOTA_GLOBAL_PER_MINUTE` | `60` | 全站每 60s。`0` = 不限制 |

**生产开通走白名单。** `allowDeviceIds` 非空时只放行名单内设备，忽略先到先占。空名单时仍可用 `maxUsers` 先到先占（方便本地冒烟）。正式给学习者用时应配置白名单，避免路人占名额。

占用名额：先到先占。表 `ai_quota_devices`（`device_id` PK、`first_seen_at`）由 worker 在领取后、调模型前写入。终态任务 7 天清理**不影响**名额。有白名单时不写占用逻辑，只校验 id 在名单内。

判定顺序：白名单或不在 `maxUsers` 内 → 日限额 → 每分钟（用户 / 全局）。次数按 `ai_jobs.created_at` 计窗口内全部已入库行（含随后 `rejected` 的），避免连插绕过。

超额一律 `rejected`，`error` 为：

| 原因 | `error` |
|------|---------|
| 不在白名单，或人数已满 | `quota_users` |
| 超过每天次数 | `quota_daily` |
| 超过每分钟（用户或全局） | `rate_limited` |

`device_id` 可伪造，接受这个代价以保持打开即练。人数上限 + 全局限额兜底烧钱。

## 「我的」设备码

- 位置：节奏设置下方、语法报错上方。
- 文案：标题「设备码」；一行说明「发给管理员以开通 AI」。
- 控件：复制按钮（成功后短暂变成「已复制」）。剪贴板写入完整 `device_id`（`getOrCreateDeviceId()`，进页即生成并持久化）。
- 展示：可截断显示，复制的必须是完整 UUID。
- 复制实现与语法报错相同（`clipboard.writeText`，失败则隐藏 textarea + `execCommand`）。
- 清站点数据后设备码会变，需重新发给管理员。

## 超时

| 角色 | 时限 | 结果 |
|------|------|------|
| 前端 | 15s | `completeText` 抛超时 |
| 千问调用 | 12s | 行 `failed` / `model_timeout`，广播 |
| `running` 无心跳 | 30s | `failed` / `worker_stale` |

## 测试

- `src/ai/client.test.ts`：INSERT 形状；广播先到则返回；只有 RPC 也能返回；`failed`/`rejected`/超时抛错
- `ai-worker` 单测（mock 千问与 Supabase）：人数上限、白名单、日限额、每分钟限流、`unsupported_capability`、僵尸 `running`、成功写回
- `src/pages/MePage.test.tsx`：有「设备码」；点复制后剪贴板为完整 id
- 真机验收（实现末）：本机或 VPS 插一条 `text` 任务，秒级看到 `completed`；「我的」可复制设备码

## 文档（实现时改，不另开范围）

- `DATABASE.md`：`ai_jobs`、`ai_quota_devices`、两条 RPC、anon 只能插 `ai_jobs`
- `.env.example`：注明 worker 密钥与限额只在 VPS，Pages 不新增 Vite 变量
- `MANIFEST.md` / `README.md`：「我的」增加设备码复制（开通 AI 用）

## 错误码（`error` 文本，稳定可测）

`quota_users` | `quota_daily` | `rate_limited` | `input_too_large` | `unsupported_capability` | `model_timeout` | `model_error` | `worker_stale`
