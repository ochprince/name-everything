import { beforeEach, describe, expect, it, vi } from 'vitest'

const rpc = vi.fn()

vi.mock('../lib/supabase', () => ({
  isSupabaseConfigured: vi.fn(() => true),
  getSupabase: () => ({ rpc }),
}))

import { isSupabaseConfigured } from '../lib/supabase'
import {
  createSmokeDeviceId,
  isAiAllowed,
  isSmokeDeviceId,
} from './allowance'

describe('isAiAllowed', () => {
  beforeEach(() => {
    rpc.mockReset()
    vi.mocked(isSupabaseConfigured).mockReturnValue(true)
  })

  it('returns true when rpc says allowed', async () => {
    rpc.mockResolvedValue({ data: true, error: null })
    await expect(isAiAllowed('dev-1')).resolves.toBe(true)
    expect(rpc).toHaveBeenCalledWith('ai_is_allowed', { p_device_id: 'dev-1' })
  })

  it('returns false when rpc says not allowed', async () => {
    rpc.mockResolvedValue({ data: false, error: null })
    await expect(isAiAllowed('dev-1')).resolves.toBe(false)
  })

  it('returns false when supabase is not configured', async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(false)
    await expect(isAiAllowed('dev-1')).resolves.toBe(false)
    expect(rpc).not.toHaveBeenCalled()
  })
})

describe('smoke device id', () => {
  it('is distinguishable from uuid and high-entropy', () => {
    const id = createSmokeDeviceId()
    expect(id.startsWith('smoke.')).toBe(true)
    expect(isSmokeDeviceId(id)).toBe(true)
    expect(isSmokeDeviceId('aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee')).toBe(false)
    expect(id.length).toBeGreaterThan(40)
  })
})
