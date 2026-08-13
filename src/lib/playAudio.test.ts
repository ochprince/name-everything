import { describe, it, expect, vi, afterEach } from 'vitest'
import { playCardAudio } from './playAudio'

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

function stubAudio(playImpl: () => Promise<void> = () => Promise.resolve()) {
  const instances: FakeAudio[] = []
  class FakeAudio {
    src: string
    play = vi.fn(playImpl)
    pause = vi.fn()
    constructor(src: string) {
      this.src = src
      instances.push(this)
    }
  }
  vi.stubGlobal('Audio', FakeAudio)
  return { instances }
}

describe('playCardAudio', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('plays Audio when url is http(s)', () => {
    stubSpeech()
    const { instances } = stubAudio()
    playCardAudio('https://cdn.example/cup.mp3', 'This is a cup.')
    expect(instances).toHaveLength(1)
    expect(instances[0].src).toBe('https://cdn.example/cup.mp3')
    expect(instances[0].play).toHaveBeenCalledTimes(1)
  })

  it('speaks fallback when url is missing', () => {
    const { speakFn } = stubSpeech()
    stubAudio()
    playCardAudio(undefined, 'cup')
    expect(speakFn).toHaveBeenCalledTimes(1)
    const utterance = speakFn.mock.calls[0][0] as SpeechSynthesisUtterance
    expect(utterance.text).toBe('cup')
    expect(utterance.lang).toBe('en-US')
  })

  it('speaks fallback when play() rejects', async () => {
    const { speakFn } = stubSpeech()
    stubAudio(() => Promise.reject(new Error('network')))
    playCardAudio('https://cdn.example/cup.mp3', 'This is a cup.')
    await vi.waitFor(() => {
      expect(speakFn).toHaveBeenCalledTimes(1)
    })
    const utterance = speakFn.mock.calls[0][0] as SpeechSynthesisUtterance
    expect(utterance.text).toBe('This is a cup.')
  })

  it('pauses previous audio before starting the next', () => {
    stubSpeech()
    const { instances } = stubAudio()
    playCardAudio('https://cdn.example/a.mp3', 'a')
    playCardAudio('https://cdn.example/b.mp3', 'b')
    expect(instances[0].pause).toHaveBeenCalledTimes(1)
    expect(instances).toHaveLength(2)
    expect(instances[1].src).toBe('https://cdn.example/b.mp3')
  })
})
