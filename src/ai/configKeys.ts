/** `app_config.key` for the AI device allow list (JSON string array). */
export const AI_ALLOW_DEVICE_IDS_KEY = 'ai.allow_device_ids'

export const SMOKE_DEVICE_PREFIX = 'smoke.'

export function isSmokeDeviceId(id: string): boolean {
  return (
    id.startsWith(SMOKE_DEVICE_PREFIX) &&
    id.length >= SMOKE_DEVICE_PREFIX.length + 32
  )
}

/** High-entropy id distinguishable from learner UUIDs. */
export function createSmokeDeviceId(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
  return `${SMOKE_DEVICE_PREFIX}${hex}`
}
