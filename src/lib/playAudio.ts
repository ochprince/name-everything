import { speak } from './tts'

const SILENCE_WAV =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'

let current: HTMLAudioElement | null = null
let shared: HTMLAudioElement | null = null
let unlocked = false
let generation = 0

function cancelSpeech(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}

export function resetCardAudioGate(): void {
  stopCardAudio()
  shared = null
  unlocked = false
}

export function unlockCardAudio(): void {
  if (typeof Audio === 'undefined') return
  if ('speechSynthesis' in window) {
    window.speechSynthesis.resume?.()
  }
  if (unlocked && shared) return
  if (!shared) {
    shared = new Audio(SILENCE_WAV)
    shared.volume = 0
  }
  void Promise.resolve(shared.play()).then(() => {
    unlocked = true
    if (!shared || current) return
    shared.pause()
    shared.currentTime = 0
    shared.volume = 1
  }).catch(() => {})
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
    const audio = shared ?? new Audio(url)
    if (shared) {
      audio.src = url
      audio.volume = 1
    }
    current = audio
    audio.play().catch(() => {
      if (token !== generation) return
      speak(fallbackText)
    })
    return
  }
  speak(fallbackText)
}
