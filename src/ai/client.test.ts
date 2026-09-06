import { afterEach, describe, expect, it, vi } from 'vitest'
import { AiJobError, completeText } from './client'

const insert = vi.fn()
const rpc = vi.fn()
const removeChannel = vi.fn()
let broadcastCb: ((msg: { payload: Record<string, unknown> }) => void) | null =
  null

vi.mock('./allowance', () => ({
  isAiAllowed: vi.fn(async () => true),
}))

vi.mock('../lib/supabase', () => ({
  isSupabaseConfigured: vi.fn(() => true),
  getSupabase: () => ({
    from: () => ({ insert }),
    rpc,
    removeChannel,
    channel: () => ({
      on: (
        _t: string,
        _f: unknown,
        cb: (msg: { payload: Record<string, unknown> }) => void,
      ) => {
        broadcastCb = cb
        return {
          subscribe: () => ({}),
        }
      },
    }),
  }),
}))

import { isAiAllowed } from './allowance'
import { isSupabaseConfigured } from '../lib/supabase'

describe('completeText', () => {
  afterEach(() => {
    insert.mockReset()
    rpc.mockReset()
    removeChannel.mockReset()
    broadcastCb = null
    vi.mocked(isSupabaseConfigured).mockReturnValue(true)
    vi.mocked(isAiAllowed).mockResolvedValue(true)
  })

  it('throws when supabase is missing', async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(false)
    await expect(
      completeText({ input: 'hi', deviceId: 'd1' }),
    ).rejects.toThrow(/VITE_SUPABASE/)
  })

  it('rejects before insert when device is not allowed', async () => {
    vi.mocked(isAiAllowed).mockResolvedValue(false)
    await expect(
      completeText({ input: 'hi', deviceId: 'd1' }),
    ).rejects.toMatchObject({ code: 'quota_users' })
    expect(insert).not.toHaveBeenCalled()
  })

  it('inserts a queued text job', async () => {
    insert.mockResolvedValue({ error: null })
    rpc.mockResolvedValue({
      data: {
        status: 'completed',
        output: { text: 'ok', model: 'qwen3.8-flash' },
      },
      error: null,
    })
    await completeText({ input: 'hello', deviceId: 'dev-1', timeoutMs: 500 })
    const row = insert.mock.calls[0][0]
    expect(row.capability).toBe('text')
    expect(row.status).toBe('queued')
    expect(row.device_id).toBe('dev-1')
    expect(row.input.input).toBe('hello')
  })

  it('resolves from broadcast payload', async () => {
    insert.mockResolvedValue({ error: null })
    rpc.mockResolvedValue({ data: null, error: null })
    const pending = completeText({
      input: 'q',
      deviceId: 'd',
      timeoutMs: 1000,
    })
    await vi.waitFor(() => {
      expect(broadcastCb).not.toBeNull()
    })
    broadcastCb?.({
      payload: { id: 'x', status: 'completed', text: 'hi' },
    })
    const result = await pending
    expect(result.text).toBe('hi')
  })

  it('resolves from rpc when broadcast is silent', async () => {
    insert.mockResolvedValue({ error: null })
    rpc.mockResolvedValue({
      data: {
        status: 'completed',
        output: { text: 'from-rpc', model: 'qwen3.8-flash' },
      },
      error: null,
    })
    const result = await completeText({
      input: 'q',
      deviceId: 'd',
      timeoutMs: 1000,
    })
    expect(result.text).toBe('from-rpc')
    expect(result.model).toBe('qwen3.8-flash')
  })

  it('throws AiJobError on rejected', async () => {
    insert.mockResolvedValue({ error: null })
    rpc.mockResolvedValue({ data: null, error: null })
    const pending = completeText({ input: 'q', deviceId: 'd', timeoutMs: 1000 })
    await vi.waitFor(() => {
      expect(broadcastCb).not.toBeNull()
    })
    broadcastCb?.({
      payload: { id: 'x', status: 'rejected', error: 'quota_daily' },
    })
    try {
      await pending
      throw new Error('expected reject')
    } catch (err) {
      expect(err).toBeInstanceOf(AiJobError)
      expect((err as AiJobError).code).toBe('quota_daily')
    }
  })

  it('times out and removes the channel', async () => {
    insert.mockResolvedValue({ error: null })
    rpc.mockResolvedValue({ data: null, error: null })
    await expect(
      completeText({ input: 'q', deviceId: 'd', timeoutMs: 50 }),
    ).rejects.toMatchObject({ code: 'timeout' })
    expect(removeChannel).toHaveBeenCalled()
  })
})
