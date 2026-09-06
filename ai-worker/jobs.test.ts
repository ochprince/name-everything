import { describe, expect, it, vi } from 'vitest'
import { INPUT_MAX_BYTES } from '../src/ai/types'
import { processClaimedJob, type AiJobRow, type JobStore } from './jobs'
import type { QuotaConfig, QuotaSnapshot } from './quota'
import type { GenerateTextResult } from './qwen'

function makeStore(over: Partial<JobStore> = {}): JobStore & {
  finishCalls: unknown[]
  broadcastCalls: unknown[]
  occupyCalls: string[]
} {
  const finishCalls: unknown[] = []
  const broadcastCalls: unknown[] = []
  const occupyCalls: string[] = []
  return {
    finishCalls,
    broadcastCalls,
    occupyCalls,
    loadSnapshot: vi.fn(async (): Promise<QuotaSnapshot> => ({
      deviceId: 'dev-a',
      knownDevice: false,
      deviceCount: 0,
      userJobsLastDay: 0,
      userJobsLastMinute: 0,
      globalJobsLastMinute: 0,
    })),
    occupyDevice: vi.fn(async (id: string) => {
      occupyCalls.push(id)
    }),
    finishJob: vi.fn(async (id, patch) => {
      finishCalls.push({ id, ...patch })
    }),
    failStaleRunning: vi.fn(async () => []),
    deleteTerminalOlderThan: vi.fn(async () => {}),
    broadcast: vi.fn(async (payload) => {
      broadcastCalls.push(payload)
    }),
    ...over,
  }
}

const baseJob = (over: Partial<AiJobRow> = {}): AiJobRow => ({
  id: '11111111-1111-1111-1111-111111111111',
  capability: 'text',
  status: 'running',
  device_id: 'dev-a',
  input: { input: 'hello' },
  created_at: new Date().toISOString(),
  claimed_at: new Date().toISOString(),
  ...over,
})

const quota = (over: Partial<QuotaConfig> = {}): QuotaConfig => ({
  maxUsers: 20,
  allowDeviceIds: [],
  perUserPerDay: 50,
  perUserPerMinute: 20,
  globalPerMinute: 60,
  ...over,
})

describe('processClaimedJob', () => {
  it('rejects unsupported capability', async () => {
    const store = makeStore()
    const generate = vi.fn()
    await processClaimedJob(baseJob({ capability: 'image' }), {
      quota: quota(),
      store,
      generateText: generate,
      apiKey: 'k',
    })
    expect(generate).not.toHaveBeenCalled()
    expect(store.finishCalls[0]).toMatchObject({
      status: 'failed',
      error: 'unsupported_capability',
    })
  })

  it('rejects oversized input', async () => {
    const store = makeStore()
    const big = 'x'.repeat(INPUT_MAX_BYTES)
    await processClaimedJob(baseJob({ input: { input: big } }), {
      quota: quota(),
      store,
      generateText: vi.fn(),
      apiKey: 'k',
    })
    expect(store.finishCalls[0]).toMatchObject({
      status: 'rejected',
      error: 'input_too_large',
    })
  })

  it('rejects when quota full without occupy or generate', async () => {
    const store = makeStore({
      loadSnapshot: vi.fn(async () => ({
        deviceId: 'dev-a',
        knownDevice: false,
        deviceCount: 20,
        userJobsLastDay: 0,
        userJobsLastMinute: 0,
        globalJobsLastMinute: 0,
      })),
    })
    const generate = vi.fn()
    await processClaimedJob(baseJob(), {
      quota: quota({ maxUsers: 20 }),
      store,
      generateText: generate,
      apiKey: 'k',
    })
    expect(store.occupyCalls).toHaveLength(0)
    expect(generate).not.toHaveBeenCalled()
    expect(store.finishCalls[0]).toMatchObject({
      status: 'rejected',
      error: 'quota_users',
    })
  })

  it('skips occupy when allow list matches', async () => {
    const store = makeStore()
    const generate = vi.fn(
      async (): Promise<GenerateTextResult> => ({
        text: 'ok',
        model: 'qwen3.8-flash',
      }),
    )
    await processClaimedJob(baseJob(), {
      quota: quota({ allowDeviceIds: ['dev-a'] }),
      store,
      generateText: generate,
      apiKey: 'k',
    })
    expect(store.occupyCalls).toHaveLength(0)
    expect(generate).toHaveBeenCalled()
    expect(store.broadcastCalls[0]).toMatchObject({
      status: 'completed',
      text: 'ok',
    })
  })

  it('completes on generate success', async () => {
    const store = makeStore()
    await processClaimedJob(baseJob(), {
      quota: quota(),
      store,
      generateText: vi.fn(async () => ({
        text: 'world',
        model: 'qwen3.8-flash',
        usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 },
      })),
      apiKey: 'k',
    })
    expect(store.occupyCalls).toEqual(['dev-a'])
    expect(store.finishCalls[0]).toMatchObject({
      status: 'completed',
      output: { text: 'world', model: 'qwen3.8-flash' },
    })
  })

  it('maps model_timeout', async () => {
    const store = makeStore()
    await processClaimedJob(baseJob(), {
      quota: quota(),
      store,
      generateText: vi.fn(async () => {
        throw new Error('model_timeout')
      }),
      apiKey: 'k',
    })
    expect(store.finishCalls[0]).toMatchObject({
      status: 'failed',
      error: 'model_timeout',
    })
  })
})
