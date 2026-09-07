import { describe, expect, it, vi } from 'vitest'
import { AiJobError } from '../../../ai/client'
import {
  buildProduceJudgePrompt,
  formatProduceJudgeError,
  parseProduceJudgeResponse,
  shouldEnterProduceGate,
} from './produceGate'

describe('shouldEnterProduceGate', () => {
  it('enters for level when AI on and score met, including already passed', () => {
    expect(
      shouldEnterProduceGate({
        mode: 'level',
        aiAllowed: true,
        score: 3,
        threshold: 3,
      }),
    ).toBe(true)
    expect(
      shouldEnterProduceGate({
        mode: 'arcade',
        aiAllowed: true,
        score: 3,
        threshold: 3,
      }),
    ).toBe(false)
    expect(
      shouldEnterProduceGate({
        mode: 'vocab',
        aiAllowed: true,
        score: 3,
        threshold: 3,
      }),
    ).toBe(false)
    expect(
      shouldEnterProduceGate({
        mode: 'level',
        aiAllowed: false,
        score: 3,
        threshold: 3,
      }),
    ).toBe(false)
    expect(
      shouldEnterProduceGate({
        mode: 'level',
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
        '{"pass":true,"zh":"我给他一本书。","reason":"","comment":"用对了与格结构，动词后直接接间接宾语。"}',
      ),
    ).toEqual({
      pass: true,
      zh: '我给他一本书。',
      reason: '',
      comment: '用对了与格结构，动词后直接接间接宾语。',
    })
  })

  it('parses fail with reason from fenced json', () => {
    expect(
      parseProduceJudgeResponse(
        '```json\n{"pass":false,"zh":"","reason":"没有用到与格结构","comment":""}\n```',
      ),
    ).toEqual({ pass: false, zh: '', reason: '没有用到与格结构', comment: '' })
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

  it('lists this-round accepted sentences when avoidEns is given', () => {
    const built = buildProduceJudgePrompt({
      titleZh: '与格',
      bodyZh: 'body',
      sampleEns: ['I gave him a book.'],
      learnerEn: 'I handed her the keys.',
      avoidEns: ['I handed her the keys.', 'She told me a story.'],
    })
    expect(built.instructions).toContain('本局学习者已写过的合格句')
    expect(built.instructions).toContain('She told me a story.')
  })
})

describe('judgeProduceSentence', () => {
  it('returns parsed verdict from completeText', async () => {
    const completeText = vi.fn().mockResolvedValue({
      id: 'j1',
      text: '{"pass":true,"zh":"我把钥匙递给她。","reason":"","comment":"hand 后接人再接物，与格结构正确。"}',
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
      comment: 'hand 后接人再接物，与格结构正确。',
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
