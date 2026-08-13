import type { Card } from '../types/card'
import raw from './t1-cards.json'

export function loadCards(): Card[] {
  return raw as Card[]
}
