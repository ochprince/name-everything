import { useId, useRef, useState } from 'react'
import { addReport } from '../lib/storage'

type ReportTarget = {
  asset_type: 'sentence' | 'grammar_point' | 'sentence_slot' | 'picture_word'
  asset_id: string
  level_id?: string | null
}

export function ReportDialog({
  target,
  label = '报错',
  tone = 'onCyc',
  className = '',
  variant = 'icon',
  size = 'md',
}: {
  target: ReportTarget
  label?: string
  /** onDay = dark icon on cream panels; onCyc = light icon on dark stage */
  tone?: 'onDay' | 'onCyc'
  className?: string
  variant?: 'icon' | 'text'
  /** md = size-9 (default elsewhere); sm = progress-pill height */
  size?: 'md' | 'sm'
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const noteId = useId()
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(false)
  const trimmedNote = note.trim()
  const canSubmit = trimmedNote.length > 0

  function open() {
    setSaved(false)
    setNote('')
    dialogRef.current?.showModal()
  }

  function close() {
    dialogRef.current?.close()
  }

  function submit() {
    if (!canSubmit) return
    addReport({
      asset_type: target.asset_type,
      asset_id: target.asset_id,
      level_id: target.level_id ?? null,
      note: trimmedNote,
    })
    setSaved(true)
    close()
  }

  const toneClass =
    tone === 'onDay'
      ? 'border-cyc/30 text-cyc/75 hover:border-cyc/55 hover:text-cyc focus-visible:outline-cyc'
      : 'border-day/25 text-day/70 hover:border-day/50 hover:text-day focus-visible:outline-day'

  const iconSizeClass = size === 'sm' ? 'size-7' : 'size-9'
  const flagClass = size === 'sm' ? 'size-3.5' : 'size-4'

  const triggerClass =
    variant === 'text'
      ? `inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[0.7rem] font-semibold tracking-[0.14em] text-rose transition-[color,background-color,border-color] duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 active:brightness-95 ${
          tone === 'onDay'
            ? 'border-rose/50 focus-visible:outline-cyc'
            : 'border-rose/55 focus-visible:outline-day'
        } ${className}`
      : `inline-flex ${iconSizeClass} shrink-0 items-center justify-center rounded-full border transition-[color,background-color,border-color] duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 active:brightness-95 ${toneClass} ${className}`

  return (
    <>
      <button
        type="button"
        aria-label={label}
        onClick={open}
        className={triggerClass}
      >
        <FlagIcon className={flagClass} />
        {variant === 'text' ? <span>{label}</span> : null}
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={`${noteId}-title`}
        className="report-dialog"
        onCancel={(event) => {
          event.preventDefault()
          close()
        }}
      >
        <form
          method="dialog"
          className="flex flex-col gap-4 p-5"
          onSubmit={(event) => {
            event.preventDefault()
            submit()
          }}
        >
          <p id={`${noteId}-title`} className="text-lg font-semibold tracking-[0.06em]">
            {label}
          </p>
          <label className="flex flex-col gap-2 text-base font-medium tracking-[0.02em] text-day/80">
            反馈
            <textarea
              id={noteId}
              rows={4}
              required
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="哪里不对？"
              className="min-h-[6rem] resize-none rounded-2xl border border-day/25 bg-cyc px-3 py-3 text-base font-medium tracking-[0.02em] text-day placeholder:text-day/45 focus-visible:border-day focus-visible:outline-none"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={close}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-2xl border border-day/50 bg-cyc text-base font-semibold tracking-[0.08em] text-day transition-[filter] duration-200 ease-out hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-day"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-2xl bg-day text-base font-semibold tracking-[0.08em] text-cyc transition-[filter] duration-200 ease-out hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-day active:brightness-95 disabled:cursor-not-allowed disabled:opacity-45"
            >
              提交
            </button>
          </div>
        </form>
      </dialog>

      {saved ? (
        <span role="status" className="sr-only">
          已记下，可在「我的」导出。
        </span>
      ) : null}
    </>
  )
}

function FlagIcon({ className = 'size-4' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`${className} fill-none stroke-current stroke-[1.75]`}
    >
      <path d="M5 5v14" strokeLinecap="round" />
      <path d="M5 5h11l-2 3 2 3H5" strokeLinejoin="round" />
    </svg>
  )
}
