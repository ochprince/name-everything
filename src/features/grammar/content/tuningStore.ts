import type { GameTuning } from './types'

let gameTuningState: GameTuning | null = null

export function setGameTuning(tuning: GameTuning): void {
  gameTuningState = tuning
}

export function isGameTuningLoaded(): boolean {
  return gameTuningState !== null
}

export function getGameTuning(): GameTuning {
  if (!gameTuningState) {
    throw new Error('Game tuning is not loaded yet.')
  }
  return gameTuningState
}

export const gameTuning = new Proxy({} as GameTuning, {
  get(_target, prop) {
    return getGameTuning()[prop as keyof GameTuning]
  },
})
