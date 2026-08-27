import { loadProgress } from '../features/pictures/lib/storage'

let audioContext: AudioContext | null = null

function uiSoundEnabled(): boolean {
  return loadProgress().settings.uiSound
}

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctx =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext
  if (!Ctx) return null
  if (!audioContext) audioContext = new Ctx()
  return audioContext
}

/** Must run inside a user gesture; call resume synchronously, do not await. */
export function unlockUiSound(): void {
  if (!uiSoundEnabled()) return
  const ctx = getContext()
  if (!ctx) return
  if (ctx.state === 'suspended') void ctx.resume()
}

function scheduleTone(
  ctx: AudioContext,
  frequency: number,
  duration: number,
  volume: number,
  type: OscillatorType = 'sine',
  when = 0,
) {
  const start = ctx.currentTime + when
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.value = frequency
  gain.gain.setValueAtTime(volume, start)
  gain.gain.linearRampToValueAtTime(0, start + duration)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(start)
  osc.stop(start + duration)
}

/** Schedule tones in the current event turn; resume() stays synchronous. */
function playTones(
  tones: Array<{
    frequency: number
    duration: number
    volume: number
    type?: OscillatorType
    when?: number
  }>,
) {
  if (!uiSoundEnabled()) return
  // 页面不可见时不调度：iOS Safari 切后台 AudioContext 自动 suspend，
  // 此时调度的音效会排队到切回前台 resume 后才响——用户实测"切出再切回
  // 突然听到游戏失败声音"。后台静音后，切回不会再有补响。
  if (document.hidden) return

  const ctx = getContext()
  if (!ctx) return

  if (ctx.state === 'suspended') void ctx.resume()

  const lead = ctx.state === 'running' ? 0 : 0.05
  for (const tone of tones) {
    scheduleTone(
      ctx,
      tone.frequency,
      tone.duration,
      tone.volume,
      tone.type ?? 'sine',
      lead + (tone.when ?? 0),
    )
  }
}

export function resetUiSound(): void {
  void audioContext?.close()
  audioContext = null
}

export function playUiTap(): void {
  playTones([{ frequency: 620, duration: 0.05, volume: 0.08 }])
}

export function playUiCorrect(): void {
  playTones([{ frequency: 698, duration: 0.08, volume: 0.12 }])
}

export function playUiSuccess(): void {
  playTones([
    { frequency: 523, duration: 0.08, volume: 0.1 },
    { frequency: 784, duration: 0.12, volume: 0.1, when: 0.07 },
  ])
}

export function playUiFail(): void {
  playTones([
    { frequency: 330, duration: 0.14, volume: 0.28, type: 'square' },
    { frequency: 220, duration: 0.2, volume: 0.24, when: 0.1 },
  ])
}
