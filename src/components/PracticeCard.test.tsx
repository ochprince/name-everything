import { describe, it, expect, vi } from 'vitest'
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

describe('PracticeCard', () => {
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
})
