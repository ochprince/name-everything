import { describe, it, expect, vi, afterEach } from 'vitest'
import { speak } from './tts'

function stubSpeech() {
  const speakFn = vi.fn()
  const cancelFn = vi.fn()
  vi.stubGlobal('speechSynthesis', { speak: speakFn, cancel: cancelFn })
  vi.stubGlobal(
    'SpeechSynthesisUtterance',
    class {
      text: string
      lang = ''
      constructor(text: string) {
        this.text = text
      }
    },
  )
  return { speakFn, cancelFn }
}

describe('speak', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('cancels previous speech and speaks an en-US utterance', () => {
    const { speakFn, cancelFn } = stubSpeech()
    speak('This is a cup.')
    expect(cancelFn).toHaveBeenCalledTimes(1)
    expect(speakFn).toHaveBeenCalledTimes(1)
    const utterance = speakFn.mock.calls[0][0] as SpeechSynthesisUtterance
    expect(utterance.text).toBe('This is a cup.')
    expect(utterance.lang).toBe('en-US')
  })

  it('does nothing when speechSynthesis is missing', () => {
    expect(() => speak('silent')).not.toThrow()
  })

  it('stays silent on Quark (black-screen defense)', () => {
    const { speakFn, cancelFn } = stubSpeech()
    const original = navigator.userAgent
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7_8 like Mac OS X; zh-cn) ' +
        'AppleWebKit/601.1.46 (KHTML, like Gecko) Mobile/22H352 Quark/10.16.0.3166 Mobile',
    })
    try {
      speak('This is a cup.')
      expect(cancelFn).not.toHaveBeenCalled()
      expect(speakFn).not.toHaveBeenCalled()
    } finally {
      Object.defineProperty(navigator, 'userAgent', {
        configurable: true,
        value: original,
      })
    }
  })
})
