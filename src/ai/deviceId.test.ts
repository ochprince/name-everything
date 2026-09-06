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
