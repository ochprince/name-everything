import { speak } from './tts'

let current: HTMLAudioElement | null = null
let generation = 0

function cancelSpeech(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}

export function stopCardAudio(): void {
  generation += 1
  if (current) {
    current.pause()
    current = null
  }
  cancelSpeech()
}

export function playCardAudio(url: string | undefined, fallbackText: string): void {
  generation += 1
  const token = generation

  if (current) {
    current.pause()
    current = null
  }
  cancelSpeech()

  if (url && /^https?:\/\//.test(url)) {
    const audio = new Audio(url)
    current = audio
    audio.play().catch(() => {
      if (token !== generation) return
      speak(fallbackText)
    })
    return
  }
  speak(fallbackText)
}
