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

  it('shows passed result with zh, comment and finish button', async () => {
    const user = userEvent.setup()
    const onFinish = vi.fn()
    render(
      <ProduceGatePanel
        titleZh="与格"
        bodyZh="body"
        draft="I gave her a gift."
        onDraftChange={() => {}}
        onSubmit={() => {}}
        busy={false}
        feedback={null}
        result={{
          en: 'I gave her a gift.',
          zh: '我送了她一份礼物。',
          comment: 'gave 后接人再接物，与格结构正确。',
        }}
        onFinish={onFinish}
      />,
    )
    expect(screen.getByText('判定通过')).toBeInTheDocument()
    expect(screen.getByText('我送了她一份礼物。')).toBeInTheDocument()
    expect(screen.getByText('I gave her a gift.')).toBeInTheDocument()
    expect(
      screen.getByText('gave 后接人再接物，与格结构正确。'),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '查看结算' }))
    expect(onFinish).toHaveBeenCalledOnce()
  })

  it('falls back to a generic comment when AI comment is empty', () => {
    render(
      <ProduceGatePanel
        titleZh="与格"
        bodyZh="body"
        draft="I gave her a gift."
        onDraftChange={() => {}}
        onSubmit={() => {}}
        busy={false}
        feedback={null}
        result={{ en: 'I gave her a gift.', zh: '我送了她一份礼物。', comment: '  ' }}
        onFinish={() => {}}
      />,
    )
    expect(screen.getByText(/句子结构正确/)).toBeInTheDocument()
  })
})
