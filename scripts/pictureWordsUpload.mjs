/**
 * Pure helpers for picture_words upload: skip AI-corrected rows
 * and assign sort_order around their reserved slots.
 */

export function excludeAiCorrected(rows, correctedWords) {
  const skip = new Set(correctedWords)
  return rows.filter((row) => !skip.has(row.word))
}

export function assignSortOrders(rows, reservedSortOrders = []) {
  const reserved = new Set(reservedSortOrders)
  let next = 1
  return rows.map((row) => {
    while (reserved.has(next)) next += 1
    const assigned = { ...row, sort_order: next }
    next += 1
    return assigned
  })
}
