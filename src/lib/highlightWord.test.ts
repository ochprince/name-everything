import { describe, it, expect } from 'vitest'
import { highlightParts } from './highlightWord'

describe('highlightParts', () => {
  it('marks the first case-insensitive word match', () => {
    expect(highlightParts('I climbed up the ladder to change.', 'ladder')).toEqual([
      { text: 'I climbed up the ', highlight: false },
      { text: 'ladder', highlight: true },
      { text: ' to change.', highlight: false },
    ])
  })

  it('matches a simple plural', () => {
    expect(highlightParts('A pair of brown boots to hike.', 'boot')).toEqual([
      { text: 'A pair of brown ', highlight: false },
      { text: 'boots', highlight: true },
      { text: ' to hike.', highlight: false },
    ])
  })

  it('returns the whole sentence when the word is absent', () => {
    expect(highlightParts('Nothing here.', 'cup')).toEqual([
      { text: 'Nothing here.', highlight: false },
    ])
  })
})
