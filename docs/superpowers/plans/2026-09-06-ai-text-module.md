# AI 文生文底层模块 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 落地可复用的文生文底层：Pages 经 Supabase 队列调用 VPS worker；「我的」可复制设备码，管理员写入白名单后开通 AI。App 无 AI 对话入口。

**Architecture:** 浏览器 `completeText()` INSERT `ai_jobs` 并订阅 public 频道 `ai-job:{id}`，300ms RPC `get_ai_job` 回退。VPS 单进程每 ~200ms `claim_ai_job()`，可配置限额后再调千问，UPDATE 终态并 Broadcast。`image`/`tts` 立即 `unsupported_capability`。

**Tech Stack:** TypeScript、Vitest、`@supabase/supabase-js`、官方 `openai` SDK（DashScope 兼容 Responses）、`tsx` 跑 worker、systemd。

## Global Constraints

- 千问 Key 与 service role 只在 VPS，不加 `VITE_`、不进 Git、不进 GitHub Pages Secrets
- worker **不监听端口**，不配域名/证书
- App 不接新路由、底栏或 AI 对话页；「我的」增加设备码复制。实现时改 `README.md` / `MANIFEST.md` 对应一句
- 不改 `asset_reports`；不上 Auth；不流式；不 `previous_response_id`
- 默认模型 `qwen3.8-flash`，`reasoning.effort = none`，`store: false`
- 前端超时 15s；千问硬超时 12s；`running` 超过 30s 视为 `worker_stale`
- 限额只在 worker 配置：`AI_QUOTA_MAX_USERS` 默认 20，`AI_QUOTA_PER_USER_PER_DAY` 默认 50，`AI_QUOTA_PER_USER_PER_MINUTE` 默认 20，`AI_QUOTA_GLOBAL_PER_MINUTE` 默认 60；`0` = 该项不限制
- 错误码稳定：`quota_users` | `quota_daily` | `rate_limited` | `input_too_large` | `unsupported_capability` | `model_timeout` | `model_error` | `worker_stale`
- 频道名 `ai-job:{jobId}`，广播 event `done`，payload `{ id, status, text?, error? }`
- 提交前跑 `npm test`；`tsc -b` 必须包含 worker
- 提交信息用 `feat(ai):` / `test(ai):` / `docs:` 前缀；用户未要求时不要 push

## File map

| 路径 | 职责 |
|------|------|
| `src/ai/types.ts` | 任务协议、错误码、频道名 |
| `src/ai/deviceId.ts` | localStorage 设备 id |
| `src/ai/DeviceIdRow.tsx` | 「我的」设备码复制 |
| `src/pages/MePage.tsx` | 嵌入设备码行 |
| `src/ai/*.test.ts` | 前端单测 |
| `supabase/migrations/20260906120000_ai_jobs.sql` | 表 + RPC + RLS |
| `supabase/schema.sql` | 与 migration 同步 |
| `ai-worker/quota.ts` | 读配置 + `evaluateQuota` |
| `ai-worker/qwen.ts` | 千问 Responses 调用 |
| `ai-worker/jobs.ts` | 领取后处理、僵尸、清理、广播 |
| `ai-worker/config.ts` | 环境变量 |
| `ai-worker/index.ts` | 循环入口 |
| `ai-worker/name-everything-ai-worker.service` | systemd 单元 |
| `ai-worker/env.example` | VPS 环境模板 |
| `tsconfig.worker.json` | worker 类型检查 |
| `DATABASE.md` / `.env.example` | 文档 |

---

### Task 1: 共享协议类型

**Files:**
- Create: `src/ai/types.ts`
- Test: `src/ai/types.test.ts`

**Interfaces:**
- Consumes: none
- Produces: `AI_ERROR_CODES`, `AiErrorCode`, `AiCapability`, `AiJobStatus`, `AiTextInput`, `AiJobOutput`, `AiDonePayload`, `jobChannelName(id: string): string`, `INPUT_MAX_BYTES` (`32768`)

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { AI_ERROR_CODES, INPUT_MAX_BYTES, jobChannelName } from './types'

