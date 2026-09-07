import { useKeyboardOverlapPx } from '../../../shared/useAppViewportHeight'
import { KEYBOARD_OVERLAP_LOCK_PX } from '../../../shared/appViewport'

type ProduceGatePanelProps = {
  titleZh: string
  bodyZh: string
  draft: string
  onDraftChange: (value: string) => void
  onSubmit: () => void
  busy: boolean
  feedback: string | null
  /** 判定合格后的结果展示；非空时切换为「判定通过」视图。 */
  result?: { en: string; zh: string; comment: string } | null
  /** 通过视图里「查看结算」的回调。 */
  onFinish?: () => void
}

const PASS_COMMENT_FALLBACK = '句子结构正确，用上了本关的语法。'

export function ProduceGatePanel({
  titleZh,
  bodyZh,
  draft,
  onDraftChange,
  onSubmit,
  busy,
  feedback,
  result,
  onFinish,
}: ProduceGatePanelProps) {
  const keyboardOverlapPx = useKeyboardOverlapPx()
  const keyboardOpen = keyboardOverlapPx > KEYBOARD_OVERLAP_LOCK_PX

  if (result) {
    return (
      <div className="flex flex-1 flex-col gap-6 px-2 pt-6">
        <p className="text-sm font-medium tracking-[0.08em] text-gold">
          判定通过
        </p>
        <div className="rounded-2xl bg-day px-4 py-4 text-cyc">
          <p className="text-base leading-relaxed tracking-[0.02em] text-cyc/75">
            {result.zh}
          </p>
          <p className="mt-3 text-2xl font-medium leading-snug tracking-[0.01em]">
            {result.en}
          </p>
        </div>
        <div className="rounded-2xl border border-day/20 bg-cyc/40 px-4 py-3">
          <p className="text-sm font-medium tracking-[0.08em] text-day/60">
            AI 点评
          </p>
          <p className="mt-1 text-base leading-relaxed tracking-[0.02em] text-day/90">
            {result.comment.trim() || PASS_COMMENT_FALLBACK}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onFinish?.()}
          className="mt-auto inline-flex min-h-14 items-center justify-center rounded-2xl bg-day px-3 text-lg font-semibold tracking-[0.08em] text-cyc transition-[filter] duration-200 ease-out hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-day active:brightness-95"
        >
          查看结算
        </button>
      </div>
    )
  }

  return (
    <div
      className="flex min-h-0 flex-1 flex-col gap-4 px-2 pt-6"
      style={keyboardOpen ? { paddingBottom: keyboardOverlapPx } : undefined}
    >
      {keyboardOpen ? null : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium tracking-[0.08em] text-rose">
              举一反三
            </p>
            <h2 className="text-2xl font-semibold tracking-[0.02em] text-day">
              {titleZh}
            </h2>
            {bodyZh.trim() ? (
              <p className="text-base leading-relaxed tracking-[0.02em] text-day/80">
                {bodyZh}
              </p>
            ) : null}
            <p className="text-lg font-medium tracking-[0.02em] text-day">
              你能用这个语法造一个新句子吗？
            </p>
          </div>
        </div>
      )}

      <form
        className="mt-auto flex flex-col gap-2 rounded-2xl border border-day/20 bg-cyc/40 px-3 py-4"
        onSubmit={(event) => {
          event.preventDefault()
          if (busy || !draft.trim()) return
          onSubmit()
        }}
      >
        <textarea
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          disabled={busy}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          rows={3}
          aria-label="输入英文句子"
          placeholder="输入你的英文句子"
          className="min-h-[5.5rem] w-full resize-none rounded-2xl border border-day/75 bg-cyc px-3 py-2.5 text-lg font-semibold leading-snug tracking-[0.02em] text-day placeholder:text-day/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-day disabled:opacity-60"
        />
        {feedback ? (
          <p
            role="status"
            className="text-sm leading-snug tracking-[0.02em] text-rose"
          >
            {feedback}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={busy || !draft.trim()}
          onMouseDown={(event) => event.preventDefault()}
          className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-2xl bg-day px-3 text-base font-semibold tracking-[0.08em] text-cyc transition-[filter] duration-200 ease-out hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-day active:brightness-95 disabled:pointer-events-none disabled:opacity-40"
        >
          {busy ? '判定中…' : '提交'}
        </button>
      </form>
    </div>
  )
}
