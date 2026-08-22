import '@testing-library/jest-dom'
import { afterEach, vi } from 'vitest'
import { resetCardAudioGate } from '../features/pictures/lib/playAudio'

Object.defineProperty(HTMLMediaElement.prototype, 'play', {
  configurable: true,
  writable: true,
  value: vi.fn(() => Promise.resolve()),
})
Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
  configurable: true,
  writable: true,
  value: vi.fn(),
})

afterEach(() => {
  resetCardAudioGate()
})
