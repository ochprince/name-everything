import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PracticeCard } from './PracticeCard'
import type { Card } from '../types/card'

const card: Card = {
  id: 'cup',
  word: 'cup',
  sentence: 'This is a cup.',
  image: '/images/cards/cup.svg',
  imageSource: 'curated',
  zh: '杯子',
  tags: ['home'],
  tier: 'T1',
}

const props = {
  card,
  pinned: false,
  hintLangDefault: 'en' as const,
  onGotIt: () => {},
  onForgot: () => {},
  onTogglePin: () => {},
}

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

function stubAudio() {
  const instances: { src: string; play: ReturnType<typeof vi.fn> }[] = []
  vi.stubGlobal(
    'Audio',
    class {
      src: string
      play = vi.fn(() => Promise.resolve())
      pause = vi.fn()
      constructor(src: string) {
        this.src = src
        instances.push(this)
      }
    },
  )
  return { instances }
}

describe('PracticeCard', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('hides word, sentence and language toggle until the eye is opened', async () => {
    const user = userEvent.setup()
    render(<PracticeCard {...props} />)

    expect(screen.queryByText('This is a cup.')).not.toBeInTheDocument()
    expect(screen.queryByText('cup')).not.toBeInTheDocument()
    expect(screen.queryByRole('radio', { name: 'EN' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '显示提示' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '显示提示' }))

    expect(screen.getByText('cup')).toBeInTheDocument()
    expect(screen.getByText('This is a cup.')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'EN' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(
      screen.queryByRole('button', { name: '隐藏提示' }),
    ).not.toBeInTheDocument()
  })

  it('hides cues again when the empty stage is clicked', async () => {
    const user = userEvent.setup()
    render(<PracticeCard {...props} />)
    await user.click(screen.getByRole('button', { name: '显示提示' }))
    fireEvent.click(screen.getByTestId('cue-stage'))

    expect(screen.queryByText('This is a cup.')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '显示提示' })).toBeInTheDocument()
  })

  it('switches to zh and stays on en if en is tapped again', async () => {
    const user = userEvent.setup()
    render(<PracticeCard {...props} />)
    await user.click(screen.getByRole('button', { name: '显示提示' }))

    await user.click(screen.getByRole('radio', { name: 'ZH' }))
    expect(screen.getByText('杯子')).toBeInTheDocument()
    expect(screen.queryByText('cup')).not.toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'ZH' })).toHaveAttribute(
      'aria-checked',
      'true',
    )

    await user.click(screen.getByRole('radio', { name: 'EN' }))
    expect(screen.getByText('cup')).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: 'EN' }))
    expect(screen.getByRole('radio', { name: 'EN' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(screen.getByText('cup')).toBeInTheDocument()
  })

  it('resets to hidden when the card id changes', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<PracticeCard {...props} />)
    await user.click(screen.getByRole('button', { name: '显示提示' }))
    await user.click(screen.getByRole('radio', { name: 'ZH' }))
    expect(screen.getByText('杯子')).toBeInTheDocument()

    const next: Card = {
      ...card,
      id: 'bag',
      word: 'bag',
      sentence: 'This is a bag.',
      image: '/images/cards/bag.svg',
      zh: '包',
    }
    rerender(<PracticeCard {...props} card={next} />)

    expect(screen.queryByText('This is a bag.')).not.toBeInTheDocument()
    expect(screen.queryByText('bag')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '显示提示' })).toBeInTheDocument()
  })

  it('fires Got it and pin callbacks immediately', async () => {
    const user = userEvent.setup()
    const onGotIt = vi.fn()
    const onTogglePin = vi.fn()
    render(
      <PracticeCard
        card={card}
        pinned={false}
        hintLangDefault="en"
        onGotIt={onGotIt}
        onForgot={() => {}}
        onTogglePin={onTogglePin}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Got it' }))
    await user.click(screen.getByRole('button', { name: '记录' }))
    expect(onGotIt).toHaveBeenCalled()
    expect(onTogglePin).toHaveBeenCalled()
  })

  it('reveals the answer then calls onForgot after the hold', () => {
    vi.useFakeTimers()
    const onForgot = vi.fn()
    render(<PracticeCard {...props} onForgot={onForgot} />)

    fireEvent.click(screen.getByRole('button', { name: 'Forgot' }))
    expect(onForgot).not.toHaveBeenCalled()
    expect(screen.getByText('cup')).toBeInTheDocument()
    expect(screen.getByText('This is a cup.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Forgot' })).toBeEnabled()

    vi.advanceTimersByTime(4999)
    expect(onForgot).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(onForgot).toHaveBeenCalledTimes(1)
  })

  it('advances immediately when forgetHoldMs is 0', () => {
    const onForgot = vi.fn()
    render(
      <PracticeCard {...props} forgetHoldMs={0} onForgot={onForgot} />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Forgot' }))
    expect(onForgot).toHaveBeenCalledTimes(1)
  })

  it('waits forgetHoldMs then fires onForgot', () => {
    vi.useFakeTimers()
    const onForgot = vi.fn()
    render(
      <PracticeCard {...props} forgetHoldMs={3000} onForgot={onForgot} />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Forgot' }))
    vi.advanceTimersByTime(2999)
    expect(onForgot).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(onForgot).toHaveBeenCalledTimes(1)
  })

  it('skips the hold on a second Forgot tap', () => {
    vi.useFakeTimers()
    const onForgot = vi.fn()
    render(<PracticeCard {...props} onForgot={onForgot} />)

    fireEvent.click(screen.getByRole('button', { name: 'Forgot' }))
    fireEvent.click(screen.getByRole('button', { name: 'Forgot' }))
    expect(onForgot).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(5000)
    expect(onForgot).toHaveBeenCalledTimes(1)
  })

  it('lets Got it cancel a running Forgot hold', () => {
    vi.useFakeTimers()
    const onForgot = vi.fn()
    const onGotIt = vi.fn()
    render(
      <PracticeCard {...props} onForgot={onForgot} onGotIt={onGotIt} />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Forgot' }))
    fireEvent.click(screen.getByRole('button', { name: 'Got it' }))
    expect(onGotIt).toHaveBeenCalledTimes(1)
    expect(onForgot).not.toHaveBeenCalled()

    vi.advanceTimersByTime(5000)
    expect(onForgot).not.toHaveBeenCalled()
  })

  it('shows a sentence speaker and a word speaker after reveal on en', async () => {
    const user = userEvent.setup()
    render(<PracticeCard {...props} />)
    await user.click(screen.getByRole('button', { name: '显示提示' }))
    expect(screen.getByRole('button', { name: '朗读句子' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '朗读单词' })).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: 'ZH' }))
    expect(
      screen.queryByRole('button', { name: '朗读单词' }),
    ).not.toBeInTheDocument()
    expect(screen.getByText('杯子')).toBeInTheDocument()
  })

  it('plays CDN audio for the sentence when the url is http(s)', async () => {
    stubSpeech()
    const { instances } = stubAudio()
    const user = userEvent.setup()
    render(
      <PracticeCard
        {...props}
        card={{
          ...card,
          sentenceAudio: 'https://cdn.example/sentence.mp3',
        }}
      />,
    )
    await user.click(screen.getByRole('button', { name: '显示提示' }))
    await user.click(screen.getByRole('button', { name: '朗读句子' }))
    expect(instances).toHaveLength(1)
    expect(instances[0].src).toBe('https://cdn.example/sentence.mp3')
  })

  it('falls back to TTS when sentence audio is missing', async () => {
    const { speakFn } = stubSpeech()
    stubAudio()
    const user = userEvent.setup()
    render(<PracticeCard {...props} />)
    await user.click(screen.getByRole('button', { name: '显示提示' }))
    await user.click(screen.getByRole('button', { name: '朗读句子' }))
    expect(speakFn).toHaveBeenCalledTimes(1)
    const utterance = speakFn.mock.calls[0][0] as SpeechSynthesisUtterance
    expect(utterance.text).toBe('This is a cup.')
    expect(utterance.lang).toBe('en-US')
  })

  it('auto-plays the word then the sentence after 3s', () => {
    vi.useFakeTimers()
    const { speakFn } = stubSpeech()
    stubAudio()
    render(<PracticeCard {...props} autoSpeak />)

    fireEvent.click(screen.getByRole('button', { name: '显示提示' }))
    expect(speakFn).toHaveBeenCalledTimes(1)
    expect((speakFn.mock.calls[0][0] as SpeechSynthesisUtterance).text).toBe(
      'cup',
    )

    vi.advanceTimersByTime(2999)
    expect(speakFn).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(1)
    expect(speakFn).toHaveBeenCalledTimes(2)
    expect((speakFn.mock.calls[1][0] as SpeechSynthesisUtterance).text).toBe(
      'This is a cup.',
    )
  })

  it('auto-plays on Forgot when autoSpeak is on', () => {
    vi.useFakeTimers()
    const { speakFn } = stubSpeech()
    stubAudio()
    render(<PracticeCard {...props} autoSpeak forgetHoldMs={5000} />)

    fireEvent.click(screen.getByRole('button', { name: 'Forgot' }))
    expect(speakFn).toHaveBeenCalledTimes(1)
    expect((speakFn.mock.calls[0][0] as SpeechSynthesisUtterance).text).toBe(
      'cup',
    )

    vi.advanceTimersByTime(2999)
    expect(speakFn).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(1)
    expect(speakFn).toHaveBeenCalledTimes(2)
    expect((speakFn.mock.calls[1][0] as SpeechSynthesisUtterance).text).toBe(
      'This is a cup.',
    )
  })

  it('does not auto-play on Forgot when autoSpeak is off', () => {
    vi.useFakeTimers()
    const { speakFn } = stubSpeech()
    stubAudio()
    render(<PracticeCard {...props} />)

    fireEvent.click(screen.getByRole('button', { name: 'Forgot' }))
    vi.advanceTimersByTime(5000)
    expect(speakFn).not.toHaveBeenCalled()
  })

  it('lets Got it cancel the pending sentence playback', () => {
    vi.useFakeTimers()
    const { speakFn, cancelFn } = stubSpeech()
    stubAudio()
    const onGotIt = vi.fn()
    render(<PracticeCard {...props} autoSpeak onGotIt={onGotIt} />)

    fireEvent.click(screen.getByRole('button', { name: '显示提示' }))
    expect(speakFn).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'Got it' }))
    expect(onGotIt).toHaveBeenCalled()
    expect(cancelFn).toHaveBeenCalled()

    vi.advanceTimersByTime(3000)
    expect(speakFn).toHaveBeenCalledTimes(1)
  })
})
