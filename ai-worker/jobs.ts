import { INPUT_MAX_BYTES, type AiCapability, type AiDonePayload } from '../src/ai/types'
import { evaluateQuota, type QuotaConfig } from './quota'
import { generateText, DEFAULT_MODEL } from './qwen'

export type AiJobRow = {
  id: string
  capability: AiCapability
  status: string
  device_id: string
  input: unknown
  created_at: string
  claimed_at: string | null
}

export type JobStore = {
  loadSnapshot(deviceId: string): Promise<import('./quota').QuotaSnapshot>
  occupyDevice(deviceId: string): Promise<void>
  finishJob(
    id: string,
    patch: {
      status: 'completed' | 'failed' | 'rejected'
      output?: unknown
      error?: string
    },
  ): Promise<void>
  failStaleRunning(olderThanMs: number): Promise<AiDonePayload[]>
  deleteTerminalOlderThan(olderThanMs: number): Promise<void>
  broadcast(payload: AiDonePayload): Promise<void>
}

export function inputByteLength(input: unknown): number {
  return new TextEncoder().encode(JSON.stringify(input)).length
}

export async function processClaimedJob(
  job: AiJobRow,
  deps: {
    quota: QuotaConfig
    store: JobStore
    generateText: typeof generateText
    apiKey: string
    now?: Date
  },
): Promise<void> {
  const { store, quota } = deps

  if (job.capability !== 'text') {
    await store.finishJob(job.id, {
      status: 'failed',
      error: 'unsupported_capability',
    })
    await store.broadcast({
      id: job.id,
      status: 'failed',
      error: 'unsupported_capability',
    })
    return
  }

  if (inputByteLength(job.input) > INPUT_MAX_BYTES) {
    await store.finishJob(job.id, {
      status: 'rejected',
      error: 'input_too_large',
    })
    await store.broadcast({
      id: job.id,
      status: 'rejected',
      error: 'input_too_large',
    })
    return
  }

  const snap = await store.loadSnapshot(job.device_id)
  const decision = evaluateQuota(quota, snap)
  if (decision !== 'ok') {
    await store.finishJob(job.id, { status: 'rejected', error: decision })
    await store.broadcast({
      id: job.id,
      status: 'rejected',
      error: decision,
    })
    return
  }

  const raw = job.input
  if (!raw || typeof raw !== 'object') {
    await store.finishJob(job.id, { status: 'failed', error: 'model_error' })
    await store.broadcast({
      id: job.id,
      status: 'failed',
      error: 'model_error',
    })
    return
  }

  const body = raw as {
    instructions?: string
    input?: string | unknown[]
    model?: string
    temperature?: number
    max_output_tokens?: number
  }
  if (body.input === undefined) {
    await store.finishJob(job.id, { status: 'failed', error: 'model_error' })
    await store.broadcast({
      id: job.id,
      status: 'failed',
      error: 'model_error',
    })
    return
  }

  try {
    const result = await deps.generateText({
      apiKey: deps.apiKey,
      input: body.input,
      instructions: body.instructions,
      model: body.model ?? DEFAULT_MODEL,
      temperature: body.temperature,
      maxOutputTokens: body.max_output_tokens,
    })
    const output = {
      text: result.text,
      model: result.model,
      usage: result.usage,
    }
    await store.finishJob(job.id, { status: 'completed', output })
    await store.broadcast({
      id: job.id,
      status: 'completed',
      text: result.text,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'model_error'
    const error =
      message === 'model_timeout' || message === 'model_error'
        ? message
        : 'model_error'
    await store.finishJob(job.id, { status: 'failed', error })
    await store.broadcast({ id: job.id, status: 'failed', error })
  }
}
