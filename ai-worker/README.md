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
| `AI_QUOTA_MAX_USERS` | 不同 `device_id` 数量上限（先到先占）。`0` = 不限。有白名单时忽略 |
| `AI_QUOTA_ALLOW_DEVICE_IDS` | **逗号分隔**的设备白名单。非空则只放行名单内 id |
| `AI_QUOTA_PER_USER_PER_DAY` | 每设备每天上限（UTC）。`0` = 不限 |
| `AI_QUOTA_PER_USER_PER_MINUTE` | 每设备每分钟上限。`0` = 不限 |
| `AI_QUOTA_GLOBAL_PER_MINUTE` | 全站每分钟上限。`0` = 不限 |

白名单示例：

```bash
AI_QUOTA_ALLOW_DEVICE_IDS=<device-uuid-1>,<device-uuid-2>
```

学习者在应用「我的 → 设备码」复制编号；运营者写入白名单后重启 worker。限额按设备统计，与具体 `capability` 无关。

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
# 编辑密钥与限额

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

只改限额 / 白名单：

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

`.env.local` 已配置 Web 端 publishable Supabase 变量，且 worker 在跑时：

```bash
npx tsx scripts/ai-text-smoke.ts
```

数秒内应出现非空 `text:`。若为 `quota_users`，多半是 smoke 用的 `device_id` 不在白名单（可用 `AI_SMOKE_DEVICE_ID` 覆盖）。

## 任务错误码

写入 `ai_jobs.error`：

`quota_users` · `quota_daily` · `rate_limited` · `input_too_large` · `unsupported_capability` · `model_timeout` · `model_error` · `worker_stale`

## 安全说明

- publishable / anon key 本就会出现在前端；靠 RLS 限制客户端只能 INSERT、不能列表。
- service role 与厂商密钥只留在 worker 主机，绝不提交进 Git。
- `device_id` 不是强身份；用白名单与全局限额控制滥用。
