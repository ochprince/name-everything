import { useEffect, useState } from 'react'
import { PRODUCE_HINT_ROTATE_MS } from '../lib/produceHints'

/** Matches MCQ: two min-h-14 rows + gap-2. */
export const FALLING_ANSWER_BODY_MIN_H = 'min-h-[7.5rem]'

type ProduceProps = {
  mode: 'produce'
  draft: string
  onDraftChange: (value: string) => void
  onSubmit: () => void
  /** placeholder 轮播提示（第一条 = 中文例句）；缺省用默认文案。 */
  hints?: string[]
}

type McqProps = {
  mode: 'mcq'
  options: string[]
  onPick: (option: string) => void
}

export type FallingAnswerPadProps = ProduceProps | McqProps

export function FallingAnswerPad(props: FallingAnswerPadProps) {
  const [hintIndex, setHintIndex] = useState(0)
  const hintsKey =
    props.mode === 'produce' ? (props.hints?.join('\u0000') ?? '') : ''

  // placeholder 轮播：新句子（hints 内容变化）从头播，3 秒一条，键盘开/关都播。
  useEffect(() => {
    setHintIndex(0)
    const list = props.mode === 'produce' ? props.hints : undefined
    if (!list || list.length === 0) return
    const timer = window.setInterval(() => {
      setHintIndex((index) => (index + 1) % list.length)
    }, PRODUCE_HINT_ROTATE_MS)
    return () => window.clearInterval(timer)
  }, [props.mode, hintsKey])

  const placeholder =
    props.mode === 'produce' && props.hints && props.hints.length > 0
      ? props.hints[hintIndex]
      : '输入英文句子'

  return (
    <div className="rounded-2xl border border-day/20 bg-cyc/40 px-3 py-4">
      {props.mode === 'produce' ? (
        <form
          data-testid="falling-answer-body"
          className={`flex ${FALLING_ANSWER_BODY_MIN_H} flex-col gap-2`}
          onSubmit={(event) => {
            event.preventDefault()
            props.onSubmit()
          }}
        >
          <textarea
            value={props.draft}
            onChange={(event) => props.onDraftChange(event.target.value)}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            rows={3}
            aria-label="输入英文句子"
            placeholder={placeholder}
            className="min-h-0 w-full flex-1 resize-none rounded-2xl border border-day/75 bg-cyc px-3 py-2.5 text-lg font-semibold leading-snug tracking-[0.02em] text-day placeholder:text-day/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-day"
          />
          <button
            type="submit"
            disabled={!props.draft.trim()}
            className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-2xl bg-day px-3 text-base font-semibold tracking-[0.08em] text-cyc transition-[filter] duration-200 ease-out hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-day active:brightness-95 disabled:pointer-events-none disabled:opacity-40"
          >
            提交
          </button>
        </form>
      ) : (
        <div
          data-testid="falling-answer-body"
          className={`grid ${FALLING_ANSWER_BODY_MIN_H} grid-cols-2 gap-2`}
        >
          {props.options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => props.onPick(option)}
              className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-day/75 bg-cyc px-3 text-lg font-semibold tracking-[0.04em] text-day transition-[filter,background-color] duration-200 ease-out hover:border-day hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-day active:brightness-95"
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
