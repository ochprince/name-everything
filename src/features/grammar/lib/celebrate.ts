import gsap from 'gsap'
import { Physics2DPlugin } from 'gsap/Physics2DPlugin'

gsap.registerPlugin(Physics2DPlugin)

/** 主题色粒子（cyc 近黑不参与；day/rose/gold/cobalt 在深色背景上亮眼）。 */
const THEME_COLORS = ['#f4f1ea', '#e8a598', '#d4c69a', '#002FA7'] as const

function makeLayer(container: HTMLElement): HTMLElement {
  const layer = document.createElement('div')
  layer.setAttribute('aria-hidden', 'true')
  layer.style.cssText =
    'position:fixed;inset:0;pointer-events:none;z-index:50;overflow:hidden'
  container.appendChild(layer)
  return layer
}

function makeParticle(color: string): HTMLElement {
  const particle = document.createElement('span')
  const size = 6 + Math.random() * 6
  particle.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:9999px;background:${color};box-shadow:0 0 8px ${color};transform:translate(-50%,-50%)`
  return particle
}

/** 在 layer 内 (xPct, yPct)（视口百分比）爆开一圈 Physics2D 粒子。 */
function burstAt(
  layer: HTMLElement,
  xPct: number,
  yPct: number,
  count: number,
): void {
  for (let i = 0; i < count; i++) {
    const color = THEME_COLORS[Math.floor(Math.random() * THEME_COLORS.length)]!
    const particle = makeParticle(color)
    particle.style.left = `${xPct}%`
    particle.style.top = `${yPct}%`
    layer.appendChild(particle)
    gsap.to(particle, {
      physics2D: {
        angle: Math.random() * 360,
        velocity: 140 + Math.random() * 160,
        gravity: 420,
      },
      opacity: 0,
      scale: 0.4,
      duration: 1 + Math.random() * 0.5,
      delay: Math.random() * 0.1,
      ease: 'power2.out',
      onComplete: () => particle.remove(),
    })
  }
}

/** 单发烟花：从屏幕中心爆开（单句成功页）。 */
export function fireSingleBurst(container: HTMLElement): void {
  const layer = makeLayer(container)
  burstAt(layer, 50, 50, 26)
  gsap.delayedCall(2, () => layer.remove())
}

/** 多发烟花：3 发错开、位置随机分布（最终成功页 / 结算页成功态）。 */
export function fireMultiBurst(container: HTMLElement, rounds = 3): void {
  const layer = makeLayer(container)
  for (let round = 0; round < rounds; round++) {
    gsap.delayedCall(round * 0.35, () => {
      burstAt(layer, 25 + Math.random() * 50, 30 + Math.random() * 35, 22)
    })
  }
  gsap.delayedCall(rounds * 0.35 + 1.8, () => layer.remove())
}

/** 小失落：内容块下沉 + 微暗后回弹（失败页 / 结算页失败态）。 */
export function playLetdown(el: HTMLElement): void {
  gsap.killTweensOf(el)
  gsap.fromTo(
    el,
    { y: 0, opacity: 1 },
    {
      y: 10,
      opacity: 0.85,
      duration: 0.28,
      ease: 'power2.in',
      yoyo: true,
      repeat: 1,
      clearProps: 'y,opacity',
    },
  )
}

/** 标题快速水平抖动（配合小失落）。 */
export function shakeTitle(el: HTMLElement): void {
  gsap.killTweensOf(el)
  gsap.fromTo(
    el,
    { x: 0 },
    { x: 4, duration: 0.06, repeat: 5, yoyo: true, ease: 'power1.inOut', clearProps: 'x' },
  )
}
