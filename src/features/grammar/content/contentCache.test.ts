import { describe, expect, it } from 'vitest'
import {
  emptyVersions,
  isCompleteCache,
  tablesNeedingFetch,
  type CachedGrammarContent,
} from './contentCacheTypes'
import { mergeCachedTables, mergeVersions } from './contentCacheIdb'
import { assembleGrammarContentFromTables } from './fetchPackFromSupabase'

describe('content table cache helpers', () => {
  it('tablesNeedingFetch returns only mismatched tables', () => {
    const local = emptyVersions()
    local.chapters = 2
    local.sentences = 5
    const remote = emptyVersions()
    remote.chapters = 2
    remote.sentences = 6
    remote.game_tuning = 3
    expect(tablesNeedingFetch(local, remote).sort()).toEqual(
      ['game_tuning', 'sentences'].sort(),
    )
  })

  it('isCompleteCache rejects partial bundles', () => {
    expect(isCompleteCache(null)).toBe(false)
    const partial = {
      versions: emptyVersions(),
      tables: {
        chapters: [],
        grammar_points: [],
        levels: [],
        sentences: [],
        sentence_spans: [],
        slots: [],
        sentence_slot_refs: [],
        // game_tuning missing
      },
    } as unknown as CachedGrammarContent
    expect(isCompleteCache(partial)).toBe(false)
  })

  it('mergeCachedTables and mergeVersions update only fetched tables', () => {
    const previous = mergeCachedTables(null, {
      chapters: [{ id: 'c1' }],
      sentences: [{ id: 's1' }],
    })
    const merged = mergeCachedTables(previous, {
      sentences: [{ id: 's2' }],
    })
    expect(merged.chapters).toEqual([{ id: 'c1' }])
    expect(merged.sentences).toEqual([{ id: 's2' }])

    const versions = mergeVersions(
      { ...emptyVersions(), chapters: 1, sentences: 1 },
      { ...emptyVersions(), chapters: 1, sentences: 4 },
      ['sentences'],
    )
    expect(versions.chapters).toBe(1)
    expect(versions.sentences).toBe(4)
  })

  it('assembleGrammarContentFromTables resolves slot refs', () => {
    const { pack, tuning } = assembleGrammarContentFromTables({
      chapters: [
        {
          id: 'ch1',
          title_zh: '章',
          description_zh: null,
          sort_order: 1,
          released: true,
        },
      ],
      grammar_points: [{ id: 'gp1', title_zh: '点', body_zh: '说明' }],
      levels: [
        {
          id: 'lv1',
          chapter_id: 'ch1',
          sort_order: 1,
          grammar_point_id: 'gp1',
          pass_threshold: null,
          lives: null,
          fall_duration_ms: null,
        },
      ],
      sentences: [
        {
          id: 's1',
          level_id: 'lv1',
          kind: 'playable',
          en: 'He smiles.',
          zh: '他微笑。',
          prompt_kind: 'zh',
          image_url: null,
          sort_order: 1,
        },
      ],
      sentence_spans: [],
      slots: [
        {
          id: 'sl1',
          role: 'S',
          correct: 'He',
          distractors: ['She'],
        },
      ],
      sentence_slot_refs: [{ sentence_id: 's1', slot_index: 0, slot_id: 'sl1' }],
      game_tuning: [
        { key: 'lives', value: 3 },
        { key: 'produce_answer_ratio', value: 0.5 },
      ],
    })

    expect(pack.sentences[0]?.en).toBe('He smiles.')
    expect(pack.sentence_slots).toEqual([
      {
        id: 's1-slot-0',
        sentence_id: 's1',
        slot_index: 0,
        role: 'S',
        correct: 'He',
        distractors: ['She'],
      },
    ])
    expect(tuning.lives).toBe(3)
    expect(tuning.produce_answer_ratio).toBe(0.5)
  })
})
