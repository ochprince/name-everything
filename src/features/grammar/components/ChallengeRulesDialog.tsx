import { useEffect, useId, useRef } from 'react'

const RULES_INTRO_KEY = 'grammar/arcade-rules-intro/v1'

const RULES = [
  '随机抽取最多 30 句，每 5 句一组，越往后下落越快。',
  '共 3 条命，耗尽即本局结束。',
  '通关数 ≥ 30 句，可获得 1 座奖杯。',
]

export function ChallengeRulesDialog({ className = '' }: { className?: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    if (localStorage.getItem(RULES_INTRO_KEY)) return
    dialogRef.current?.showModal()
  }, [])

  function open() {
    dialogRef.current?.showModal()
  }

  function close() {
    dialogRef.current?.close()
  }

  function markIntroSeen() {
    localStorage.setItem(RULES_INTRO_KEY, '1')
  }

  return (
    <>
      <button
        type="button"
        aria-label="玩法说明"
        onClick={open}
        className={`inline-flex size-9 shrink-0 items-center justify-center text-day/70 transition-[color] duration-200 ease-out hover:text-day focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-day active:brightness-95 ${className}`}
      >
        <InfoIcon />
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="report-dialog"
        onClose={markIntroSeen}
        onCancel={(event) => {
          event.preventDefault()
          close()
        }}
      >
        <div className="flex flex-col gap-4 p-5">
          <p id={titleId} className="text-lg font-semibold tracking-[0.06em]">
            玩法说明
          </p>
          <ul className="flex flex-col gap-2.5 text-base font-medium leading-relaxed tracking-[0.02em] text-day/80">
            {RULES.map((rule) => (
              <li key={rule} className="flex gap-2">
                <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-rose" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={close}
            className="mt-1 inline-flex min-h-11 items-center justify-center rounded-2xl bg-day text-base font-semibold tracking-[0.08em] text-cyc transition-[filter] duration-200 ease-out hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-day active:brightness-95"
          >
            知道了
          </button>
        </div>
      </dialog>
    </>
  )
}

function InfoIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-[22px] fill-none stroke-current stroke-[1.75]"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10v6" strokeLinecap="round" />
      <path d="M12 7h.01" strokeLinecap="round" strokeWidth="2.5" />
    </svg>
  )
}
