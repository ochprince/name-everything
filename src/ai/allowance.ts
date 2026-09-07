import { getSupabase, isSupabaseConfigured } from '../lib/supabase'
import {
  isAiAllowCacheFresh,
  readAiAllowCache,
  writeAiAllowCache,
} from './allowCache'

export {
  AI_ALLOW_DEVICE_IDS_KEY,
  SMOKE_DEVICE_PREFIX,
  createSmokeDeviceId,
  isSmokeDeviceId,
} from './configKeys'

/**
 * Whether this device may use AI features.
 * Call before rendering AI UI or invoking `completeText`.
 * False when not configured / RPC error / not on the allow list / 确认超时。
 * 永不抛错。
 */
export async function isAiAllowed(deviceId: string): Promise<boolean> {
  return (await isAiAllowedWithDetail(deviceId)).allowed
}

/**
 * 懒加载版确认：TTL 内直接读本地缓存（不发起请求）；
 * 过期/无缓存才真实调 RPC，成功后回写缓存。
 * 真实请求失败时：有缓存就沿用缓存值（离线降级），无缓存则如实返回失败。
 */
export async function checkAiAllowedCached(
  deviceId: string,
): Promise<AiAllowedDetail> {
  if (isAiAllowCacheFresh()) {
    const cache = readAiAllowCache()
    if (cache) return { allowed: cache.allowed, ok: true }
  }
  const detail = await isAiAllowedWithDetail(deviceId)
  if (detail.ok) {
    writeAiAllowCache(detail.allowed)
    return detail
  }
  const cache = readAiAllowCache()
  if (cache) return { allowed: cache.allowed, ok: true }
  return detail
}

/**
 * 真实判句被后端拒绝（设备未开通/quota_users）时调用：
 * 把缓存立即置为「未开通」并标记过期，下次入口会重查，而不是锁死 6 小时。
 */
export function invalidateAiAllowCache(): void {
  writeAiAllowCache(false, { expired: true })
}

export type AiAllowedDetail = {
  allowed: boolean
  /** false = 没能确认（网络失败/超时），与「确定拒绝」区分开。 */
  ok: boolean
}

/**
 * isAiAllowed 的带状态版本：网络黑洞/超时不会永远 pending——
 * 超时后按 ok=false 返回，调用方可以提示「确认失败」而不是误报「未开通」。
 */
export function isAiAllowedWithDetail(
  deviceId: string,
  timeoutMs = 8_000,
): Promise<AiAllowedDetail> {
  if (!isSupabaseConfigured()) {
    return Promise.resolve({ allowed: false, ok: true })
  }
  const check = (async (): Promise<AiAllowedDetail> => {
    try {
      const { data, error } = await getSupabase().rpc('ai_is_allowed', {
        p_device_id: deviceId,
      })
      if (error) return { allowed: false, ok: false }
      return { allowed: data === true, ok: true }
    } catch {
      return { allowed: false, ok: false }
    }
  })()
  const timeout = new Promise<AiAllowedDetail>((resolve) => {
    setTimeout(() => resolve({ allowed: false, ok: false }), timeoutMs)
  })
  return Promise.race([check, timeout])
}
