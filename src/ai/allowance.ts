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
 * False when not configured / RPC error / not on the allow list.
 */
export async function isAiAllowed(deviceId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false
  const { data, error } = await getSupabase().rpc('ai_is_allowed', {
    p_device_id: deviceId,
  })
  if (error) return false
  return data === true
}
