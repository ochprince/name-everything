export function LockIcon({ className = 'size-6 stroke-day/40' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

/** 与 LearnListPage 已解锁关卡磁贴（标题 + 标杆句 + 得分）对齐 */
export const levelTileMinClass = 'min-h-[7.25rem]'

export function LockPlaceholder({
  label = '未解锁',
}: {
  label?: string
}) {
  return (
    <div
      aria-label={label}
      className={`flex ${levelTileMinClass} items-center justify-center rounded-2xl border border-day/30 bg-cyc/50`}
    >
      <LockIcon />
    </div>
  )
}

export function LockedLevelTile({
  title,
  onBlocked,
}: {
  title: string
  onBlocked: () => void
}) {
  return (
    <button
      type="button"
      aria-label={`${title}，未解锁`}
      onClick={onBlocked}
      className={`flex w-full ${levelTileMinClass} items-center justify-between gap-3 rounded-2xl border border-day/30 bg-cyc/50 px-4 py-4 text-left transition-[border-color] duration-200 ease-out hover:border-day/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-day active:brightness-95`}
    >
      <span className="text-lg font-semibold tracking-[0.04em] text-day/45">{title}</span>
      <LockIcon className="size-5 shrink-0 stroke-day/35" />
    </button>
  )
}
