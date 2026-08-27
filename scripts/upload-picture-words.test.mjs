import { describe, expect, it } from 'vitest'
import {
  assignSortOrders,
  excludeAiCorrected,
} from './pictureWordsUpload.mjs'

describe('excludeAiCorrected', () => {
  it('drops rows whose word is already ai_corrected', () => {
    const rows = [{ word: 'apple' }, { word: 'banana' }, { word: 'cherry' }]
    expect(excludeAiCorrected(rows, ['banana'])).toEqual([
      { word: 'apple' },
      { word: 'cherry' },
    ])
  })

  it('keeps every row when nothing is ai_corrected', () => {
    const rows = [{ word: 'apple' }]
    expect(excludeAiCorrected(rows, [])).toEqual(rows)
  })
})

describe('assignSortOrders', () => {
  it('numbers 1..n when no sort_order is reserved', () => {
    const rows = [{ word: 'a' }, { word: 'b' }]
    expect(assignSortOrders(rows)).toEqual([
      { word: 'a', sort_order: 1 },
      { word: 'b', sort_order: 2 },
    ])
  })

  it('skips sort_order values held by ai_corrected rows', () => {
    const rows = [{ word: 'a' }, { word: 'b' }]
    expect(assignSortOrders(rows, [2])).toEqual([
      { word: 'a', sort_order: 1 },
      { word: 'b', sort_order: 3 },
    ])
  })
})
