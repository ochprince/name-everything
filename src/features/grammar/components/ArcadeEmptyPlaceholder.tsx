import trophyPassed from '../assets/trophy-passed.svg'

export function ArcadeEmptyPlaceholder() {
  return (
    <div
      aria-hidden="true"
      className="relative flex flex-1 flex-col items-center justify-center overflow-hidden rounded-2xl border border-day/10 bg-gradient-to-b from-cobalt/35 via-cyc to-cyc px-6 py-10"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(0,47,167,0.45),transparent_70%)]" />
      <img
        src={trophyPassed}
        alt=""
        className="relative size-16 opacity-[0.18]"
        draggable={false}
      />
      <p className="relative mt-4 text-center text-sm font-medium tracking-[0.06em] text-day/40">
        完成挑战后，记录会出现在这里
      </p>
    </div>
  )
}
