import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ProduceGatePanel } from './ProduceGatePanel'

describe('ProduceGatePanel', () => {
  it('shows point copy and prompt without sample sentences', () => {
    render(
      <ProduceGatePanel
        titleZh="与格"
        bodyZh="间接宾语常用 to / for"
        draft=""
        onDraftChange={() => {}}
        onSubmit={() => {}}
        busy={false}
        feedback={null}
      />,
    )
    expect(screen.getByText('与格')).toBeInTheDocument()
    expect(screen.getByText('间接宾语常用 to / for')).toBeInTheDocument()
    expect(
      screen.getByText(/你能用这个语法造一个新句子吗/),
    ).toBeInTheDocument()
    expect(screen.queryByText(/I gave/i)).not.toBeInTheDocument()
  })

  it('submits draft and shows feedback while not busy', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const onDraftChange = vi.fn()
    render(
      <ProduceGatePanel
        titleZh="与格"
        bodyZh="body"
        draft="I gave her a gift."
        onDraftChange={onDraftChange}
        onSubmit={onSubmit}
        busy={false}
        feedback="没有用到与格结构"
      />,
    )
    expect(screen.getByText('没有用到与格结构')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '提交' }))
    expect(onSubmit).toHaveBeenCalledOnce()
  })

  it('disables submit while busy', () => {
    render(
      <ProduceGatePanel
        titleZh="与格"
        bodyZh="body"
        draft="Hello world."
        onDraftChange={() => {}}
        onSubmit={() => {}}
        busy
        feedback={null}
      />,
    )
    expect(screen.getByRole('button', { name: /判定中|提交/ })).toBeDisabled()
  })
})
