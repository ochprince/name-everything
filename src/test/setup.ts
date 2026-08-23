import '@testing-library/jest-dom'
import { afterEach, vi } from 'vitest'
import { resetCardAudioGate } from '../features/pictures/lib/playAudio'
import { resetUiSound } from '../shared/uiSound'
import { setGrammarPack } from '../features/grammar/content/packStore'
import { setGameTuning } from '../features/grammar/content/tuningStore'
import {
  loadGameTuningFromJson,
  loadGrammarPackFromJson,
} from '../features/grammar/content/loadPackFromJson'

setGrammarPack(loadGrammarPackFromJson())
setGameTuning(loadGameTuningFromJson())

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
  resetUiSound()
})
