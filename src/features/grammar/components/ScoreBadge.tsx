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
      <TrophyIcon />
      <span className="text-sm font-semibold tabular-nums tracking-[0.06em]">
        {cleared ? score : `${score}/${need}`}
      </span>
    </div>
  )
}

function TrophyIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-4 fill-none stroke-current stroke-[1.75] text-rose"
    >
      <path d="M8 4h8v3a4 4 0 0 1-8 0V4Z" strokeLinejoin="round" />
      <path d="M6 4H4v1a2 2 0 0 0 2 2M18 4h2v1a2 2 0 0 1-2 2" strokeLinecap="round" />
      <path d="M12 11v3M9 20h6M10 14h4v3a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-3Z" strokeLinejoin="round" />
    </svg>
  )
}
