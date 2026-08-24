import { describe, expect, it, beforeEach } from 'vitest'
import {
  saveGrammarProgress,
  loadGrammarProgress,
  addReport,
  exportReports,
  clearReports,
  defaultGrammarProgress,
  recordLevelScore,
  recordArcadeRun,
} from './storage'
import { defaultProgress, loadProgress, saveProgress } from '../../pictures/lib/storage'
import { levelById } from '../content/pack'
import { sentenceCountForLevel, thresholdFor } from './unlock'

beforeEach(() => {
  localStorage.clear()
})

describe('grammar storage', () => {
  it('uses separate keys from pictures progress', () => {
    saveProgress({
      ...defaultProgress(),
      streaks: { count: 7, lastActiveDate: '2026-08-22' },
    })
    saveGrammarProgress({
      ...defaultGrammarProgress(),
      passedLevelIds: ['dative-1'],
    })
    expect(loadProgress().streaks.count).toBe(7)
    expect(loadGrammarProgress().passedLevelIds).toEqual(['dative-1'])
    localStorage.removeItem('grammar/progress/v1')
    expect(loadProgress().streaks.count).toBe(7)
  })

  it('exportReports returns asset_reports shape and clearReports empties list', () => {
    addReport({
      asset_type: 'sentence',
      asset_id: 's-d1-anchor',
      level_id: 'dative-1',
      note: 'typo',
    })
    const parsed = JSON.parse(exportReports()) as Array<Record<string, unknown>>
    expect(parsed).toHaveLength(1)
    expect(parsed[0]).toMatchObject({
      asset_type: 'sentence',
      asset_id: 's-d1-anchor',
      level_id: 'dative-1',
      note: 'typo',
    })
    expect(typeof parsed[0]!.created_at).toBe('string')
    clearReports()
    expect(JSON.parse(exportReports())).toHaveLength(0)
  })

  it('enriches sentence reports with en/zh and every slot at export time', () => {
    addReport({
      asset_type: 'sentence',
      asset_id: 's-d1-anchor',
      level_id: 'dative-1',
      note: '干扰项有问题',
    })
    const parsed = JSON.parse(exportReports()) as Array<Record<string, unknown>>
    expect(parsed[0]).toMatchObject({
      asset_type: 'sentence',
      en: 'He sent me a book.',
      zh: '他寄给了我一本书。',
      level_title: '主谓双宾 S+V+IO+DO',
    })
    const slots = parsed[0]!.slots as Array<Record<string, unknown>>
    expect(slots).toHaveLength(4)
    expect(slots[0]).toMatchObject({
      id: 's-d1-anchor-slot-0',
      slot_index: 0,
      role: 'S',
      correct: 'He',
    })
    expect(slots[0]!.distractors).toContain('She')
  })

  it('enriches sentence_slot reports with sentence text and slot definition', () => {
    addReport({
      asset_type: 'sentence_slot',
      asset_id: 's-d1-anchor-slot-0',
      level_id: 'dative-1',
      note: '主语干扰项不对',
    })
    const parsed = JSON.parse(exportReports()) as Array<Record<string, unknown>>
    expect(parsed[0]).toMatchObject({
      asset_type: 'sentence_slot',
      sentence_en: 'He sent me a book.',
      slot_index: 0,
      role: 'S',
      correct: 'He',
    })
  })

  it('enriches grammar_point reports with title and body copy', () => {
    addReport({
      asset_type: 'grammar_point',
      asset_id: 'gp-s',
      level_id: 'sv-1',
      note: '说明不清晰',
    })
    const parsed = JSON.parse(exportReports()) as Array<Record<string, unknown>>
    expect(parsed[0]).toMatchObject({
      asset_type: 'grammar_point',
      title_zh: '主语 S',
    })
    expect(String(parsed[0]!.body_zh)).toContain('动作的发出者')
  })

  it('records passedSentenceCounts when a level is passed', () => {
    const level = levelById('sv-1')
    expect(level).toBeDefined()
    recordLevelScore(level!.id, thresholdFor(level!), thresholdFor(level!))
    expect(loadGrammarProgress().passedSentenceCounts[level!.id]).toBe(
      sentenceCountForLevel(level!.id),
    )
  })

  it('records arcade runs with trophy count independent of history pruning', () => {
    recordArcadeRun(30, 30, true, 45)
    expect(loadGrammarProgress().arcadeTrophyCount).toBe(1)
    expect(loadGrammarProgress().arcadeHistory[0]).toMatchObject({
      score: 30,
      total: 30,
      cleared: true,
    })

    recordArcadeRun(12, 12, true, 12)
    expect(loadGrammarProgress().arcadeTrophyCount).toBe(1)

    recordArcadeRun(22, 30, false, 45)
    const progress = loadGrammarProgress()
    expect(progress.arcadeTrophyCount).toBe(1)
    expect(progress.arcadeHistory[0]?.score).toBe(22)
    expect(progress.arcadeHistory[0]?.cleared).toBe(false)
  })

  it('migrates legacy arcade history entries without cleared metadata', () => {
    localStorage.setItem(
      'grammar/progress/v1',
      JSON.stringify({
        arcadeHistory: [{ id: 'legacy', at: '2026-01-01T00:00:00.000Z', score: 18 }],
      }),
    )
    expect(loadGrammarProgress().arcadeHistory[0]).toMatchObject({
      score: 18,
      total: 18,
      cleared: false,
    })
    expect(loadGrammarProgress().arcadeTrophyCount).toBe(0)
  })
})
