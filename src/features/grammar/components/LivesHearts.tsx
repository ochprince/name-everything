import { Heart } from 'lucide-react'
import { gameTuning } from '../content/tuning'

type LivesHeartsProps = {
  count: number
  max?: number
  size?: 'sm' | 'md'
}

const ICON_PX = {
  sm: 14,
  md: 22,
} as const

export function LivesHearts({
  count,
  max = gameTuning.lives,
  size = 'sm',
}: LivesHeartsProps) {
  const iconSize = ICON_PX[size]

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