describe('ai protocol', () => {
  it('builds the public realtime channel name', () => {
    expect(jobChannelName('11111111-1111-1111-1111-111111111111')).toBe(
      'ai-job:11111111-1111-1111-1111-111111111111',
    )
  })

  it('lists stable error codes', () => {
    expect(AI_ERROR_CODES).toEqual([
      'quota_users',
      'quota_daily',
      'rate_limited',
      'input_too_large',
      'unsupported_capability',
      'model_timeout',
      'model_error',
      'worker_stale',
    ])
  })

  it('caps input at 32KiB', () => {
    expect(INPUT_MAX_BYTES).toBe(32 * 1024)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/ai/types.test.ts`

Expected: FAIL，模块不存在。

- [ ] **Step 3: Write minimal implementation**

`src/ai/types.ts`:

```ts
export const AI_ERROR_CODES = [
  'quota_users',
  'quota_daily',
  'rate_limited',
  'input_too_large',
  'unsupported_capability',
  'model_timeout',
  'model_error',
  'worker_stale',
] as const

export type AiErrorCode = (typeof AI_ERROR_CODES)[number]

export type AiCapability = 'text' | 'image' | 'tts'

export type AiJobStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'rejected'

export const INPUT_MAX_BYTES = 32 * 1024

export type AiTextInput = {
  instructions?: string
  input: string | unknown[]
  model?: string
  temperature?: number
  max_output_tokens?: number
}

export type AiJobOutput = {
  text: string
  model: string
  usage?: {
    input_tokens: number
    output_tokens: number
    total_tokens: number
  }
}

export type AiDonePayload = {
  id: string
  status: AiJobStatus
  text?: string
  error?: string
}

export function jobChannelName(id: string): string {
  return `ai-job:${id}`
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/ai/types.test.ts`

Expected: PASS（3 tests）。

- [ ] **Step 5: Commit**

```bash
git add src/ai/types.ts src/ai/types.test.ts
git commit -m "feat(ai): 共享文生文任务协议类型"
```

---

### Task 2: 本机 device id

**Files:**
- Create: `src/ai/deviceId.ts`
- Test: `src/ai/deviceId.test.ts`

**Interfaces:**
- Consumes: none
- Produces: `DEVICE_ID_STORAGE_KEY` (`name-everything.ai.deviceId`)、`getOrCreateDeviceId(): string`

- [ ] **Step 1: Write the failing test**

```ts
import { afterEach, describe, expect, it } from 'vitest'
import { DEVICE_ID_STORAGE_KEY, getOrCreateDeviceId } from './deviceId'

describe('getOrCreateDeviceId', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('creates and persists a UUID', () => {
    const id = getOrCreateDeviceId()
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    )
    expect(localStorage.getItem(DEVICE_ID_STORAGE_KEY)).toBe(id)
    expect(getOrCreateDeviceId()).toBe(id)
  })

  it('reuses a stored id', () => {
    localStorage.setItem(DEVICE_ID_STORAGE_KEY, 'already-there')
    expect(getOrCreateDeviceId()).toBe('already-there')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/ai/deviceId.test.ts`

Expected: FAIL，模块不存在。

- [ ] **Step 3: Write minimal implementation**

```ts
export const DEVICE_ID_STORAGE_KEY = 'name-everything.ai.deviceId'

export function getOrCreateDeviceId(): string {
  const existing = localStorage.getItem(DEVICE_ID_STORAGE_KEY)
  if (existing) return existing
  const id = crypto.randomUUID()
  localStorage.setItem(DEVICE_ID_STORAGE_KEY, id)
  return id
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/ai/deviceId.test.ts`

Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add src/ai/deviceId.ts src/ai/deviceId.test.ts
git commit -m "feat(ai): 本机持久化 device id"
```

---

### Task 3: `completeText()` 客户端

**Files:**
- Create: `src/ai/client.ts`
- Test: `src/ai/client.test.ts`

**Interfaces:**
- Consumes: `jobChannelName`、`AiTextInput`、`AiDonePayload`、`AiJobOutput` from `./types`；`getSupabase` / `isSupabaseConfigured` from `../lib/supabase`
- Produces:

```ts
export class AiJobError extends Error {
  readonly code: string
  constructor(code: string, message?: string)
}

export type CompleteTextOptions = {
  input: string | unknown[]
  instructions?: string
  deviceId: string
  timeoutMs?: number
  model?: string
  temperature?: number
  maxOutputTokens?: number
}

export type CompleteTextResult = {
  id: string
  text: string
  model: string
  usage?: AiJobOutput['usage']
}

export function completeText(options: CompleteTextOptions): Promise<CompleteTextResult>
```

默认 `timeoutMs = 15_000`。INSERT 行：`id`（`crypto.randomUUID()`）、`capability: 'text'`、`status: 'queued'`、`device_id`、`input` 为 `AiTextInput`。先 INSERT，再订 `broadcast`/`done`，同时每 300ms `rpc('get_ai_job', { p_id: id })`。`completed` 返回结果；`failed`/`rejected` 抛 `AiJobError`（`code = error` 字段）；超时抛 `AiJobError('timeout')` 并 `removeChannel`。RPC 行的 `output` 与广播 payload 都能结束等待。

- [ ] **Step 1: Write the failing test** `src/ai/client.test.ts`

```ts
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AiJobError, completeText } from './client'

const insert = vi.fn()
const rpc = vi.fn()
const removeChannel = vi.fn()
let broadcastCb: ((msg: { payload: Record<string, unknown> }) => void) | null =
  null

vi.mock('../lib/supabase', () => ({
  isSupabaseConfigured: vi.fn(() => true),
  getSupabase: () => ({
    from: () => ({ insert }),
    rpc,
    removeChannel,
    channel: () => ({
      on: (
        _t: string,
        _f: unknown,
        cb: (msg: { payload: Record<string, unknown> }) => void,
      ) => {
        broadcastCb = cb
        return {
          subscribe: () => ({
            on: () => ({ subscribe: vi.fn() }),
          }),
        }
      },
    }),
  }),
}))

import { isSupabaseConfigured } from '../lib/supabase'

describe('completeText', () => {
  afterEach(() => {
    insert.mockReset()
    rpc.mockReset()
    removeChannel.mockReset()
    broadcastCb = null
    vi.mocked(isSupabaseConfigured).mockReturnValue(true)
  })

  it('throws when supabase is missing', async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(false)
    await expect(
      completeText({ input: 'hi', deviceId: 'd1' }),
    ).rejects.toThrow(/VITE_SUPABASE/)
  })

  it('inserts a queued text job', async () => {
    insert.mockResolvedValue({ error: null })
    rpc.mockResolvedValue({
      data: {
        status: 'completed',
        output: { text: 'ok', model: 'qwen3.8-flash' },
      },
      error: null,
    })
    await completeText({ input: 'hello', deviceId: 'dev-1', timeoutMs: 500 })
    const row = insert.mock.calls[0][0]
    expect(row.capability).toBe('text')
    expect(row.status).toBe('queued')
    expect(row.device_id).toBe('dev-1')
    expect(row.input.input).toBe('hello')
  })

  it('resolves from broadcast payload', async () => {
    insert.mockImplementation(async () => {
      queueMicrotask(() => {
        broadcastCb?.({
          payload: { id: 'x', status: 'completed', text: 'hi' },
        })
      })
      return { error: null }
    })
    rpc.mockResolvedValue({ data: null, error: null })
    const result = await completeText({
      input: 'q',
      deviceId: 'd',
      timeoutMs: 1000,
    })
    expect(result.text).toBe('hi')
  })

  it('resolves from rpc when broadcast is silent', async () => {
    insert.mockResolvedValue({ error: null })
    rpc.mockResolvedValue({
      data: {
        status: 'completed',
        output: { text: 'from-rpc', model: 'qwen3.8-flash' },
      },
      error: null,
    })
    const result = await completeText({
      input: 'q',
      deviceId: 'd',
      timeoutMs: 1000,
    })
    expect(result.text).toBe('from-rpc')
    expect(result.model).toBe('qwen3.8-flash')
  })

  it('throws AiJobError on rejected', async () => {
    insert.mockImplementation(async () => {
      queueMicrotask(() => {
        broadcastCb?.({
          payload: { id: 'x', status: 'rejected', error: 'quota_daily' },
        })
      })
      return { error: null }
    })
    rpc.mockResolvedValue({ data: null, error: null })
    try {
      await completeText({ input: 'q', deviceId: 'd', timeoutMs: 1000 })
      throw new Error('expected reject')
    } catch (err) {
      expect(err).toBeInstanceOf(AiJobError)
      expect((err as AiJobError).code).toBe('quota_daily')
    }
  })

  it('times out and removes the channel', async () => {
    insert.mockResolvedValue({ error: null })
    rpc.mockResolvedValue({ data: null, error: null })
    await expect(
      completeText({ input: 'q', deviceId: 'd', timeoutMs: 50 }),
    ).rejects.toMatchObject({ code: 'timeout' })
    expect(removeChannel).toHaveBeenCalled()
  })
})
```

假 `channel().on` 必须返回带 `subscribe` 的对象（链式 `.on().subscribe()`）。

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/ai/client.test.ts`

Expected: FAIL，`completeText` 未定义。

- [ ] **Step 3: Write `src/ai/client.ts`**

```ts
import { getSupabase, isSupabaseConfigured } from '../lib/supabase'
import {
  jobChannelName,
  type AiDonePayload,
  type AiJobOutput,
  type AiJobStatus,
  type AiTextInput,
} from './types'

export class AiJobError extends Error {
  readonly code: string
  constructor(code: string, message = code) {
    super(message)
    this.name = 'AiJobError'
    this.code = code
  }
}

export type CompleteTextOptions = {
  input: string | unknown[]
  instructions?: string
  deviceId: string
  timeoutMs?: number
  model?: string
  temperature?: number
  maxOutputTokens?: number
}

export type CompleteTextResult = {
  id: string
  text: string
  model: string
  usage?: AiJobOutput['usage']
}

const POLL_MS = 300
const DEFAULT_TIMEOUT_MS = 15_000

function asJob(data: unknown): {
  status?: AiJobStatus
  output?: AiJobOutput | null
  error?: string | null
} | null {
  if (!data) return null
  const row = Array.isArray(data) ? data[0] : data
  if (!row || typeof row !== 'object') return null
  return row as {
    status?: AiJobStatus
    output?: AiJobOutput | null
    error?: string | null
  }
}

export async function completeText(
  options: CompleteTextOptions,
): Promise<CompleteTextResult> {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.',
    )
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const id = crypto.randomUUID()
  const input: AiTextInput = {
    input: options.input,
    instructions: options.instructions,
    model: options.model,
    temperature: options.temperature,
    max_output_tokens: options.maxOutputTokens,
  }

  const supabase = getSupabase()
  const { error: insertError } = await supabase.from('ai_jobs').insert({
    id,
    capability: 'text',
    status: 'queued',
    device_id: options.deviceId,
    input,
  })
  if (insertError) throw new Error(insertError.message)

  let finished = false
  let timer: ReturnType<typeof setTimeout> | undefined
  let poller: ReturnType<typeof setInterval> | undefined
  const channel = supabase.channel(jobChannelName(id))

  const cleanup = () => {
    if (timer) clearTimeout(timer)
    if (poller) clearInterval(poller)
    void supabase.removeChannel(channel)
  }

  return new Promise<CompleteTextResult>((resolve, reject) => {
    const fail = (err: Error) => {
      if (finished) return
      finished = true
      cleanup()
      reject(err)
    }
    const succeed = (result: CompleteTextResult) => {
      if (finished) return
      finished = true
      cleanup()
      resolve(result)
    }

    const settlePayload = (payload: AiDonePayload, output?: AiJobOutput | null) => {
      if (payload.status === 'completed') {
        const text = payload.text ?? output?.text
        if (!text) return
        succeed({
          id,
          text,
          model: output?.model ?? '',
          usage: output?.usage,
        })
        return
      }
      if (payload.status === 'failed' || payload.status === 'rejected') {
        fail(new AiJobError(payload.error ?? payload.status))
      }
    }

    channel
      .on(
        'broadcast',
        { event: 'done' },
        (msg: { payload?: AiDonePayload }) => {
          if (msg.payload) settlePayload(msg.payload)
        },
      )
      .subscribe()

    const poll = async () => {
      const { data } = await supabase.rpc('get_ai_job', { p_id: id })
      const row = asJob(data)
      if (!row?.status) return
      settlePayload(
        {
          id,
          status: row.status,
          text: row.output?.text,
          error: row.error ?? undefined,
        },
        row.output,
      )
    }

    void poll()
    poller = setInterval(() => {
      void poll()
    }, POLL_MS)

    timer = setTimeout(() => {
      fail(new AiJobError('timeout'))
    }, timeoutMs)
  })
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/ai/client.test.ts src/ai/types.test.ts src/ai/deviceId.test.ts`

Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add src/ai/client.ts src/ai/client.test.ts
git commit -m "feat(ai): completeText 经队列等待整段结果"
```

---

### Task 4: 队列表、RPC、RLS、文档

**Files:**
- Create: `supabase/migrations/20260906120000_ai_jobs.sql`
- Modify: `supabase/schema.sql`（追加同等 DDL，保持 canonical）
- Modify: `DATABASE.md`
- Modify: `.env.example`

**Interfaces:**
- Consumes: spec 表结构
- Produces: `ai_jobs`、`ai_quota_devices`、`get_ai_job(p_id uuid)`、`claim_ai_job()`

- [ ] **Step 1: Write migration** `supabase/migrations/20260906120000_ai_jobs.sql`

```sql
CREATE TABLE ai_jobs (
  id UUID PRIMARY KEY,
  capability TEXT NOT NULL CHECK (capability IN ('text', 'image', 'tts')),
  status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'completed', 'failed', 'rejected')),
  device_id TEXT NOT NULL,
  input JSONB NOT NULL,
  output JSONB,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  claimed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_ai_jobs_queued ON ai_jobs (created_at) WHERE status = 'queued';
CREATE INDEX idx_ai_jobs_device_created ON ai_jobs (device_id, created_at);
CREATE INDEX idx_ai_jobs_terminal_completed ON ai_jobs (completed_at)
  WHERE status IN ('completed', 'failed', 'rejected');

CREATE TABLE ai_quota_devices (
  device_id TEXT PRIMARY KEY,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE ai_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_quota_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_jobs_anon_insert ON ai_jobs
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    status = 'queued'
    AND output IS NULL
    AND error IS NULL
    AND claimed_at IS NULL
    AND completed_at IS NULL
    AND capability IN ('text', 'image', 'tts')
    AND char_length(device_id) > 0
  );

CREATE OR REPLACE FUNCTION get_ai_job(p_id uuid)
RETURNS ai_jobs
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM ai_jobs WHERE id = p_id;
$$;

CREATE OR REPLACE FUNCTION claim_ai_job()
RETURNS ai_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  job ai_jobs;
BEGIN
  SELECT * INTO job
  FROM ai_jobs
  WHERE status = 'queued'
  ORDER BY created_at ASC
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  UPDATE ai_jobs
  SET status = 'running',
      claimed_at = now()
  WHERE id = job.id
  RETURNING * INTO job;

  RETURN job;
END;
$$;

REVOKE ALL ON FUNCTION get_ai_job(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_ai_job(uuid) TO anon, authenticated;

REVOKE ALL ON FUNCTION claim_ai_job() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION claim_ai_job() TO service_role;

GRANT INSERT ON ai_jobs TO anon, authenticated;
```

不要 `GRANT SELECT ON ai_jobs`。不要给 anon 任何 `ai_quota_devices` 权限。

- [ ] **Step 2: Append the same tables/functions/policies/grants to `supabase/schema.sql`**

放在 `asset_reports` 的 GRANT 之后。`ENABLE ROW LEVEL SECURITY` 列表加上 `ai_jobs`、`ai_quota_devices`。

- [ ] **Step 3: Update `DATABASE.md`**

在「有哪些表」增加：

```markdown
- **AI 队列：** `ai_jobs`（浏览器 INSERT `queued` 任务；VPS worker 领取并写回结果）。anon 只能 INSERT，不能 SELECT 列表；读单行走 RPC `get_ai_job(id)`；领取走 `claim_ai_job()`（仅 service role）。`ai_quota_devices` 记录先到先占的设备名额，anon 无权限。
```

- [ ] **Step 4: Update `.env.example`**

在文件末尾追加（注释，不要假 Key）：

```bash
# AI worker (VPS only — never VITE_, never GitHub Pages):
# DASHSCOPE_API_KEY=
# SUPABASE_URL=   # same project as VITE_SUPABASE_URL
# SUPABASE_SERVICE_ROLE_KEY=
# AI_QUOTA_MAX_USERS=20
# AI_QUOTA_ALLOW_DEVICE_IDS=
# AI_QUOTA_PER_USER_PER_DAY=50
# AI_QUOTA_PER_USER_PER_MINUTE=20
# AI_QUOTA_GLOBAL_PER_MINUTE=60
```

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260906120000_ai_jobs.sql supabase/schema.sql DATABASE.md .env.example
git commit -m "feat(ai): ai_jobs 队列与限额名额表"
```

本任务不 `db push`（等 Task 9 / 推 main）。本地无法跑 SQL 单测则跳过；以文件与 spec 逐列对照为准。

---

### Task 5: 限额纯函数

**Files:**
- Create: `ai-worker/quota.ts`
- Test: `ai-worker/quota.test.ts`

**Interfaces:**
- Consumes: none（不要 import 前端 React）
- Produces:

```ts
export type QuotaConfig = {
  maxUsers: number
  allowDeviceIds: string[]
  perUserPerDay: number
  perUserPerMinute: number
  globalPerMinute: number
}

export type QuotaSnapshot = {
  deviceId: string
  knownDevice: boolean
  deviceCount: number
  userJobsLastDay: number
  userJobsLastMinute: number
  globalJobsLastMinute: number
}

export function parseQuotaConfig(env: Record<string, string | undefined>): QuotaConfig

export function evaluateQuota(
  config: QuotaConfig,
  snap: QuotaSnapshot,
): 'ok' | 'quota_users' | 'quota_daily' | 'rate_limited'
```

`parseQuotaConfig` 默认：maxUsers 20、allowDeviceIds `[]`、perUserPerDay 50、perUserPerMinute 20、globalPerMinute 60。空字符串白名单 → `[]`。数字解析失败用默认。`0` 保留为 0（不限制）。白名单 trim、去空。

`evaluateQuota` 顺序：

1. `allowDeviceIds.length > 0` 且 device 不在名单 → `quota_users`（**不**看 maxUsers）
2. 否则若 `maxUsers > 0` 且 `!knownDevice` 且 `deviceCount >= maxUsers` → `quota_users`
3. `perUserPerDay > 0` 且 `userJobsLastDay >= perUserPerDay` → `quota_daily`
4. `perUserPerMinute > 0` 且 `userJobsLastMinute >= perUserPerMinute` → `rate_limited`
5. `globalPerMinute > 0` 且 `globalJobsLastMinute >= globalPerMinute` → `rate_limited`
6. 否则 `'ok'`

次数含当前这条已入库（snapshot 由调用方 COUNT 含本 job）。测试里 snapshot 自己构造。

- [ ] **Step 1: Write tests** covering：默认 parse；白名单拒绝；白名单放过且忽略满员；先到先占满员；已在册用户满员后仍可（`knownDevice: true`）；日限额；用户每分钟；全局每分钟；全部为 0 则 ok。

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run ai-worker/quota.test.ts`

Expected: FAIL。

- [ ] **Step 3: Implement `ai-worker/quota.ts`**

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run ai-worker/quota.test.ts`

Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add ai-worker/quota.ts ai-worker/quota.test.ts
git commit -m "feat(ai): worker 可配置限额判定"
```

---

### Task 6: 千问 Responses 调用

**Files:**
- Create: `ai-worker/qwen.ts`
- Test: `ai-worker/qwen.test.ts`

**Interfaces:**
- Consumes: none
- Produces:

```ts
export const DEFAULT_MODEL = 'qwen3.8-flash'
export const QWEN_BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1'

export type GenerateTextParams = {
  apiKey: string
  input: string | unknown[]
  instructions?: string
  model?: string
  temperature?: number
  maxOutputTokens?: number
  timeoutMs?: number
  fetchImpl?: typeof fetch
}

export type GenerateTextResult = {
  text: string
  model: string
  usage?: { input_tokens: number; output_tokens: number; total_tokens: number }
}

export function extractOutputText(payload: unknown): string

export function generateText(params: GenerateTextParams): Promise<GenerateTextResult>
```

不要为了测试去 mock 整个 `openai` 包：`generateText` 用 `fetchImpl` 打 `POST ${QWEN_BASE_URL}/responses`，Header `Authorization: Bearer ${apiKey}`、`Content-Type: application/json`。body：`model`（默认 `DEFAULT_MODEL`）、`input`、有则 `instructions`、`reasoning: { effort: 'none' }`、`store: false`、有则 `temperature`、`max_output_tokens`。`timeoutMs` 默认 12_000，用 `AbortController`。

`extractOutputText`：优先 `output_text` 字符串；否则把 `output[]` 里 `type === 'message'` 的 `content[].text` 拼起来。空则抛错。

HTTP：2xx 且能抽出 text → 返回。超时 / abort → throw `Error('model_timeout')`。429 或 5xx → 再请求一次，仍失败 → throw `Error('model_error')`。其它 4xx → 立刻 `model_error`。响应 JSON `status === 'failed'` → `model_error`。

- [ ] **Step 1: Write tests**（`fetchImpl` mock）：断言 URL/body 含 `reasoning.effort === 'none'` 与 `store === false`；从 `output_text` 取值；从 message content 拼接；abort → `model_timeout`；429 然后 200 算成功（fetch 被调 2 次）；连着两次 500 → 抛 `model_error`。

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run ai-worker/qwen.test.ts`

- [ ] **Step 3: Implement**

- [ ] **Step 4: Run to verify pass**

- [ ] **Step 5: Commit**

```bash
git add ai-worker/qwen.ts ai-worker/qwen.test.ts
git commit -m "feat(ai): 千问 Responses 文生文调用"
```

本期 **不要** 把 `openai` 加进 `package.json`（用 fetch 即可，少一个依赖）。

---

### Task 7: 领取后处理（能力分发、限额、写回、广播）

**Files:**
- Create: `ai-worker/jobs.ts`
- Test: `ai-worker/jobs.test.ts`

**Interfaces:**
- Consumes: `evaluateQuota`、`QuotaConfig`、`QuotaSnapshot` from `./quota`；`generateText`、`DEFAULT_MODEL` from `./qwen`；`INPUT_MAX_BYTES`、`AiCapability`、`AiDonePayload` from `../src/ai/types.ts`
- Produces:

```ts
export type AiJobRow = {
  id: string
  capability: AiCapability
  status: string
  device_id: string
  input: unknown
  created_at: string
  claimed_at: string | null
}

export type JobStore = {
  loadSnapshot(deviceId: string): Promise<QuotaSnapshot>
  occupyDevice(deviceId: string): Promise<void>
  finishJob(
    id: string,
    patch: {
      status: 'completed' | 'failed' | 'rejected'
      output?: unknown
      error?: string
    },
  ): Promise<void>
  failStaleRunning(olderThanMs: number): Promise<AiDonePayload[]>
  deleteTerminalOlderThan(olderThanMs: number): Promise<void>
  broadcast(payload: AiDonePayload): Promise<void>
}

export function inputByteLength(input: unknown): number

export function processClaimedJob(
  job: AiJobRow,
  deps: {
    quota: QuotaConfig
    store: JobStore
    generateText: typeof generateText
    apiKey: string
    now?: Date
  },
): Promise<void>
```

`processClaimedJob` 顺序（必须按 spec）：

1. `capability !== 'text'` → finish `failed` + `unsupported_capability`，broadcast `{ id, status: 'failed', error }`
2. `inputByteLength(job.input) > INPUT_MAX_BYTES` → `rejected` / `input_too_large`
3. `loadSnapshot` → `evaluateQuota`；非 ok → `rejected` / 该 error（**先限额再 occupy**）
4. `occupyDevice(job.device_id)`（白名单模式下也调用无妨：实现里若 `allowDeviceIds.length > 0` 可 skip occupy，测试两种都要覆盖：有白名单时 `occupyDevice` 不被调用）
5. 读 `job.input` 为 `{ instructions?, input, model?, temperature?, max_output_tokens? }`；缺 `input` 字段则 `failed` / `model_error`
6. `generateText({ apiKey, ... })`；成功 finish `completed` + output `{ text, model, usage }`，broadcast 带 `text`；若 error message 是 `model_timeout` / `model_error` 原样写入 `failed`

`failStaleRunning(30_000)`：由 store 查出并标 failed，返回要广播的 payload 列表。本函数只定义 store 契约；真实 SQL 在 Task 8。

测试用内存 fake `JobStore`：

- image 任务 → unsupported，不调 generateText
- 超大 JSON input → input_too_large
- snapshot 满员 → quota_users，不 occupy、不 generate
- 白名单命中 → occupy 不被调用，会 generate
- generate 成功 → completed 且 broadcast.text 有值
- generate throw `Error('model_timeout')` → failed / model_timeout

- [ ] **Step 1: Write failing tests**

- [ ] **Step 2: Run** `npx vitest run ai-worker/jobs.test.ts` → FAIL

- [ ] **Step 3: Implement `jobs.ts`**

- [ ] **Step 4: Run** → PASS

- [ ] **Step 5: Commit**

```bash
git add ai-worker/jobs.ts ai-worker/jobs.test.ts
git commit -m "feat(ai): worker 领取后限额与写回"
```

---

### Task 8: worker 进程、Supabase store、systemd、类型检查

**Files:**
- Create: `ai-worker/config.ts`
- Create: `ai-worker/store.ts`
- Create: `ai-worker/index.ts`
- Create: `ai-worker/env.example`
- Create: `ai-worker/name-everything-ai-worker.service`
- Create: `tsconfig.worker.json`
- Modify: `tsconfig.json`（references 加上 worker）
- Modify: `package.json`（`tsx` 依赖 + `"ai-worker"` script）
- Modify: `eslint.config.js`（`ai-worker/**` 用 `globals.node`，关掉 `react-refresh`）

**Interfaces:**
- Consumes: Task 5–7
- Produces: `loadWorkerConfig()`、`createSupabaseStore(supabase)`、`main` 循环

`ai-worker/config.ts`：

```ts
export type WorkerConfig = {
  supabaseUrl: string
  serviceRoleKey: string
  dashscopeApiKey: string
  quota: QuotaConfig
  pollMs: number
}

export function loadWorkerConfig(env?: NodeJS.ProcessEnv): WorkerConfig
```

必填：`SUPABASE_URL`（若空则回退 `VITE_SUPABASE_URL`）、`SUPABASE_SERVICE_ROLE_KEY`、`DASHSCOPE_API_KEY`。缺一则 throw。`pollMs` 默认 200。quota 用 `parseQuotaConfig`。

`ai-worker/store.ts` 用 service role client：

- `loadSnapshot`：并行  
  - `ai_quota_devices` 是否已有该 device_id（`maybeSingle`）  
  - `select('device_id')` count 精确：`.from('ai_quota_devices').select('*', { count: 'exact', head: true })`  
  - jobs：`.from('ai_jobs').select('id', { count: 'exact', head: true }).eq('device_id', id).gte('created_at', dayStartUtc)`  
  - 同样 60s 窗口用户与全局  
- `occupyDevice`：`.from('ai_quota_devices').insert({ device_id }).select()`；冲突（23505）视为已占用，忽略  
- `finishJob`：update `status, output, error, completed_at: now`  
- `failStaleRunning`：`.update({ status:'failed', error:'worker_stale', completed_at: now }).eq('status','running').lt('claimed_at', iso).select('id')` 再 map 成 payload  
- `deleteTerminalOlderThan`：`.delete().in('status', [...]).lt('completed_at', iso)`  
- `broadcast`：`channel(jobChannelName(id))` → `subscribe` 等到 SUBSCRIBED 或 1s → `send({ type:'broadcast', event:'done', payload })` → `removeChannel`

`ai-worker/index.ts`：

```ts
async function loop() {
  const cfg = loadWorkerConfig()
  const supabase = createClient(cfg.supabaseUrl, cfg.serviceRoleKey)
  const store = createSupabaseStore(supabase)
  for (;;) {
    await store.deleteTerminalOlderThan(7 * 24 * 60 * 60 * 1000)
    const stale = await store.failStaleRunning(30_000)
    for (const payload of stale) await store.broadcast(payload)
    const { data: job, error } = await supabase.rpc('claim_ai_job')
    if (error) throw error
    if (!job) {
      await new Promise((r) => setTimeout(r, cfg.pollMs))
      continue
    }
    await processClaimedJob(job, {
      quota: cfg.quota,
      store,
      generateText,
      apiKey: cfg.dashscopeApiKey,
    })
  }
}

loop().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

`claim_ai_job` 无行时 `data` 为 `null`。

`package.json` scripts 增加：`"ai-worker": "tsx ai-worker/index.ts"`。`devDependencies` 增加 `tsx`（与现有 typescript 对齐的当前主版本）。

`tsconfig.worker.json`：照 `tsconfig.node.json`，`include: ["ai-worker"]`，`compilerOptions.types: ["node"]`。根 `tsconfig.json` references 增加 `{ "path": "./tsconfig.worker.json" }`。

`ai-worker/env.example`：与 `.env.example` 新增注释相同的键（无真实值）。

`ai-worker/name-everything-ai-worker.service`：

```ini
[Unit]
Description=Name Everything AI text worker
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=/opt/name-everything
EnvironmentFile=/etc/name-everything/ai-worker.env
ExecStart=/usr/bin/npx tsx ai-worker/index.ts
Restart=always
RestartSec=3
User=root

[Install]
WantedBy=multi-user.target
```

WorkingDirectory 以 Task 9 SSH 看到的实际 clone 路径为准；若不是 `/opt/name-everything`，部署时改这一行，仓库里默认用 `/opt/name-everything`。

eslint：为 `files: ['ai-worker/**/*.ts']` 增加一块 config，`languageOptions.globals: globals.node`，不要 `react-refresh` 规则。

- [ ] **Step 1: 为 `loadWorkerConfig` 写 `ai-worker/config.test.ts`**：缺 key throw；有三套 key + 默认 quota。

- [ ] **Step 2: Run fail → implement config.ts → pass**

- [ ] **Step 3: 实现 store.ts / index.ts / tsconfig / package.json / eslint / systemd / env.example**（store 的网络行为不强制单测，jobs 已测 fake store）

- [ ] **Step 4: Run** `npx vitest run src/ai ai-worker && npx tsc -b`

Expected: tests PASS，`tsc -b` 无错。

- [ ] **Step 5: Commit**

```bash
git add ai-worker tsconfig.worker.json tsconfig.json package.json package-lock.json eslint.config.js
git commit -m "feat(ai): VPS worker 循环与 systemd 单元"
```

---

### Task 9: 上线队列并在 VPS 跑通一条

**Files:** 无新业务代码。可 Create：`scripts/ai-text-smoke.ts`（anon INSERT + 轮询 `get_ai_job`，超时 15s，打印 text）。

**Interfaces:**
- Consumes: 已 push 的 migration、VPS 环境、`completeText` 协议

- [ ] **Step 1: 把含 migration 的提交推到 `main`（仅当用户明确要求 push）**，等 GitHub 关联的 Supabase 应用 migration。或用户许可时：`npx supabase db push --linked`。

Dashboard 确认：`ai_jobs`、`get_ai_job`、`claim_ai_job` 存在；anon 对 `ai_jobs` 无 SELECT。

- [ ] **Step 2: SSH `root@<worker-host>`**

查看 Node 版本（需要 20+）、git clone 路径、是否已有 systemd。若无 clone：把仓库放到 `/opt/name-everything`。`npm ci`（或 `npm install`）。

写入 `/etc/name-everything/ai-worker.env`（权限 600），填真实 `DASHSCOPE_API_KEY`、`SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`、限额。

复制单元文件：

```bash
cp /opt/name-everything/ai-worker/name-everything-ai-worker.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now name-everything-ai-worker
journalctl -u name-everything-ai-worker -n 50 --no-pager
```

Expected: 服务 `active`，无缺环境变量崩溃。

- [ ] **Step 3: Smoke**

`scripts/ai-text-smoke.ts`：用 `createClient(url, publishableKey)` INSERT 一条 `text` / `queued`，订阅 `ai-job:{id}`，300ms rpc `get_ai_job`，15s 内打印 `output.text` 或 error。从开发机跑（`.env.local` 的 Vite 变量 + 已部署的 worker）。

Expected: 数秒内 `completed`，有非空 text。不打开 App 任何页面。

- [ ] **Step 4: 若 WorkingDirectory 与实际不符，改 service 文件后重启，再跑 smoke。**

- [ ] **Step 5: Commit smoke script（不要 commit env）**

```bash
git add scripts/ai-text-smoke.ts
git commit -m "test(ai): 队列往返 smoke 脚本"
```

---

### Task 10: 「我的」设备码复制

**Files:**
- Create: `src/ai/DeviceIdRow.tsx`
- Test: `src/ai/DeviceIdRow.test.tsx`（或扩 `src/pages/MePage.test.tsx`）
- Modify: `src/pages/MePage.tsx`（节奏设置与 `GrammarReports` 之间）
- Modify: `MANIFEST.md`（「我的」能力列表加一行）
- Modify: `README.md`（「我的」功能列表加设备码一句）

**Interfaces:**
- Consumes: `getOrCreateDeviceId()` from `./deviceId`
- Produces: `DeviceIdRow` 组件；剪贴板为完整 UUID

- [ ] **Step 1: Write the failing test** `src/ai/DeviceIdRow.test.tsx`

```tsx
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DEVICE_ID_STORAGE_KEY } from './deviceId'
import { DeviceIdRow } from './DeviceIdRow'

describe('DeviceIdRow', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem(DEVICE_ID_STORAGE_KEY, 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee')
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    })
  })

  it('shows the 设备码 section and copies the full id', async () => {
    const user = userEvent.setup()
    render(<DeviceIdRow />)
    expect(screen.getByText('设备码')).toBeInTheDocument()
    expect(screen.getByText('发给管理员以开通 AI')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '复制' }))
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
    )
    expect(await screen.findByRole('button', { name: '已复制' })).toBeInTheDocument()
  })
})
```

另在 `MePage.test.tsx` 加一条：渲染后看得到「设备码」（证明已嵌入，不要测剪贴板细节）。

- [ ] **Step 2: Run** `npx vitest run src/ai/DeviceIdRow.test.tsx` → FAIL

- [ ] **Step 3: Implement `DeviceIdRow`**

样式跟「语法报错」同一套：`mt-14 flex flex-col gap-3`，标题 `text-lg font-medium tracking-[0.04em] text-day`，说明 `text-base ... text-day/80`，按钮用 MePage 的 `holdButton` 类名（把该类名抽到共享或在 DeviceIdRow 内复制同样的 class 字符串，避免为这一行大重构；优先把 `holdButton` 留在 MePage、DeviceIdRow 自带同等 class）。

结构：

```tsx
export function DeviceIdRow() {
  const id = getOrCreateDeviceId()
  // copied state + 1500ms 复位，同 GrammarReports
  // 截断展示：id.slice(0, 8) + '…' + id.slice(-4)
  // 复制完整 id；clipboard 失败则 textarea + execCommand
  return (/* 标题 / 说明 / 截断码 / 复制按钮 */)
}
```

`MePage.tsx`：在 `</div>`（节奏设置块结束）与 `<GrammarReports />` 之间插入 `<DeviceIdRow />`。

`MANIFEST.md` 信息架构表格「我的」列改为：`练习统计、节奏设置、设备码、内容报错`。第五节能力增加：`- 设备码可复制，发给管理员以开通 AI。`

`README.md`「我的」列表增加：`- **设备码** — 复制本机编号发给管理员，用于开通 AI。`

- [ ] **Step 4: Run** `npx vitest run src/ai/DeviceIdRow.test.tsx src/pages/MePage.test.tsx`

Expected: PASS。浏览器打开 `/me`：设置下方有设备码，点复制。

- [ ] **Step 5: Commit**

```bash
git add src/ai/DeviceIdRow.tsx src/ai/DeviceIdRow.test.tsx src/pages/MePage.tsx src/pages/MePage.test.tsx MANIFEST.md README.md
git commit -m "feat(ai): 我的页复制设备码供开通白名单"
```

---

## Spec coverage (self-review)

| Spec | Task |
|------|------|
| `ai_jobs` / `ai_quota_devices` / RLS / RPC | 4 |
| `completeText` + 广播 + RPC + 15s | 3 |
| device id | 2 |
| 协议 / 错误码 / 频道名 | 1 |
| 可配置限额 + 白名单 + 先到先占 | 5、7 |
| 千问 Responses、不思考、12s、429 重试一次 | 6 |
| 循环：清理 7 天、僵尸 30s、claim、unsupported、广播 payload | 7、8 |
| systemd、无端口、密钥在 VPS | 8、9 |
| DATABASE.md / .env.example | 4 |
| README / MANIFEST 设备码 | 10 |
| 真机一条 text | 9 |
| 「我的」设备码复制 | 10 |

无 TBD。类型名贯通：`QuotaConfig`、`JobStore`、`completeText`、`get_ai_job` 的参数名 `p_id` 与 SQL 一致。
