import { getSupabase, isSupabaseConfigured } from '../lib/supabase'

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
