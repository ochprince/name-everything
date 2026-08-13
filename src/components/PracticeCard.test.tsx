import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
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
  expandWordDefault: false,
  expandZhDefault: false,
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
  })

  it('shows sentence but hides word and zh by default', () => {
    render(
      <PracticeCard
        card={card}
        pinned={false}
        expandWordDefault={false}
        expandZhDefault={false}
        onGotIt={() => {}}
        onForgot={() => {}}
        onTogglePin={() => {}}
      />,
    )
    expect(screen.getByText('This is a cup.')).toBeInTheDocument()
    expect(screen.queryByText('cup')).not.toBeInTheDocument()
    expect(screen.queryByText('杯子')).not.toBeInTheDocument()
  })

  it('fires Got it / Forgot / pin callbacks', async () => {
    const user = userEvent.setup()
    const onGotIt = vi.fn()
    const onForgot = vi.fn()
    const onTogglePin = vi.fn()
    render(
      <PracticeCard
        card={card}
        pinned={false}
        expandWordDefault={false}
        expandZhDefault={false}
        onGotIt={onGotIt}
        onForgot={onForgot}
        onTogglePin={onTogglePin}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Got it' }))
    await user.click(screen.getByRole('button', { name: 'Forgot' }))
    await user.click(screen.getByRole('button', { name: '记录' }))
    expect(onGotIt).toHaveBeenCalled()
    expect(onForgot).toHaveBeenCalled()
    expect(onTogglePin).toHaveBeenCalled()
  })

  it('shows a sentence speaker always and a word speaker only when expanded', async () => {
    const user = userEvent.setup()
    render(<PracticeCard {...props} />)
    expect(screen.getByRole('button', { name: '朗读句子' })).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: '朗读单词' }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Word' }))
    expect(screen.getByRole('button', { name: '朗读单词' })).toBeInTheDocument()
    expect(screen.getByText('cup')).toBeInTheDocument()
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
    await user.click(screen.getByRole('button', { name: '朗读句子' }))
    expect(instances).toHaveLength(1)
    expect(instances[0].src).toBe('https://cdn.example/sentence.mp3')
  })

  it('falls back to TTS when sentence audio is missing', async () => {
    const { speakFn } = stubSpeech()
    stubAudio()
    const user = userEvent.setup()
    render(<PracticeCard {...props} />)
    await user.click(screen.getByRole('button', { name: '朗读句子' }))
    expect(speakFn).toHaveBeenCalledTimes(1)
    const utterance = speakFn.mock.calls[0][0] as SpeechSynthesisUtterance
    expect(utterance.text).toBe('This is a cup.')
    expect(utterance.lang).toBe('en-US')
  })
})
