import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
})
