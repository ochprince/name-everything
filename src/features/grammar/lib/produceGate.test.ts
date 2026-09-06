import { describe, expect, it, vi } from 'vitest'
import { AiJobError } from '../../../ai/client'
import {
  buildProduceJudgePrompt,
  formatProduceJudgeError,
  parseProduceJudgeResponse,
  shouldEnterProduceGate,
} from './produceGate'

describe('shouldEnterProduceGate', () => {
  it('enters only for level, not passed, AI on, score met', () => {
    expect(
      shouldEnterProduceGate({
        mode: 'level',
        levelPassed: false,
        aiAllowed: true,
        score: 3,
        threshold: 3,
      }),
    ).toBe(true)
    expect(
      shouldEnterProduceGate({
        mode: 'level',
        levelPassed: true,
        aiAllowed: true,
        score: 3,
        threshold: 3,
      }),
    ).toBe(false)
    expect(
      shouldEnterProduceGate({
        mode: 'arcade',
        levelPassed: false,
        aiAllowed: true,
        score: 3,
        threshold: 3,
      }),
    ).toBe(false)
    expect(
      shouldEnterProduceGate({
        mode: 'vocab',
        levelPassed: false,
        aiAllowed: true,
        score: 3,
        threshold: 3,
      }),
    ).toBe(false)
    expect(
      shouldEnterProduceGate({
        mode: 'level',
        levelPassed: false,
        aiAllowed: false,
        score: 3,
        threshold: 3,
      }),
    ).toBe(false)
    expect(
      shouldEnterProduceGate({
        mode: 'level',
        levelPassed: false,
        aiAllowed: true,
        score: 2,
        threshold: 3,
      }),
    ).toBe(false)
  })
})

describe('parseProduceJudgeResponse', () => {
  it('parses pass with zh', () => {
    expect(
      parseProduceJudgeResponse(
        '{"pass":true,"zh":"我给他一本书。","reason":""}',
      ),
    ).toEqual({ pass: true, zh: '我给他一本书。', reason: '' })
  })

  it('parses fail with reason from fenced json', () => {
    expect(
      parseProduceJudgeResponse(
        '```json\n{"pass":false,"zh":"","reason":"没有用到与格结构"}\n```',
      ),
    ).toEqual({ pass: false, zh: '', reason: '没有用到与格结构' })
  })

  it('treats pass without zh as fail', () => {
    const r = parseProduceJudgeResponse('{"pass":true,"zh":"","reason":""}')
    expect(r.pass).toBe(false)
    expect(r.reason.length).toBeGreaterThan(0)
  })

  it('falls back when text is not json', () => {
    const r = parseProduceJudgeResponse('not json at all')
    expect(r.pass).toBe(false)
    expect(r.reason.length).toBeGreaterThan(0)
  })
})

describe('buildProduceJudgePrompt', () => {
  it('includes point and samples in instructions, learner sentence in input', () => {
    const built = buildProduceJudgePrompt({
      titleZh: '与格',
      bodyZh: '间接宾语用 to',
      sampleEns: ['I gave him a book.', 'She sent me a letter.'],
      learnerEn: 'I handed her the keys.',
    })
    expect(built.instructions).toContain('与格')
    expect(built.instructions).toContain('间接宾语用 to')
    expect(built.instructions).toContain('I gave him a book.')
    expect(built.input).toBe('I handed her the keys.')
  })
})

describe('judgeProduceSentence', () => {
  it('returns parsed verdict from completeText', async () => {
    const completeText = vi.fn().mockResolvedValue({
      id: 'j1',
      text: '{"pass":true,"zh":"我把钥匙递给她。","reason":""}',
      model: 'x',
    })
    const { judgeProduceSentence } = await import('./produceGate')
    const result = await judgeProduceSentence(
      {
        titleZh: '与格',
        bodyZh: 'body',
        sampleEns: ['I gave him a book.'],
        learnerEn: 'I handed her the keys.',
        deviceId: 'dev-1',
      },
      completeText,
    )
    expect(result).toEqual({
      pass: true,
      zh: '我把钥匙递给她。',
      reason: '',
    })
    expect(completeText).toHaveBeenCalledOnce()
  })
})

describe('formatProduceJudgeError', () => {
  it('maps known AI errors to Chinese copy', () => {
    expect(formatProduceJudgeError(new AiJobError('timeout'))).toMatch(/超时/)
    expect(formatProduceJudgeError(new AiJobError('quota_users'))).toMatch(
      /未开通/,
    )
    expect(formatProduceJudgeError(new Error('boom'))).toMatch(/判定失败/)
  })
})
