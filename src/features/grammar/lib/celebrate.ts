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

const HEART_COLOR = 'rgba(232, 165, 152, 0.9)' // rose

/** 心碎：心形震碎放大淡出 + 碎片 Physics2D 散落（失败页掉命）。 */
export function breakHeart(el: Element): void {
  const rect = el.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2

  // 心形本体：放大震碎 + 淡出
  gsap.killTweensOf(el)
  gsap.fromTo(
    el,
    { scale: 1, opacity: 1 },
    {
      scale: 1.3,
      opacity: 0,
      duration: 0.4,
      ease: 'power2.out',
      clearProps: 'scale,opacity',
    },
  )

  // 碎片：方块/三角混合，从心位置向四周 Physics2D 散落旋转
  const layer = makeLayer(document.body)
  for (let i = 0; i < 12; i++) {
    const shard = document.createElement('span')
    const size = 3 + Math.random() * 4
    const clip =
      Math.random() < 0.5
        ? `polygon(50% 0, 100% 100%, 0 100%)` // 三角
        : undefined // 方块
    shard.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;width:${size}px;height:${size}px;background:${HEART_COLOR};transform:translate(-50%,-50%)${
      clip ? `;clip-path:${clip}` : ''
    }`
    layer.appendChild(shard)
    gsap.to(shard, {
      physics2D: {
        angle: Math.random() * 360,
        velocity: 70 + Math.random() * 130,
        gravity: 520,
      },
      rotation: Math.random() * 200 - 100,
      opacity: 0,
      duration: 0.7 + Math.random() * 0.5,
      ease: 'power1.out',
      onComplete: () => shard.remove(),
    })
  }
  gsap.delayedCall(1.3, () => layer.remove())
}
