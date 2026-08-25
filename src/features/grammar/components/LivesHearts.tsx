import { useEffect, useRef } from 'react'
import { Heart } from 'lucide-react'
import { gameTuning } from '../content/tuning'
import { breakHeart } from '../lib/celebrate'

type LivesHeartsProps = {
  count: number
  max?: number
  size?: 'sm' | 'md'
  /** 刚失去的心（要碎）下标（0-based，从左侧亮心数起）；缺省不播碎心动画。 */
  breakingIndex?: number | null
}

const ICON_PX = {
  sm: 14,
  md: 22,
} as const

export function LivesHearts({
  count,
  max = gameTuning.lives,
  size = 'sm',
  breakingIndex = null,
}: LivesHeartsProps) {
  const iconSize = ICON_PX[size]
  const heartRefs = useRef<(SVGSVGElement | null)[]>([])

  useEffect(() => {
    if (breakingIndex == null) return
    const el = heartRefs.current[breakingIndex]
    if (el) breakHeart(el)
  }, [breakingIndex])

  return (
    <p
      aria-label={`剩余 ${count} 命`}
      className={`flex items-center ${size === 'sm' ? 'gap-0.5' : 'gap-1.5'}`}
    >
      {Array.from({ length: max }, (_, index) => {
        const alive = index < count
        return (
          <Heart
            key={index}
            ref={(node) => {
              heartRefs.current[index] = node
            }}
            aria-hidden="true"
            size={iconSize}
            className={
              alive
                ? 'fill-rose text-rose'
                : 'fill-none text-rose/35'
            }
            strokeWidth={alive ? 1.75 : 2}
          />
        )
      })}
    </p>
  )
}
