import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PRODUCE_HINT_ROTATE_MS } from '../lib/produceHints'
import {
  FALLING_ANSWER_BODY_MIN_H,
  FallingAnswerPad,
} from './FallingAnswerPad'

describe('FallingAnswerPad', () => {
  it('keeps produce and mcq bodies on the same min-height token', () => {
    const { rerender } = render(
      <FallingAnswerPad
        mode="produce"
        draft=""
        onDraftChange={() => {}}
        onSubmit={() => {}}
      />,
    )
    expect(screen.getByTestId('falling-answer-body')).toHaveClass(
      FALLING_ANSWER_BODY_MIN_H,
    )

    rerender(
      <FallingAnswerPad
        mode="mcq"
        options={['He', 'Me', 'My', 'I']}
        onPick={() => {}}
      />,
    )
    expect(screen.getByTestId('falling-answer-body')).toHaveClass(
      FALLING_ANSWER_BODY_MIN_H,
    )
  })

  it('uses a textarea for produce so long sentences can wrap', () => {
    render(
      <FallingAnswerPad
        mode="produce"
        draft="She gave him a book yesterday"
        onDraftChange={() => {}}
        onSubmit={() => {}}
      />,
    )
    const box = screen.getByRole('textbox', { name: '输入英文句子' })
    expect(box.tagName).toBe('TEXTAREA')
    expect(box).toHaveValue('She gave him a book yesterday')
  })

  it('submits produce from the 提交 button', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <FallingAnswerPad
        mode="produce"
        draft="hello"
        onDraftChange={() => {}}
        onSubmit={onSubmit}
      />,
    )
    await user.click(screen.getByRole('button', { name: '提交' }))
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('disables submit while the draft is empty or blank', () => {
    const { rerender } = render(
      <FallingAnswerPad
        mode="produce"
        draft=""
        onDraftChange={() => {}}
        onSubmit={() => {}}
      />,
    )
    expect(screen.getByRole('button', { name: '提交' })).toBeDisabled()

    rerender(
      <FallingAnswerPad
        mode="produce"
        draft="   "
        onDraftChange={() => {}}
        onSubmit={() => {}}
      />,
    )
    expect(screen.getByRole('button', { name: '提交' })).toBeDisabled()

    rerender(
      <FallingAnswerPad
        mode="produce"
        draft="She runs fast"
        onDraftChange={() => {}}
        onSubmit={() => {}}
      />,
    )
    expect(screen.getByRole('button', { name: '提交' })).toBeEnabled()
  })

  describe('produce placeholder rotation', () => {
    afterEach(() => {
      vi.useRealTimers()
    })

    it('rotates through hints as placeholder, starting with the first hint', () => {
      vi.useFakeTimers()
      render(
        <FallingAnswerPad
          mode="produce"
          draft=""
          onDraftChange={() => {}}
          onSubmit={() => {}}
          hints={['中文例句', '关卡名', 'My …', '标杆句']}
        />,
      )
      const box = screen.getByRole('textbox', { name: '输入英文句子' })
      expect(box).toHaveAttribute('placeholder', '中文例句')
      act(() => {
        vi.advanceTimersByTime(PRODUCE_HINT_ROTATE_MS)
      })
      expect(box).toHaveAttribute('placeholder', '关卡名')
      act(() => {
        vi.advanceTimersByTime(PRODUCE_HINT_ROTATE_MS)
      })
      expect(box).toHaveAttribute('placeholder', 'My …')
      act(() => {
        vi.advanceTimersByTime(PRODUCE_HINT_ROTATE_MS * 2)
      })
      expect(box).toHaveAttribute('placeholder', '中文例句')
    })

    it('resets rotation to the first hint when hints change (new sentence)', () => {
      vi.useFakeTimers()
      const { rerender } = render(
        <FallingAnswerPad
          mode="produce"
          draft=""
          onDraftChange={() => {}}
          onSubmit={() => {}}
          hints={['A', 'B']}
        />,
      )
      const box = screen.getByRole('textbox', { name: '输入英文句子' })
      act(() => {
        vi.advanceTimersByTime(PRODUCE_HINT_ROTATE_MS)
      })
      expect(box).toHaveAttribute('placeholder', 'B')
      rerender(
        <FallingAnswerPad
          mode="produce"
          draft=""
          onDraftChange={() => {}}
          onSubmit={() => {}}
          hints={['C', 'D']}
        />,
      )
      expect(box).toHaveAttribute('placeholder', 'C')
    })

    it('falls back to the default placeholder without hints', () => {
      render(
        <FallingAnswerPad
          mode="produce"
          draft=""
          onDraftChange={() => {}}
          onSubmit={() => {}}
        />,
      )
      expect(screen.getByRole('textbox', { name: '输入英文句子' })).toHaveAttribute(
        'placeholder',
        '输入英文句子',
      )
    })
  })
})
