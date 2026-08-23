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
