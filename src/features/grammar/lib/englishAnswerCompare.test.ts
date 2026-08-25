import { describe, expect, it } from 'vitest'
import {
  englishAnswersMatch,
  normalizeEnglishForCompare,
} from './englishAnswerCompare'

describe('englishAnswerCompare', () => {
  it('lowercases and strips punctuation and extra spaces', () => {
    expect(normalizeEnglishForCompare('  He said, "Hello!"  ')).toBe('he said hello')
    expect(englishAnswersMatch('Hello, world!', 'hello world')).toBe(true)
  })

  it('treats common contractions as equal to expanded forms', () => {
    expect(englishAnswersMatch("It's fine.", 'It is fine')).toBe(true)
    expect(englishAnswersMatch("There're two cats", 'There are two cats')).toBe(true)
    expect(englishAnswersMatch("I'm ready", 'I am ready')).toBe(true)
    expect(englishAnswersMatch("They can't go", 'They cannot go')).toBe(true)
    expect(englishAnswersMatch("Won't you stay?", 'Will not you stay')).toBe(true)
  })

  it('rejects clearly different answers', () => {
    expect(englishAnswersMatch('He gives her a book', 'She gives him a book')).toBe(
      false,
    )
  })
})
