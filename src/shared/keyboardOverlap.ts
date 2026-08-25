/**
 * Board inset from soft keyboard. Only apply while an editable is focused —
 * after blur, visualViewport can stay “open” until a full reload (F5), which
 * would otherwise compress the fall zone to ~0px and false-trigger land fails.
 */
export function effectiveKeyboardOverlapPx(
  rawOverlapPx: number,
  inputFocused: boolean,
): number {
  if (!inputFocused) return 0
  return Math.max(0, rawOverlapPx)
}

export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'TEXTAREA' || tag === 'INPUT'
}
