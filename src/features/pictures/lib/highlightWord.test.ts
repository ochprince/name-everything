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

  it('matches an -ing form (去 e)', () => {
    expect(highlightParts('The doctor is explaining the illness.', 'explain')).toEqual([
      { text: 'The doctor is ', highlight: false },
      { text: 'explaining', highlight: true },
      { text: ' the illness.', highlight: false },
    ])
  })

  it('matches an -ed form', () => {
    expect(highlightParts('The driver avoided the dogs.', 'avoid')).toEqual([
      { text: 'The driver ', highlight: false },
      { text: 'avoided', highlight: true },
      { text: ' the dogs.', highlight: false },
    ])
  })

  it('matches a doubled-consonant -ed form', () => {
    expect(highlightParts('The soil cracked.', 'crack')).toEqual([
      { text: 'The soil ', highlight: false },
      { text: 'cracked', highlight: true },
      { text: '.', highlight: false },
    ])
  })

  it('matches an irregular past form', () => {
    expect(highlightParts('She thought about it.', 'think')).toEqual([
      { text: 'She ', highlight: false },
      { text: 'thought', highlight: true },
      { text: ' about it.', highlight: false },
    ])
  })

  it('matches a third-person singular form', () => {
    expect(highlightParts('She runs every day.', 'run')).toEqual([
      { text: 'She ', highlight: false },
      { text: 'runs', highlight: true },
      { text: ' every day.', highlight: false },
    ])
  })
})
