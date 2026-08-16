import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
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
  hintLangDefault: 'en' as const,
  onGotIt: () => {},
  onForgot: () => {},
  onTimeout: () => {},
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

  it('hides word and sentence during think and only offers Find it', () => {
    render(<PracticeCard {...props} />)

    expect(screen.queryByText('This is a cup.')).not.toBeInTheDocument()
    expect(screen.queryByText('cup')).not.toBeInTheDocument()
    expect(screen.queryByRole('radio', { name: 'EN' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '显示提示' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Got it' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Forgot' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Find it' })).toBeInTheDocument()
    expect(screen.getByTestId('think-countdown')).toHaveTextContent('5')
  })

  it('does not reveal when the photo or countdown is clicked', () => {
    render(<PracticeCard {...props} />)
    fireEvent.click(screen.getByTestId('card-photo'))
    fireEvent.click(screen.getByTestId('think-countdown'))
    expect(screen.queryByText('cup')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Find it' })).toBeInTheDocument()
  })

  it('reveals word and sentence on Find it, then Forgot and Got it', async () => {
    const user = userEvent.setup()
    render(<PracticeCard {...props} />)
    await user.click(screen.getByRole('button', { name: 'Find it' }))

    expect(screen.getByText('cup')).toBeInTheDocument()
    expect(screen.getByText('This is a cup.')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'EN' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Forgot' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Got it' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Find it' })).not.toBeInTheDocument()
  })

  it('stays revealed after Find it when the cue panel is clicked', async () => {
    const user = userEvent.setup()
    render(<PracticeCard {...props} />)
    await user.click(screen.getByRole('button', { name: 'Find it' }))
    fireEvent.click(screen.getByTestId('cue-panel'))
    expect(screen.getByText('This is a cup.')).toBeInTheDocument()
  })

  it('reveals the answer for 2s on timeout before calling onTimeout', () => {
    vi.useFakeTimers()
    const onTimeout = vi.fn()
    render(<PracticeCard {...props} thinkHoldMs={3000} onTimeout={onTimeout} />)

    act(() => {
      vi.advanceTimersByTime(2999)
    })
    expect(onTimeout).not.toHaveBeenCalled()
    expect(screen.queryByText('cup')).not.toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(screen.getByText('cup')).toBeInTheDocument()
    expect(screen.getByText('This is a cup.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Find it' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Got it' })).not.toBeInTheDocument()
    expect(onTimeout).not.toHaveBeenCalled()
    act(() => {
      vi.advanceTimersByTime(1999)
    })
    expect(onTimeout).not.toHaveBeenCalled()
    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(onTimeout).toHaveBeenCalledTimes(1)
  })

  it('Find it cancels the think timer', async () => {
    vi.useFakeTimers()
    const onTimeout = vi.fn()
    render(<PracticeCard {...props} thinkHoldMs={5000} onTimeout={onTimeout} />)
    fireEvent.click(screen.getByRole('button', { name: 'Find it' }))
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(onTimeout).not.toHaveBeenCalled()
  })

  it('fires Forgot immediately after reveal', async () => {
    const user = userEvent.setup()
    const onForgot = vi.fn()
    render(<PracticeCard {...props} onForgot={onForgot} />)
    await user.click(screen.getByRole('button', { name: 'Find it' }))
    await user.click(screen.getByRole('button', { name: 'Forgot' }))
    expect(onForgot).toHaveBeenCalledTimes(1)
  })

  it('fires Got it after Find it', async () => {
    const user = userEvent.setup()
    const onGotIt = vi.fn()
    render(<PracticeCard {...props} onGotIt={onGotIt} />)
    await user.click(screen.getByRole('button', { name: 'Find it' }))
    await user.click(screen.getByRole('button', { name: 'Got it' }))
    expect(onGotIt).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('button', { name: '记录' })).not.toBeInTheDocument()
  })

  it('resets to think when the card id changes', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<PracticeCard {...props} />)
    await user.click(screen.getByRole('button', { name: 'Find it' }))
    expect(screen.getByText('cup')).toBeInTheDocument()

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
    expect(screen.getByRole('button', { name: 'Find it' })).toBeInTheDocument()
  })

  it('review sheet starts revealed with no think timer', () => {
    vi.useFakeTimers()
    const onTimeout = vi.fn()
    render(
      <PracticeCard
        {...props}
        chrome="sheet"
        thinkHoldMs={3000}
        onTimeout={onTimeout}
      />,
    )
    expect(screen.getByText('cup')).toBeInTheDocument()
    expect(screen.getByText('This is a cup.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Got it' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Find it' })).not.toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(onTimeout).not.toHaveBeenCalled()
  })

  it('switches to zh after Find it', async () => {
    const user = userEvent.setup()
    render(<PracticeCard {...props} />)
    await user.click(screen.getByRole('button', { name: 'Find it' }))
    await user.click(screen.getByRole('radio', { name: 'ZH' }))
    expect(screen.getByText('杯子')).toBeInTheDocument()
    expect(screen.queryByText('cup')).not.toBeInTheDocument()
  })

  it('auto-plays the word then the sentence after Find it', () => {
    vi.useFakeTimers()
    const { speakFn } = stubSpeech()
    stubAudio()
    render(<PracticeCard {...props} autoSpeak />)

    fireEvent.click(screen.getByRole('button', { name: 'Find it' }))
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
    await user.click(screen.getByRole('button', { name: 'Find it' }))
    await user.click(screen.getByRole('button', { name: '朗读句子' }))
    expect(instances).toHaveLength(1)
    expect(instances[0].src).toBe('https://cdn.example/sentence.mp3')
  })

  it('falls back to TTS when sentence audio is missing', async () => {
    const { speakFn } = stubSpeech()
    stubAudio()
    const user = userEvent.setup()
    render(<PracticeCard {...props} />)
    await user.click(screen.getByRole('button', { name: 'Find it' }))
    await user.click(screen.getByRole('button', { name: '朗读句子' }))
    expect(speakFn).toHaveBeenCalledTimes(1)
    const utterance = speakFn.mock.calls[0][0] as SpeechSynthesisUtterance
    expect(utterance.text).toBe('This is a cup.')
    expect(utterance.lang).toBe('en-US')
  })

  it('lets Got it cancel the pending sentence playback', () => {
    vi.useFakeTimers()
    const { speakFn, cancelFn } = stubSpeech()
    stubAudio()
    const onGotIt = vi.fn()
    render(<PracticeCard {...props} autoSpeak onGotIt={onGotIt} />)

    fireEvent.click(screen.getByRole('button', { name: 'Find it' }))
    expect(speakFn).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'Got it' }))
    expect(onGotIt).toHaveBeenCalled()
    expect(cancelFn).toHaveBeenCalled()

    vi.advanceTimersByTime(3000)
    expect(speakFn).toHaveBeenCalledTimes(1)
  })

  it('auto-plays on timeout reveal when autoSpeak is on', () => {
    vi.useFakeTimers()
    const { speakFn } = stubSpeech()
    stubAudio()
    render(<PracticeCard {...props} autoSpeak thinkHoldMs={3000} />)
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(speakFn).toHaveBeenCalledTimes(1)
    expect((speakFn.mock.calls[0][0] as SpeechSynthesisUtterance).text).toBe(
      'cup',
    )
  })

  it('does not auto-play on timeout when autoSpeak is off', () => {
    vi.useFakeTimers()
    const { speakFn } = stubSpeech()
    stubAudio()
    render(<PracticeCard {...props} thinkHoldMs={3000} />)
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(speakFn).not.toHaveBeenCalled()
  })
})
