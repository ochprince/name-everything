import { getSupabase, isSupabaseConfigured } from '../lib/supabase'
import { isAiAllowed } from './allowance'
import {
  jobChannelName,
  type AiDonePayload,
  type AiJobOutput,
  type AiJobStatus,
  type AiTextInput,
} from './types'

export class AiJobError extends Error {
  readonly code: string
  constructor(code: string, message = code) {
    super(message)
    this.name = 'AiJobError'
    this.code = code
  }
}

export type CompleteTextOptions = {
  input: string | unknown[]
  instructions?: string
  deviceId: string
  timeoutMs?: number
  model?: string
  temperature?: number
  maxOutputTokens?: number
}

export type CompleteTextResult = {
  id: string
  text: string
  model: string
  usage?: AiJobOutput['usage']
}

const POLL_MS = 300
const DEFAULT_TIMEOUT_MS = 15_000

function asJob(data: unknown): {
  status?: AiJobStatus
  output?: AiJobOutput | null
  error?: string | null
} | null {
  if (!data) return null
  const row = Array.isArray(data) ? data[0] : data
  if (!row || typeof row !== 'object') return null
  return row as {
    status?: AiJobStatus
    output?: AiJobOutput | null
    error?: string | null
  }
}

export async function completeText(
  options: CompleteTextOptions,
): Promise<CompleteTextResult> {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.',
    )
  }

  if (!(await isAiAllowed(options.deviceId))) {
    throw new AiJobError('quota_users')
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const id = crypto.randomUUID()
  const input: AiTextInput = {
    input: options.input,
    instructions: options.instructions,
    model: options.model,
    temperature: options.temperature,
    max_output_tokens: options.maxOutputTokens,
  }

  const supabase = getSupabase()
  const { error: insertError } = await supabase.from('ai_jobs').insert({
    id,
    capability: 'text',
    status: 'queued',
    device_id: options.deviceId,
    input,
  })
  if (insertError) throw new Error(insertError.message)

  let finished = false
  let timer: ReturnType<typeof setTimeout> | undefined
  let poller: ReturnType<typeof setInterval> | undefined
  const channel = supabase.channel(jobChannelName(id))

  const cleanup = () => {
    if (timer) clearTimeout(timer)
    if (poller) clearInterval(poller)
    void supabase.removeChannel(channel)
  }

  return new Promise<CompleteTextResult>((resolve, reject) => {
    const fail = (err: Error) => {
      if (finished) return
      finished = true
      cleanup()
      reject(err)
    }
    const succeed = (result: CompleteTextResult) => {
      if (finished) return
      finished = true
      cleanup()
      resolve(result)
    }

    const settlePayload = (
      payload: AiDonePayload,
      output?: AiJobOutput | null,
    ) => {
      if (payload.status === 'completed') {
        const text = payload.text ?? output?.text
        if (!text) return
        succeed({
          id,
          text,
          model: output?.model ?? '',
          usage: output?.usage,
        })
        return
      }
      if (payload.status === 'failed' || payload.status === 'rejected') {
        fail(new AiJobError(payload.error ?? payload.status))
      }
    }

    // supabase-js overload resolution: keep broadcast filter typed loosely
    channel
      .on(
        'broadcast',
        { event: 'done' },
        ((msg: { payload?: AiDonePayload }) => {
          if (msg.payload) settlePayload(msg.payload)
        }) as Parameters<typeof channel.on>[2],
      )
      .subscribe()

    const poll = async () => {
      const { data } = await supabase.rpc('get_ai_job', { p_id: id })
      const row = asJob(data)
      if (!row?.status) return
      settlePayload(
        {
          id,
          status: row.status,
          text: row.output?.text,
          error: row.error ?? undefined,
        },
        row.output,
      )
    }

    void poll()
    poller = setInterval(() => {
      void poll()
    }, POLL_MS)

    timer = setTimeout(() => {
      fail(new AiJobError('timeout'))
    }, timeoutMs)
  })
}
