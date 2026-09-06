import { describe, expect, it } from 'vitest'
import { AI_ERROR_CODES, INPUT_MAX_BYTES, jobChannelName } from './types'

describe('ai protocol', () => {
  it('builds the public realtime channel name', () => {
    expect(jobChannelName('11111111-1111-1111-1111-111111111111')).toBe(
      'ai-job:11111111-1111-1111-1111-111111111111',
    )
  })

  it('lists stable error codes', () => {
    expect(AI_ERROR_CODES).toEqual([
      'quota_users',
      'quota_daily',
      'rate_limited',
      'input_too_large',
      'unsupported_capability',
      'model_timeout',
      'model_error',
      'worker_stale',
    ])
  })

  it('caps input at 32KiB', () => {
    expect(INPUT_MAX_BYTES).toBe(32 * 1024)
  })
})
