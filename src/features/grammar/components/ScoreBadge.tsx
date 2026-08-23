export function ScoreBadge({ score, need }: { score: number; need: number }) {
  const cleared = need > 0 && score >= need
  return (
    <div
      className="inline-flex min-w-12 items-center justify-end gap-1.5 text-day"
      aria-label={
        cleared ? `最高 ${score}，已过关` : `最高 ${score}，过关 ${need} 句`
      }
      title={cleared ? `最高 ${score} · 已过关` : `最高 ${score}/${need}`}
    >
      <MedalIcon />
      <span className="text-sm font-semibold tabular-nums tracking-[0.06em]">
        {cleared ? score : `${score}/${need}`}
      </span>
    </div>
  )
}

/** Medal (奖章) — circle face + ribbon tails. */
function MedalIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-4 fill-none stroke-current stroke-[1.75] text-rose"
    >
      <circle cx="12" cy="10" r="5.25" />
      <circle cx="12" cy="10" r="2.25" />
      <path
        d="M9.2 14.6 7.5 21l4.5-2.2L16.5 21l-1.7-6.4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}
