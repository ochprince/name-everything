import { KEYBOARD_OVERLAP_LOCK_PX } from '../../../shared/appViewport'

/** Min fall-zone height before DOM land checks are trusted (collapsed layout → false positive). */
export const MIN_FALL_ZONE_HEIGHT_PX = 8

/** True when the falling sentence wrap has reached the land line at the zone bottom. */
export function sentenceHitBottom(
  zoneEl: HTMLElement,
  wrapEl: HTMLElement,
  minZoneHeightPx: number = MIN_FALL_ZONE_HEIGHT_PX,
): boolean {
  const zone = zoneEl.getBoundingClientRect()
  const wrap = wrapEl.getBoundingClientRect()
  // Zero/near-zero zone (stale keyboard inset, pre-layout) makes bottoms equal → false land.
  if (zone.height < minZoneHeightPx) return false
  return wrap.bottom >= zone.bottom - 2
}

/**
 * DOM land uses the blue line in the fall zone. Focusing the produce field
 * retargets that line upward (keyboard inset / viewport resize). A mid-fall
 * sentence then looks “already landed” even though remainingMs is fine.
 * While the board is retargeting, trust the timer only.
 */
export function shouldTrustDomLandCheck(input: {
  inputFocused: boolean
  keyboardOverlapPx: number
  overlapLockPx?: number
}): boolean {
  if (input.inputFocused) return false
  const lock = input.overlapLockPx ?? KEYBOARD_OVERLAP_LOCK_PX
  if (input.keyboardOverlapPx > lock) return false
  return true
}
