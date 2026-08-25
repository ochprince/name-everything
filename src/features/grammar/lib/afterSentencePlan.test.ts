import { describe, expect, it } from 'vitest'
import {
  clearsResultBeforeAdvance,
  planAfterSentence,
} from './afterSentencePlan'
import { shouldShowGroupSpeedBanner } from './arcadeChallenge'

describe('planAfterSentence', () => {
  it('defers clearing the result when a group speed banner will show', () => {
    const plan = planAfterSentence({
      mode: 'arcade',
      clearedCount: 5,
      hasMoreSentences: true,
      groupNumber: 2,
      shouldShowBanner: shouldShowGroupSpeedBanner,
    })
    expect(plan).toEqual({ kind: 'group_banner', groupNumber: 2 })
    expect(clearsResultBeforeAdvance(plan)).toBe(false)
  })

  it('clears result immediately when advancing without a banner', () => {
    const plan = planAfterSentence({
      mode: 'arcade',
      clearedCount: 4,
      hasMoreSentences: true,
      groupNumber: 1,
      shouldShowBanner: shouldShowGroupSpeedBanner,
    })
    expect(plan).toEqual({ kind: 'advance' })
    expect(clearsResultBeforeAdvance(plan)).toBe(true)
  })
})
