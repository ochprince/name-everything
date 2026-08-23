export function LockIcon({
  className = 'size-6 text-[#d4c69a]/55',
}: {
  className?: string
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

/** Align with LearnListPage unlocked level tiles */
export const levelTileMinClass = 'min-h-[8.75rem]'

/** Champagne metal: left cool-white → right soft gold (not pure yellow gold). */
const lockedInk = 'text-[#d4c69a]/55'
const lockedInkSoft = 'text-[#d4c69a]/40'

const lockedFrame =
  'rounded-2xl bg-gradient-to-r from-[#f3eee3] via-[#e5d9b5] to-[#cbb87a] p-px transition-[filter] duration-200 ease-out hover:brightness-110'

const lockedInner =
  'flex w-full min-h-[8.75rem] items-center justify-between gap-3 rounded-[0.9rem] bg-cyc/85 px-4 py-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e5d9b5] active:brightness-95'

export function LockPlaceholder({
  label = '未解锁',
}: {
  label?: string
}) {
  return (
    <div aria-label={label} className={lockedFrame}>
      <div className={`${lockedInner} justify-center`}>
        <span className="flex flex-col items-center gap-2">
          <LockIcon className={`size-7 ${lockedInk}`} />
          <span className={`text-sm font-semibold tracking-[0.12em] ${lockedInk}`}>
            {label}
          </span>
        </span>
      </div>
    </div>
  )
}

export function LockedLevelTile({
  title,
  levelNo,
  detail,
  onBlocked,
}: {
  title: string
  levelNo?: string
  detail?: string
  onBlocked: () => void
}) {
  const ariaLabel = `${title}, 未解锁`
  return (
    <button type="button" aria-label={ariaLabel} onClick={onBlocked} className={`${lockedFrame} w-full text-left`}>
      <span className={lockedInner}>
        <span className="min-w-0 flex-1">
          {levelNo ? (
            <span className={`block text-xs font-semibold tracking-[0.18em] ${lockedInkSoft}`}>
              LEVEL {levelNo}
            </span>
          ) : null}
          <span className={`mt-1 block text-lg font-semibold tracking-[0.04em] ${lockedInk}`}>
            {title}
          </span>
          {detail ? (
            <span className={`mt-1 block truncate text-base font-medium tracking-[0.04em] ${lockedInkSoft}`}>
              {detail}
            </span>
          ) : null}
        </span>
        <LockIcon className={`size-6 shrink-0 ${lockedInkSoft}`} />
      </span>
    </button>
  )
}
