import { describe, expect, it } from 'vitest'
import {
  grammarPack,
  anchorForLevel,
  playablesForLevel,
  chaptersInOrder,
  levelsForChapter,
} from './pack'

describe('grammar pack invariants', () => {
  it('has full chapter directory with only first chapter released', () => {
    const chapters = chaptersInOrder()
    expect(chapters.length).toBeGreaterThanOrEqual(3)
    const released = chapters.filter((c) => c.released)
    expect(released).toHaveLength(1)
    expect(released[0]!.sort_order).toBe(1)
  })

  it('released chapter has at least two levels each with one anchor and three playables', () => {
    const chapter = chaptersInOrder().find((c) => c.released)!
    const levels = levelsForChapter(chapter.id)
    expect(levels.length).toBeGreaterThanOrEqual(2)
    for (const level of levels) {
      const anchor = anchorForLevel(level.id)
      const playables = playablesForLevel(level.id)
      expect(anchor).toBeDefined()
      expect(playables.length).toBeGreaterThanOrEqual(3)
      for (const p of playables) {
        expect(p.en).not.toBe(anchor!.en)
      }
    }
  })

  it('every anchor has at least one sentence_span', () => {
    const anchors = grammarPack.sentences.filter((s) => s.kind === 'anchor')
    for (const anchor of anchors) {
      const spans = grammarPack.sentence_spans.filter((sp) => sp.sentence_id === anchor.id)
      expect(spans.length).toBeGreaterThan(0)
    }
  })

  it('every sentence has slots covering slot_index 0..n-1', () => {
    for (const sentence of grammarPack.sentences) {
      const slots = grammarPack.sentence_slots
        .filter((s) => s.sentence_id === sentence.id)
        .sort((a, b) => a.slot_index - b.slot_index)
      expect(slots.length).toBeGreaterThan(0)
      slots.forEach((slot, i) => expect(slot.slot_index).toBe(i))
    }
  })
})
