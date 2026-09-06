import { describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_MODEL,
  QWEN_BASE_URL,
  extractOutputText,
  generateText,
} from './qwen'

describe('extractOutputText', () => {
  it('prefers output_text', () => {
    expect(extractOutputText({ output_text: 'hello' })).toBe('hello')
  })

  it('joins message content', () => {
    expect(
      extractOutputText({
        output: [
          {
            type: 'message',
            content: [{ type: 'output_text', text: 'a' }, { text: 'b' }],
          },
        ],
      }),
    ).toBe('ab')
  })
})

describe('generateText', () => {
  it('posts responses body with reasoning none and store false', async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({
        output_text: 'ok',
        model: DEFAULT_MODEL,
        usage: { input_tokens: 1, output_tokens: 2, total_tokens: 3 },
      }),
    )
    const result = await generateText({
      apiKey: 'k',
      input: 'hi',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })
    expect(result.text).toBe('ok')
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    const call = fetchImpl.mock.calls[0] as unknown as [
      string,
      RequestInit | undefined,
    ]
    expect(call[0]).toBe(`${QWEN_BASE_URL}/responses`)
    const body = JSON.parse(String(call[1]?.body))
    expect(body.reasoning).toEqual({ effort: 'none' })
    expect(body.store).toBe(false)
  })

  it('retries once on 429 then succeeds', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response('no', { status: 429 }))
      .mockResolvedValueOnce(
        Response.json({ output_text: 'after-retry', model: DEFAULT_MODEL }),
      )
    const result = await generateText({
      apiKey: 'k',
      input: 'hi',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })
    expect(result.text).toBe('after-retry')
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })

  it('throws model_error after two 500s', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(new Response('err', { status: 500 }))
    await expect(
      generateText({
        apiKey: 'k',
        input: 'hi',
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).rejects.toThrow('model_error')
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })

  it('throws model_timeout on abort', async () => {
    const fetchImpl = vi.fn((_url: string, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'))
        })
      })
    })
    await expect(
      generateText({
        apiKey: 'k',
        input: 'hi',
        timeoutMs: 20,
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).rejects.toThrow('model_timeout')
  })
})
