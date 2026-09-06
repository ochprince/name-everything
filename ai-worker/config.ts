import { parseQuotaConfig, type QuotaConfig } from './quota'

export type WorkerConfig = {
  supabaseUrl: string
  serviceRoleKey: string
  dashscopeApiKey: string
  quota: QuotaConfig
  pollMs: number
}

export function loadWorkerConfig(
  env: NodeJS.ProcessEnv = process.env,
): WorkerConfig {
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY
  const dashscopeApiKey = env.DASHSCOPE_API_KEY
  if (!supabaseUrl || !serviceRoleKey || !dashscopeApiKey) {
    throw new Error(
      'Missing SUPABASE_URL (or VITE_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY, or DASHSCOPE_API_KEY',
    )
  }
  const pollRaw = env.AI_WORKER_POLL_MS
  const pollMs =
    pollRaw && Number.isFinite(Number(pollRaw)) ? Number(pollRaw) : 200

  return {
    supabaseUrl,
    serviceRoleKey,
    dashscopeApiKey,
    quota: parseQuotaConfig(env as Record<string, string | undefined>),
    pollMs,
  }
}
