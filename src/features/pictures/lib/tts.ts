import { isQuark } from '../../../shared/isQuark'

// 夸克浏览器（iOS/安卓）上 speechSynthesis 调用存在整屏黑屏风险
// （实测自动发音场景黑屏，手动 Aha! 不黑；黑屏须刷新恢复）。
// 自动发音已由调用点按夸克拦截，这里保留 no-op 作为防御层，
// 防 mp3 播放失败时 TTS 兜底误触黑屏。
export function speak(text: string): void {
  if (isQuark()) return
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'en-US'
  window.speechSynthesis.speak(u)
}
