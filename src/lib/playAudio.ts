import { speak } from './tts'

let current: HTMLAudioElement | null = null

export function playCardAudio(url: string | undefined, fallbackText: string): void {
  if (current) {
    current.pause()
    current = null
  }
  if (url && /^https?:\/\//.test(url)) {
    const audio = new Audio(url)
    current = audio
    audio.play().catch(() => speak(fallbackText))
    return
  }
  speak(fallbackText)
}
