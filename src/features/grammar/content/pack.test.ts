import { describe, expect, it } from 'vitest'
import {
  grammarPack,
  anchorForLevel,
  playablesForLevel,
  chaptersInOrder,
  levelsForChapter,
} from './pack'

describe('grammar pack invariants', () => {
  it('has at least one released chapter in the pack', () => {
    const chapters = chaptersInOrder()
    expect(chapters.length).toBeGreaterThanOrEqual(1)
    const released = chapters.filter((c) => c.released)
    expect(released.length).toBeGreaterThanOrEqual(1)
  })

  it('each released chapter has at least one level with one anchor and three playables', () => {
    const released = chaptersInOrder().filter((c) => c.released)
    for (const chapter of released) {
      const levels = levelsForChapter(chapter.id)
      expect(levels.length).toBeGreaterThanOrEqual(1)
      for (const level of levels) {
        const anchor = anchorForLevel(level.id)
        const playables = playablesForLevel(level.id)
        expect(anchor).toBeDefined()
        expect(playables.length).toBeGreaterThanOrEqual(3)
        for (const p of playables) {
          expect(p.en).not.toBe(anchor!.en)
        }
      }
    }
  })

  it('unreleased chapters may carry levels that still satisfy pack invariants', () => {
    const unreleased = chaptersInOrder().filter((c) => !c.released)
    for (const chapter of unreleased) {
      for (const level of levelsForChapter(chapter.id)) {
        const anchor = anchorForLevel(level.id)
        const playables = playablesForLevel(level.id)
        expect(anchor).toBeDefined()
        expect(playables.length).toBeGreaterThanOrEqual(3)
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
