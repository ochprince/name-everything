export const AI_ERROR_CODES = [
  'quota_users',
  'quota_daily',
  'rate_limited',
  'input_too_large',
  'unsupported_capability',
  'model_timeout',
  'model_error',
  'worker_stale',
] as const

export type AiErrorCode = (typeof AI_ERROR_CODES)[number]

export type AiCapability = 'text' | 'image' | 'tts'

export type AiJobStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'rejected'

export const INPUT_MAX_BYTES = 32 * 1024

export type AiTextInput = {
  instructions?: string
  input: string | unknown[]
  model?: string
  temperature?: number
  max_output_tokens?: number
}

export type AiJobOutput = {
  text: string
  model: string
  usage?: {
    input_tokens: number
    output_tokens: number
    total_tokens: number
  }
}

export type AiDonePayload = {
  id: string
  status: AiJobStatus
  text?: string
  error?: string
}

export function jobChannelName(id: string): string {
  return `ai-job:${id}`
}
