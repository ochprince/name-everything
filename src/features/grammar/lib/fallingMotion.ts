import gsap from 'gsap'

export function resetSentenceMotion(el: HTMLElement | null) {
  if (!el) return
  gsap.killTweensOf(el)
  gsap.set(el, { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 })
}

/** 选对：向上弹一下，给玩家喘息 */
export function bounceSentenceUp(el: HTMLElement) {
  gsap.killTweensOf(el)
  gsap.fromTo(
    el,
    { y: 0 },
    {
      y: -36,
      duration: 0.32,
      ease: 'power2.out',
      yoyo: true,
      repeat: 1,
    },
  )
}

/** 落地：文字碎开（不阻塞切页） */
export function shatterSentence(el: HTMLElement) {
  gsap.killTweensOf(el)
  gsap.to(el, {
    scale: 1.18,
    opacity: 0,
    rotation: '+=8',
    duration: 0.1,
    ease: 'power3.in',
    transformOrigin: '50% 100%',
  })
}
