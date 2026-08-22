#!/usr/bin/env node
/**
 * Find half-open [start, end) indices for a substring in a sentence.en string.
 *
 * Usage:
 *   node .cursor/skills/grammar-content-pack/scripts/span-offset.mjs "<en>" "<substring>"
 *
 * Example:
 *   node .cursor/skills/grammar-content-pack/scripts/span-offset.mjs \
 *     "She pushed the door." "pushed"
 *   # start=4 end=10 slice="pushed"
 */

const [en, needle] = process.argv.slice(2)

if (!en || !needle) {
  console.error('Usage: span-offset.mjs "<en>" "<substring>"')
  process.exit(2)
}

const start = en.indexOf(needle)
if (start === -1) {
  console.error(`Not found: "${needle}"`)
  console.error(`In: "${en}"`)
  process.exit(1)
}

const end = start + needle.length
const slice = en.slice(start, end)

console.log(`start=${start}`)
console.log(`end=${end}`)
console.log(`slice=${JSON.stringify(slice)}`)
console.log(`length=${en.length}`)

if (slice !== needle) {
  console.error('Warning: slice mismatch')
  process.exit(1)
}
