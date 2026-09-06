# AI Worker（文生文生产者）

GitHub Pages 不能持有千问 Key。本目录是跑在阿里云 VPS 上的常驻进程：从 Supabase 队列领取任务 → 调 DashScope Responses API → 把结果写回并广播。浏览器侧只负责 `completeText()` 入队与等待。

## 目的

| 角色 | 位置 | 做什么 |
|------|------|--------|
| 调用方 / 消费者 | GitHub Pages | INSERT `ai_jobs`，订 Realtime / RPC 等结果 |
| 生产者 | 本 worker（VPS） | `claim_ai_job` → 限额 → 千问 → UPDATE + Broadcast |
| 队列 | Supabase | 无域名证书时的通信通道 |

本期只实现 `capability = text`。`image` / `tts` 会标 `unsupported_capability`。

## 配置

密钥与限额只在 VPS：`/etc/name-everything/ai-worker.env`（权限建议 `600`）。模板见同目录 `env.example`。

| 变量 | 含义 |
|------|------|
| `SUPABASE_URL` | 与 Pages 同一项目 URL |
| `SUPABASE_SERVICE_ROLE_KEY` | service role（绕过 RLS，仅本机） |
| `DASHSCOPE_API_KEY` | 千问 / 百炼 API Key |
| `AI_QUOTA_MAX_USERS` | 先到先占人数上限；`0` = 不限。有白名单时忽略 |
| `AI_QUOTA_ALLOW_DEVICE_IDS` | **逗号分隔**的设备码白名单。非空则只放行名单内 id |
| `AI_QUOTA_PER_USER_PER_DAY` | 每设备每天次数（UTC）；`0` = 不限 |
| `AI_QUOTA_PER_USER_PER_MINUTE` | 每设备每分钟；`0` = 不限 |
| `AI_QUOTA_GLOBAL_PER_MINUTE` | 全站每分钟；`0` = 不限 |

白名单示例：

```bash
AI_QUOTA_ALLOW_DEVICE_IDS=aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee,ffffffff-1111-4222-8333-444444444444
```

用户在 App「我的 → 设备码」复制后发给你，你追加进该变量并重启服务。

## 本机开发

```bash
# 在仓库根目录，环境变量已导出或写在 shell 里
npm run ai-worker
```

需要已应用的 `ai_jobs` migration，以及上述三个密钥。

## VPS 部署（当前约定）

- 主机：`ssh aliyun`（`<worker-host>`）
- 代码：`/opt/name-everything`
- 环境：`/etc/name-everything/ai-worker.env`
- 单元：`name-everything-ai-worker.service`

更新代码并重启：

```bash
ssh aliyun
cd /opt/name-everything
git pull --ff-only origin main
npm ci
systemctl daemon-reload
systemctl restart name-everything-ai-worker
```

改限额 / 白名单后只需：

```bash
nano /etc/name-everything/ai-worker.env
systemctl restart name-everything-ai-worker
```

## 常用命令

```bash
# 状态
systemctl status name-everything-ai-worker --no-pager

# 最近日志
journalctl -u name-everything-ai-worker -n 80 --no-pager

# 跟踪日志
journalctl -u name-everything-ai-worker -f

# 启停
systemctl start name-everything-ai-worker
systemctl stop name-everything-ai-worker
systemctl restart name-everything-ai-worker
```

## 验收

本机（配好 `.env.local` 的 Vite Supabase 变量，且 worker 已在跑）：

```bash
npx tsx scripts/ai-text-smoke.ts
```

数秒内应打印非空 `text:`。若 `quota_users`，检查白名单是否包含 smoke 用的 `device_id`（可用 `AI_SMOKE_DEVICE_ID` 指定）。

## 错误码（写在 `ai_jobs.error`）

`quota_users` | `quota_daily` | `rate_limited` | `input_too_large` | `unsupported_capability` | `model_timeout` | `model_error` | `worker_stale`
