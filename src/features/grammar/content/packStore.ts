import type { GrammarPack } from './types'

let pack: GrammarPack | null = null

export function setGrammarPack(next: GrammarPack): void {
  pack = next
}

export function isGrammarPackLoaded(): boolean {
  return pack !== null
}

export function getGrammarPack(): GrammarPack {
  if (!pack) {
    throw new Error('Grammar pack is not loaded yet.')
  }
  return pack
}

export const grammarPack = new Proxy({} as GrammarPack, {
  get(_target, prop) {
    return getGrammarPack()[prop as keyof GrammarPack]
  },
})
