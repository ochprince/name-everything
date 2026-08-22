import trophyPassed from '../assets/trophy-passed.svg'

/** Passed-level trophy — iconfont 奖杯2-1 (multicolor). */
export function LevelPassTrophy() {
  return (
    <span
      aria-hidden="true"
      className="relative flex size-11 shrink-0 items-center justify-center"
    >
      <img
        src={trophyPassed}
        alt=""
        className="relative size-10 drop-shadow-[0_1px_3px_rgba(80,50,0,0.3)]"
        draggable={false}
      />
    </span>
  )
}
