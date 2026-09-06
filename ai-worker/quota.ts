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

const DEFAULTS: QuotaConfig = {
  maxUsers: 20,
  allowDeviceIds: [],
  perUserPerDay: 50,
  perUserPerMinute: 20,
  globalPerMinute: 60,
}

function parseNonNegInt(
  raw: string | undefined,
  fallback: number,
): number {
  if (raw === undefined || raw.trim() === '') return fallback
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 0) return fallback
  return Math.floor(n)
}

/** Parse `app_config.value` for `ai.allow_device_ids`. */
export function parseAllowDeviceIdsValue(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((s) => s.trim())
    .filter(Boolean)
}

export function parseQuotaConfig(
  env: Record<string, string | undefined>,
): QuotaConfig {
  return {
    maxUsers: parseNonNegInt(env.AI_QUOTA_MAX_USERS, DEFAULTS.maxUsers),
    // Allow list lives in app_config; env is ignored.
    allowDeviceIds: [],
    perUserPerDay: parseNonNegInt(
      env.AI_QUOTA_PER_USER_PER_DAY,
      DEFAULTS.perUserPerDay,
    ),
    perUserPerMinute: parseNonNegInt(
      env.AI_QUOTA_PER_USER_PER_MINUTE,
      DEFAULTS.perUserPerMinute,
    ),
    globalPerMinute: parseNonNegInt(
      env.AI_QUOTA_GLOBAL_PER_MINUTE,
      DEFAULTS.globalPerMinute,
    ),
  }
}

export function evaluateQuota(
  config: QuotaConfig,
  snap: QuotaSnapshot,
): 'ok' | 'quota_users' | 'quota_daily' | 'rate_limited' {
  if (!config.allowDeviceIds.includes(snap.deviceId)) {
    return 'quota_users'
  }

  if (
    config.perUserPerDay > 0 &&
    snap.userJobsLastDay >= config.perUserPerDay
  ) {
    return 'quota_daily'
  }

  if (
    config.perUserPerMinute > 0 &&
    snap.userJobsLastMinute >= config.perUserPerMinute
  ) {
    return 'rate_limited'
  }

  if (
    config.globalPerMinute > 0 &&
    snap.globalJobsLastMinute >= config.globalPerMinute
  ) {
    return 'rate_limited'
  }

  return 'ok'
}
