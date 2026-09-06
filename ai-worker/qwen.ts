export const DEFAULT_MODEL = 'qwen3.8-flash'
export const QWEN_BASE_URL =
  'https://dashscope.aliyuncs.com/compatible-mode/v1'

export type GenerateTextParams = {
  apiKey: string
  input: string | unknown[]
  instructions?: string
  model?: string
  temperature?: number
  maxOutputTokens?: number
  timeoutMs?: number
  fetchImpl?: typeof fetch
}

export type GenerateTextResult = {
  text: string
  model: string
  usage?: { input_tokens: number; output_tokens: number; total_tokens: number }
}

export function extractOutputText(payload: unknown): string {
  if (!payload || typeof payload !== 'object') {
    throw new Error('model_error')
  }
  const obj = payload as Record<string, unknown>
  if (typeof obj.output_text === 'string' && obj.output_text.length > 0) {
    return obj.output_text
  }
  const output = obj.output
  if (!Array.isArray(output)) throw new Error('model_error')
  const parts: string[] = []
  for (const item of output) {
    if (!item || typeof item !== 'object') continue
    const row = item as { type?: string; content?: unknown }
    if (row.type !== 'message' || !Array.isArray(row.content)) continue
    for (const block of row.content) {
      if (!block || typeof block !== 'object') continue
      const text = (block as { text?: string }).text
      if (typeof text === 'string') parts.push(text)
    }
  }
  const joined = parts.join('')
  if (!joined) throw new Error('model_error')
  return joined
}

async function postOnce(
  fetchImpl: typeof fetch,
  params: GenerateTextParams,
  signal: AbortSignal,
): Promise<Response> {
  const body: Record<string, unknown> = {
    model: params.model ?? DEFAULT_MODEL,
    input: params.input,
    reasoning: { effort: 'none' },
    store: false,
  }
  if (params.instructions !== undefined) body.instructions = params.instructions
  if (params.temperature !== undefined) body.temperature = params.temperature
  if (params.maxOutputTokens !== undefined) {
    body.max_output_tokens = params.maxOutputTokens
  }

  return fetchImpl(`${QWEN_BASE_URL}/responses`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal,
  })
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500
}

export async function generateText(
  params: GenerateTextParams,
): Promise<GenerateTextResult> {
  const fetchImpl = params.fetchImpl ?? fetch
  const timeoutMs = params.timeoutMs ?? 12_000
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    let response: Response
    try {
      response = await postOnce(fetchImpl, params, controller.signal)
    } catch (err) {
      if (controller.signal.aborted) throw new Error('model_timeout')
      throw err
    }

    if (isRetryableStatus(response.status)) {
      try {
        response = await postOnce(fetchImpl, params, controller.signal)
      } catch (err) {
        if (controller.signal.aborted) throw new Error('model_timeout')
        throw err
      }
      if (!response.ok) throw new Error('model_error')
    } else if (!response.ok) {
      throw new Error('model_error')
    }

    const json = (await response.json()) as Record<string, unknown>
    if (json.status === 'failed') throw new Error('model_error')
    const text = extractOutputText(json)
    const usageRaw = json.usage as
      | {
          input_tokens?: number
          output_tokens?: number
          total_tokens?: number
        }
      | undefined
    const usage =
      usageRaw &&
      typeof usageRaw.input_tokens === 'number' &&
      typeof usageRaw.output_tokens === 'number' &&
      typeof usageRaw.total_tokens === 'number'
        ? {
            input_tokens: usageRaw.input_tokens,
            output_tokens: usageRaw.output_tokens,
            total_tokens: usageRaw.total_tokens,
          }
        : undefined

    return {
      text,
      model:
        typeof json.model === 'string'
          ? json.model
          : (params.model ?? DEFAULT_MODEL),
      usage,
    }
  } finally {
    clearTimeout(timer)
  }
}
