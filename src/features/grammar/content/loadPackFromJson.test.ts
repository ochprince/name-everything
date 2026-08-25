import { describe, expect, it } from 'vitest'
import { loadGameTuningFromJson, mergeGameTuning } from './loadPackFromJson'

describe('mergeGameTuning', () => {
  it('fills produce keys when remote tuning omits them', () => {
    const defaults = loadGameTuningFromJson()
    const merged = mergeGameTuning({
      lives: 3,
      pass_threshold_default: 3,
      fall_duration_ms: 8000,
      wrong_speed_factor: 0.7,
      min_fall_duration_ms: 2500,
      correct_bounce_factor: 0.28,
    })
    expect(merged.produce_answer_ratio).toBe(defaults.produce_answer_ratio)
    expect(merged.produce_fall_duration_factor).toBe(
      defaults.produce_fall_duration_factor,
    )
  })

  it('lets remote values override defaults', () => {
    const merged = mergeGameTuning({ produce_answer_ratio: 0.25 })
    expect(merged.produce_answer_ratio).toBe(0.25)
    expect(merged.fall_duration_ms).toBe(loadGameTuningFromJson().fall_duration_ms)
  })
})
