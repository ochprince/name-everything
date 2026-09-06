# AI Worker

Backend worker for Name Everything's AI job queue.

Static frontends (e.g. GitHub Pages) must not hold model API keys. This process runs on a private host you control: it claims jobs from Supabase, runs the matching capability, writes the result, and notifies waiting clients. The browser only enqueues work and waits (today via `completeText()`; image / speech can reuse the same protocol).

## Why

| Role | Where | Responsibility |
|------|--------|----------------|
| Consumer | Browser (anon / publishable key) | `INSERT` into `ai_jobs`; wait on Realtime Broadcast + `get_ai_job` |
| Producer | This worker (service role) | `claim_ai_job` → quota → provider call → `UPDATE` + Broadcast |
| Queue | Supabase `ai_jobs` | Shared job shape: `capability`, `input`, `output`, `status` |

Use this when the SPA has no trusted backend of its own, or the machine running models has no public HTTPS endpoint. Responses are written in one shot (not streamed) for simpler clients and free-tier Realtime limits.

## Capabilities

| `capability` | Status | Notes |
|--------------|--------|--------|
| `text` | Implemented | DashScope OpenAI-compatible Responses API |
| `image` | Stub | Rejected as `unsupported_capability` |
| `tts` | Stub | Same |

To add a capability: extend the shared types under `src/ai/`, accept a new `input` / `output` shape, and branch in the claim loop. The queue table and client wait path stay the same.

## Requirements

- Node.js 20+
- Supabase project with the `ai_jobs` migrations applied (see `supabase/migrations/`)
- Provider credentials for the capabilities you enable (today: DashScope for `text`)
- A long-running host (VPS, home server, container, …) that can reach Supabase and the provider over HTTPS

Never put `SUPABASE_SERVICE_ROLE_KEY` or provider keys in Vite / GitHub Pages secrets.

## Configuration

Copy [`env.example`](./env.example) to a file **outside the repo** (or a local ignored path), set real values, and point your process manager at it. Suggested permissions: `600`.

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Same project URL as the web app |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (bypasses RLS; server only) |
| `DASHSCOPE_API_KEY` | Key for the current `text` provider (add more vars when you add providers) |
| `AI_QUOTA_MAX_USERS` | Max distinct `device_id`s (first-come). `0` = unlimited. Ignored when the allow-list is set |
| `AI_QUOTA_ALLOW_DEVICE_IDS` | Comma-separated device allow-list. Non-empty → only those ids |
| `AI_QUOTA_PER_USER_PER_DAY` | Per-device daily cap (UTC). `0` = unlimited |
| `AI_QUOTA_PER_USER_PER_MINUTE` | Per-device per-minute cap. `0` = unlimited |
| `AI_QUOTA_GLOBAL_PER_MINUTE` | Global per-minute cap. `0` = unlimited |

Allow-list example:

```bash
AI_QUOTA_ALLOW_DEVICE_IDS=<device-uuid-1>,<device-uuid-2>
```

Learners copy a device id from **Me → 设备码** in the app; operators add it to the allow-list and restart the worker. Quotas are per device across all capabilities.

## Development

From the repository root, with the env vars above exported (or loaded by your shell):

```bash
npm install
npm run ai-worker
```

Unit tests:

```bash
npx vitest run ai-worker src/ai
```

## Deploy (example: systemd)

Paths and hostnames are yours to choose. The unit file in this folder is a template—adjust `WorkingDirectory`, `EnvironmentFile`, and `ExecStart` before installing.

```bash
# On the worker host
git clone <this-repo> /path/to/name-everything
cd /path/to/name-everything
npm ci

cp ai-worker/env.example /etc/name-everything/ai-worker.env
chmod 600 /etc/name-everything/ai-worker.env
# edit secrets and quotas

cp ai-worker/name-everything-ai-worker.service /etc/systemd/system/
# edit paths in the unit if needed
systemctl daemon-reload
systemctl enable --now name-everything-ai-worker
```

Update:

```bash
cd /path/to/name-everything
git pull --ff-only
npm ci
systemctl daemon-reload
systemctl restart name-everything-ai-worker
```

Quota / allow-list only:

```bash
# edit EnvironmentFile
systemctl restart name-everything-ai-worker
```

Useful commands:

```bash
systemctl status name-everything-ai-worker --no-pager
journalctl -u name-everything-ai-worker -n 80 --no-pager
journalctl -u name-everything-ai-worker -f
```

## Smoke test

With the web app's publishable Supabase vars in `.env.local` and a running worker:

```bash
npx tsx scripts/ai-text-smoke.ts
```

Expect a non-empty `text:` within a few seconds. `quota_users` usually means the smoke `device_id` is not on the allow-list (`AI_SMOKE_DEVICE_ID` overrides it).

## Job error codes

Stored on `ai_jobs.error`:

`quota_users` · `quota_daily` · `rate_limited` · `input_too_large` · `unsupported_capability` · `model_timeout` · `model_error` · `worker_stale`

## Security notes

- Publishable / anon keys are public by design; RLS must keep `ai_jobs` insert-only for clients and forbid listing.
- Service role and provider keys stay on the worker host only—never commit them.
- Device ids are not strong identity; use the allow-list and global caps to limit abuse.
