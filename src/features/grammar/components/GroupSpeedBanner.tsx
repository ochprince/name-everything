import { useEffect, useRef } from 'react'
import gsap from 'gsap'

type GroupSpeedBannerProps = {
  groupNumber: number
  onComplete: () => void
}

export function GroupSpeedBanner({ groupNumber, onComplete }: GroupSpeedBannerProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLParagraphElement>(null)
  const hintRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const root = rootRef.current
    const label = labelRef.current
    const hint = hintRef.current
    if (!root || !label || !hint) return

    const ctx = gsap.context(() => {
      gsap.set(root, { opacity: 0 })
      gsap.set(label, { y: 18, opacity: 0, scale: 0.92 })
      gsap.set(hint, { y: 10, opacity: 0 })

      const tl = gsap.timeline({
        onComplete: () => {
          onComplete()
        },
      })

      tl.to(root, { opacity: 1, duration: 0.2, ease: 'power2.out' })
        .to(
          label,
          { y: 0, opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(1.6)' },
          0.05,
        )
        .to(hint, { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out' }, 0.2)
        .to({}, { duration: 0.75 })
        .to([label, hint], { y: -8, opacity: 0, duration: 0.25, ease: 'power2.in' }, '+=0')
        .to(root, { opacity: 0, duration: 0.2, ease: 'power2.in' }, '-=0.1')
    }, root)

    return () => ctx.revert()
  }, [groupNumber, onComplete])

  return (
    <div
      ref={rootRef}
      className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-cyc/55 px-6 backdrop-blur-[2px]"
      role="status"
      aria-live="polite"
      aria-label={`第 ${groupNumber} 组，速度提升`}
    >
      <div className="flex flex-col items-center gap-2 rounded-3xl border border-gold/40 bg-cyc/90 px-8 py-6 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
        <p
          ref={labelRef}
          className="text-2xl font-semibold tracking-[0.12em] text-day"
        >
          第 {groupNumber} 组
        </p>
        <p ref={hintRef} className="text-base font-medium tracking-[0.08em] text-gold">
          速度提升
        </p>
      </div>
    </div>
  )
}
