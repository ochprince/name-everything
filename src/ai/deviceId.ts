export const DEVICE_ID_STORAGE_KEY = 'name-everything.ai.deviceId'

export function getOrCreateDeviceId(): string {
  const existing = localStorage.getItem(DEVICE_ID_STORAGE_KEY)
  if (existing) return existing
  const id = crypto.randomUUID()
  localStorage.setItem(DEVICE_ID_STORAGE_KEY, id)
  return id
}
