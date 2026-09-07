/**
 * AI 白名单状态的本地缓存（懒加载）：门/入口不再每次进都真实调 RPC。
 * - 首次确认后写缓存，TTL 内直接用；
 * - 过期后下次使用入口时静默重查（无可见闪烁）；
 * - 真实判句被后端拒绝（quota_users = 未开通）时立即失效重写，下次入口即重查。
 */

export const AI_ALLOW_CACHE_KEY = 'name-everything.ai.allowCache'
export const AI_ALLOW_CACHE_TTL_MS = 6 * 60 * 60 * 1000

export type AiAllowCache = {
  allowed: boolean
  checkedAt: number
}

export function readAiAllowCache(): AiAllowCache | null {
  try {
    const raw = localStorage.getItem(AI_ALLOW_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<AiAllowCache>
    if (typeof parsed.allowed !== 'boolean' || !Number.isFinite(parsed.checkedAt)) {
      return null
    }
    return { allowed: parsed.allowed, checkedAt: parsed.checkedAt as number }
  } catch {
    return null
  }
}

export function writeAiAllowCache(
  allowed: boolean,
  opts?: { expired?: boolean },
): void {
  try {
    localStorage.setItem(
      AI_ALLOW_CACHE_KEY,
      JSON.stringify({
        allowed,
        checkedAt: opts?.expired ? 0 : Date.now(),
      } satisfies AiAllowCache),
    )
  } catch {
    // 存储不可用（隐私模式等）：每次照常真实请求即可
  }
}

export function isAiAllowCacheFresh(): boolean {
  const cache = readAiAllowCache()
  return (
    cache !== null && Date.now() - cache.checkedAt < AI_ALLOW_CACHE_TTL_MS
  )
}
