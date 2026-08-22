# Grammar Everything Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the interactive prototype (`e68fbd1`) into a spec-complete Grammar Everything module: static JSON content pack, `game_tuning.json`, `schema.sql`, `features/pictures` isolation, §11 test coverage, and bilingual README updates.

**Architecture:** Keep the existing shell / shared / features split. Replace the monolithic `pack.ts` blob with checked-in JSON files loaded at build time via a thin `loadPack.ts` validator. Engine, unlock, and storage stay pure; pages import query helpers from `content/pack.ts` (types + indexes only). Pictures code moves under `features/pictures` without behavior change.

**Tech Stack:** React 18, Vite 5, TypeScript, Vitest, React Testing Library, Tailwind 3, GSAP 3, localStorage.

## Global Constraints

- Spec: [`docs/superpowers/specs/2026-08-22-grammar-everything-design.md`](../specs/2026-08-22-grammar-everything-design.md)
- Interface chrome may be Chinese; game options stay English.
- No backend, no account sync, no SRS for grammar.
- Storage keys: pictures `name-everything/progress/v1`; grammar `grammar/progress/v1`, `grammar/reports/v1` — must never merge.
- All falling-fill tuning numbers come from `game_tuning.json`; no magic numbers in components.
- Cross-feature imports forbidden: `grammar` must not import `features/pictures` internals and vice versa; shell imports public facades only.
- Week-1 pack: each released chapter ≥1 level, each level 1 anchor + ≥3 playable; multiple chapters may be released; unreleased chapters may have no levels.
- Update `README.md` and `README.zh.md` together for any user-facing behavior/docs change.
- TDD: failing test before production code; commit after each task.

## Prototype baseline (already shipped)

Commit `e68fbd1` includes:

- Practice Home (`src/shell/`), routes, grammar pages, engine, storage, report dialog, GSAP motion
- Inline content in `src/features/grammar/content/pack.ts` and `tuning.ts`
- Partial tests: `engine.test.ts`, `PracticeHomePage.test.tsx` (6 cases)

**Not yet done (this plan):** JSON split, `schema.sql`, content validation, `features/pictures` move, §11 gap tests, README.

## File map (target)

| Action | Path |
|--------|------|
| Create | `src/features/grammar/content/chapters.json` |
| Create | `src/features/grammar/content/levels.json` |
| Create | `src/features/grammar/content/grammar_points.json` |
| Create | `src/features/grammar/content/sentences.json` |
| Create | `src/features/grammar/content/sentence_spans.json` |
| Create | `src/features/grammar/content/sentence_slots.json` |
| Create | `src/features/grammar/content/game_tuning.json` |
| Create | `src/features/grammar/content/schema.sql` |
| Create | `src/features/grammar/content/loadPack.ts` |
| Create | `src/features/grammar/content/pack.test.ts` |
| Create | `src/features/grammar/lib/unlock.test.ts` |
| Create | `src/features/grammar/lib/storage.test.ts` |
| Modify | `src/features/grammar/content/pack.ts` — types + query helpers only |
| Modify | `src/features/grammar/content/tuning.ts` — import from JSON |
| Modify | `src/features/grammar/lib/engine.ts` — import tuning from JSON path |
| Move | `src/lib/*`, `src/pages/PracticePage.tsx`, related tests → `src/features/pictures/` |
| Modify | `README.md`, `README.zh.md` |

---

### Task 1: Extract grammar content into JSON files

**Files:**
- Create: `src/features/grammar/content/chapters.json`
- Create: `src/features/grammar/content/levels.json`
- Create: `src/features/grammar/content/grammar_points.json`
- Create: `src/features/grammar/content/sentences.json`
- Create: `src/features/grammar/content/sentence_spans.json`
- Create: `src/features/grammar/content/sentence_slots.json`
- Modify: `src/features/grammar/content/pack.ts`

**Interfaces:**
- Consumes: existing `GrammarPack` shape from prototype `pack.ts`
- Produces: six JSON arrays + slim `pack.ts` exporting `grammarPack`, `levelById`, `anchorForLevel`, `playablesForLevel`, `spansForSentence`, `slotsForSentence`, `pointById`, `levelsForChapter`, `chaptersSorted`

- [ ] **Step 1: Copy data verbatim into JSON**

Move each array from `grammarPack` in `pack.ts` into its own file. Example top of `chapters.json`:

```json
[
  {
    "id": "simple",
    "title_zh": "简单句",
    "description_zh": "五大句型主干。",
    "sort_order": 1,
    "released": true
  }
]
```

Repeat for `levels.json`, `grammar_points.json`, `sentences.json`, `sentence_spans.json`, `sentence_slots.json`. Keep stable ids unchanged.

- [ ] **Step 2: Create `loadPack.ts`**

```typescript
import chapters from './chapters.json'
import levels from './levels.json'
import grammar_points from './grammar_points.json'
import sentences from './sentences.json'
import sentence_spans from './sentence_spans.json'
import sentence_slots from './sentence_slots.json'
import type { GrammarPack } from './pack'

export function loadGrammarPack(): GrammarPack {
  return {
    chapters,
    levels,
    grammar_points,
    sentences,
    sentence_spans,
    sentence_slots,
  }
}
```

Ensure `tsconfig` / Vite resolves `resolveJsonModule: true` (already typical in Vite projects).

- [ ] **Step 3: Slim down `pack.ts`**

Keep exported types. Replace inline `grammarPack` object with:

```typescript
import { loadGrammarPack } from './loadPack'

export const grammarPack = loadGrammarPack()
```

Keep all query helpers (`anchorForLevel`, etc.) building indexes from `grammarPack` as today.

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: all 89 tests PASS (no behavior change)

- [ ] **Step 5: Commit**

```bash
git add src/features/grammar/content/*.json src/features/grammar/content/loadPack.ts src/features/grammar/content/pack.ts
git commit -m "refactor(grammar): split inline pack into JSON files"
```

---

### Task 2: Extract `game_tuning.json`

**Files:**
- Create: `src/features/grammar/content/game_tuning.json`
- Modify: `src/features/grammar/content/tuning.ts`
- Modify: `docs/superpowers/specs/2026-08-22-grammar-everything-design.md` (add `correct_bounce_factor` row to §7.4 — prototype already uses it)

**Interfaces:**
- Produces: `gameTuning` object imported by `engine.ts`, `storage.ts`, `unlock.ts`, `FallingPlayPage.tsx`

- [ ] **Step 1: Write JSON**

```json
{
  "lives": 3,
  "pass_threshold_default": 3,
  "fall_duration_ms": 8000,
  "wrong_speed_factor": 0.7,
  "min_fall_duration_ms": 2500,
  "correct_bounce_factor": 0.28
}
```

- [ ] **Step 2: Update `tuning.ts`**

```typescript
import raw from './game_tuning.json'

export const gameTuning = raw
export type GameTuning = typeof gameTuning
```

- [ ] **Step 3: Patch spec §7.4 table**

Add row: `correct_bounce_factor | 0.28 | 选对一槽后剩余时间回弹比例（占 fall_duration_ms）`

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/grammar/content/game_tuning.json src/features/grammar/content/tuning.ts docs/superpowers/specs/2026-08-22-grammar-everything-design.md
git commit -m "refactor(grammar): move game tuning to JSON"
```

---

### Task 3: Add `schema.sql`

**Files:**
- Create: `src/features/grammar/content/schema.sql`

**Interfaces:**
- Produces: DDL matching spec §8.1; not executed at runtime

- [ ] **Step 1: Write schema**

Create tables: `chapters`, `levels`, `grammar_points`, `sentences`, `sentence_spans`, `sentence_slots`, `game_tuning` (key/value or JSON column), `asset_reports`. Use TEXT ids, INTEGER sort_order, BOOLEAN released, CHECK on `sentences.kind IN ('anchor','playable')`, FK constraints mirroring JSON relations.

Include comment header:

```sql
-- Grammar Everything content schema (spec §8.1)
-- Not executed by the app in week-1; JSON is source of truth.
```

Add uniqueness: one anchor per level:

```sql
CREATE UNIQUE INDEX idx_sentences_one_anchor_per_level
  ON sentences(level_id) WHERE kind = 'anchor';
```

- [ ] **Step 2: Sanity check**

Run: `npm run build`
Expected: PASS (schema is not imported by app)

- [ ] **Step 3: Commit**

```bash
git add src/features/grammar/content/schema.sql
git commit -m "docs(grammar): add content schema.sql matching spec §8.1"
```

---

### Task 4: Content pack validation tests

**Files:**
- Create: `src/features/grammar/content/pack.test.ts`

**Interfaces:**
- Consumes: `grammarPack`, helpers from `pack.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, expect, it } from 'vitest'
import {
  grammarPack,
  anchorForLevel,
  playablesForLevel,
  chaptersInOrder,
  levelsForChapter,
} from './pack'

describe('grammar pack invariants', () => {
  it('has at least one released chapter in the pack', () => {
    expect(chaptersInOrder().filter((c) => c.released).length).toBeGreaterThanOrEqual(1)
  })

  it('each released chapter has at least one level with one anchor and three playables', () => {
    for (const chapter of chaptersInOrder().filter((c) => c.released)) {
      const levels = levelsForChapter(chapter.id)
      expect(levels.length).toBeGreaterThanOrEqual(1)
      for (const level of levels) {
        const anchor = anchorForLevel(level.id)
        const playables = playablesForLevel(level.id)
        expect(anchor).toBeDefined()
        expect(playables.length).toBeGreaterThanOrEqual(3)
        for (const p of playables) {
          expect(p.en).not.toBe(anchor!.en)
        }
      }
    }
  })

  it('every anchor has at least one sentence_span', () => {
    const anchors = grammarPack.sentences.filter((s) => s.kind === 'anchor')
    for (const anchor of anchors) {
      const spans = grammarPack.sentence_spans.filter((sp) => sp.sentence_id === anchor.id)
      expect(spans.length).toBeGreaterThan(0)
    }
  })

  it('every sentence has slots covering slot_index 0..n-1', () => {
    for (const sentence of grammarPack.sentences) {
      const slots = grammarPack.sentence_slots
        .filter((s) => s.sentence_id === sentence.id)
        .sort((a, b) => a.slot_index - b.slot_index)
      expect(slots.length).toBeGreaterThan(0)
      slots.forEach((slot, i) => expect(slot.slot_index).toBe(i))
    }
  })
})
```

- [ ] **Step 2: Run test to verify it passes on current JSON**

Run: `npm test -- src/features/grammar/content/pack.test.ts`
Expected: PASS (fix JSON if any invariant fails)

- [ ] **Step 3: Commit**

```bash
git add src/features/grammar/content/pack.test.ts
git commit -m "test(grammar): assert week-1 pack invariants"
```

---

### Task 5: Unlock and queue tests (spec §11)

**Files:**
- Create: `src/features/grammar/lib/unlock.test.ts`
- Modify: `src/features/grammar/lib/engine.test.ts`

**Interfaces:**
- Consumes: real levels from pack (`dative-1`, `svo-1`), `defaultGrammarProgress`, `buildQueue`

- [ ] **Step 1: Write unlock tests**

```typescript
import { describe, expect, it } from 'vitest'
import { isLevelUnlocked, isLevelPassed, thresholdFor } from './unlock'
import { recordLevelScore, defaultGrammarProgress } from './storage'
import { levelsForChapter, levelById } from '../content/pack'

describe('level unlock', () => {
  const chapter = 'simple'
  const [first, second] = levelsForChapter(chapter)

  it('first level in chapter is always unlocked', () => {
    expect(isLevelUnlocked(first!, defaultGrammarProgress())).toBe(true)
  })

  it('second level locked until first is passed', () => {
    const progress = defaultGrammarProgress()
    expect(isLevelUnlocked(second!, progress)).toBe(false)
    const passed = recordLevelScore(progress, first!.id, thresholdFor(first!))
    expect(isLevelUnlocked(second!, passed)).toBe(true)
  })
})
```

- [ ] **Step 2: Extend engine queue tests**

Add to `engine.test.ts`:

```typescript
import { buildQueue } from './engine'
import { anchorForLevel, playablesForLevel, grammarPack } from '../content/pack'

it('learn queue starts with anchor then shuffled playables', () => {
  const levelId = 'dative-1'
  const anchor = anchorForLevel(levelId)!
  const playables = playablesForLevel(levelId)
  const queue = buildQueue('learn', anchor, playables)
  expect(queue[0]).toBe(anchor.id)
  expect(queue.slice(1).sort()).toEqual(playables.map((p) => p.id).sort())
})

it('arcade queue excludes anchors and locked levels', () => {
  const passedIds = new Set(['dative-1'])
  const pool = grammarPack.sentences.filter(
    (s) => s.kind === 'playable' && passedIds.has(s.level_id),
  )
  const queue = buildQueue('arcade', undefined, pool)
  expect(queue.every((id) => pool.some((p) => p.id === id))).toBe(true)
  expect(queue.some((id) => grammarPack.sentences.find((s) => s.id === id)?.kind === 'anchor')).toBe(false)
})
```

- [ ] **Step 3: Run tests**

Run: `npm test -- src/features/grammar/lib/unlock.test.ts src/features/grammar/lib/engine.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/features/grammar/lib/unlock.test.ts src/features/grammar/lib/engine.test.ts
git commit -m "test(grammar): cover unlock rules and queue composition"
```

---

### Task 6: Storage isolation and report export tests

**Files:**
- Create: `src/features/grammar/lib/storage.test.ts`
- Modify: `src/pages/MePage.test.tsx` (or add grammar-specific me test)

**Interfaces:**
- Consumes: `saveGrammarProgress`, `addReport`, `exportReports`, `clearReports`, pictures `saveProgress` from `src/lib/storage.ts`

- [ ] **Step 1: Write storage tests**

```typescript
import { describe, expect, it, beforeEach } from 'vitest'
import {
  saveGrammarProgress,
  loadGrammarProgress,
  addReport,
  exportReports,
  clearReports,
  defaultGrammarProgress,
} from './storage'
import { saveProgress, loadProgress, defaultProgress } from '../../../lib/storage'

beforeEach(() => localStorage.clear())

describe('grammar storage', () => {
  it('uses separate keys from pictures progress', () => {
    saveProgress({ ...defaultProgress(), streaks: { count: 7, lastDate: '2026-08-22' } })
    saveGrammarProgress({ ...defaultGrammarProgress(), passedLevelIds: ['dative-1'] })
    expect(loadProgress().streaks.count).toBe(7)
    expect(loadGrammarProgress().passedLevelIds).toEqual(['dative-1'])
    localStorage.removeItem('grammar/progress/v1')
    expect(loadProgress().streaks.count).toBe(7)
  })

  it('exportReports returns asset_reports shape and clearReports empties list', () => {
    addReport({ asset_type: 'sentence', asset_id: 's-d1-anchor', level_id: 'dative-1', note: 'typo' })
    const json = exportReports()
    const parsed = JSON.parse(json) as Array<Record<string, unknown>>
    expect(parsed).toHaveLength(1)
    expect(parsed[0]).toMatchObject({
      asset_type: 'sentence',
      asset_id: 's-d1-anchor',
      level_id: 'dative-1',
      note: 'typo',
    })
    expect(typeof parsed[0]!.created_at).toBe('string')
    clearReports()
    expect(JSON.parse(exportReports())).toHaveLength(0)
  })

  it('addReport rejects empty note when required by UI', () => {
    expect(() =>
      addReport({ asset_type: 'grammar_point', asset_id: 'gp-s', level_id: null, note: '  ' }),
    ).toThrow()
  })
})
```

Adjust throw expectation to match actual `addReport` validation in prototype.

- [ ] **Step 2: Add MePage export smoke test**

Extend `MePage.test.tsx`:

```typescript
it('exports grammar reports as JSON download trigger', async () => {
  saveGrammarProgress(defaultGrammarProgress())
  addReport({ asset_type: 'sentence', asset_id: 's-d1-anchor', level_id: 'dative-1', note: 'x' })
  // render MePage, click 导出语法报错, assert no throw / link or clipboard path
})
```

- [ ] **Step 3: Run tests**

Run: `npm test -- src/features/grammar/lib/storage.test.ts src/pages/MePage.test.tsx`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/features/grammar/lib/storage.test.ts src/pages/MePage.test.tsx
git commit -m "test(grammar): storage isolation and report export"
```

---

### Task 7: Move pictures feature under `features/pictures`

**Files:**
- Move: `src/lib/deck.ts`, `deck.test.ts`, `storage.ts`, `storage.test.ts`, `highlightWord.ts`, `highlightWord.test.ts`, `playAudio.ts`, `playAudio.test.ts`, `tts.ts`, `tts.test.ts`
- Move: `src/content/t1-cards.json`, `loadCards.ts`, `loadCards.test.ts`
- Move: `src/pages/PracticePage.tsx`, `PracticePage.test.tsx`
- Move: `src/components/PracticeCard.tsx`, `PracticeCard.test.tsx` (if pictures-only)
- Create: `src/features/pictures/index.ts` — re-export public entry points
- Modify: `src/App.tsx`, `src/shell/practiceModules.ts`, import paths across repo

**Interfaces:**
- Produces: `features/pictures/index.ts` exporting `PracticePage` (or default route component) and any shell-needed types

- [ ] **Step 1: Write failing import test**

Add to `src/App.test.tsx`:

```typescript
it('picture practice route still works after pictures feature move', async () => {
  // navigate to /practice/pictures, expect Aha! button
})
```

- [ ] **Step 2: Move files and fix imports**

Follow spec §10.1 rule 7. Update all imports from `../lib/storage` → `../features/pictures/lib/storage` (or via `features/pictures` barrel). `MePage` continues importing pictures progress from pictures public API only.

- [ ] **Step 3: Run full suite**

Run: `npm test && npm run build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: move pictures practice under features/pictures"
```

---

### Task 8: README and verification checklist

**Files:**
- Modify: `README.md`, `README.zh.md`

- [ ] **Step 1: Update Roadmap**

Mark Grammar Everything learn + falling-fill as in progress or done (substitute + identify still roadmap). Add link to this plan:

```markdown
Implementation plan: [`docs/superpowers/plans/2026-08-22-grammar-everything.md`](docs/superpowers/plans/2026-08-22-grammar-everything.md)
```

- [ ] **Step 2: Add Practice Home section (both READMEs)**

Document:

- `/` is Practice Home; countdown starts only on `/practice/pictures`
- Grammar learn / play routes
- Grammar reports export on Me page
- Content lives in `src/features/grammar/content/*.json`

- [ ] **Step 3: Extend Week-1 verification checklist**

Add manual smoke items:

- [ ] Home: 语法游戏 disabled until one level passed; toast on click
- [ ] Grammar learn: chapter lock, linear unlock, learn page spans, start game
- [ ] Falling fill: land loses life, wrong speeds up, pass threshold unlocks next level
- [ ] Me: export grammar reports JSON

Mirror structure in `README.zh.md`.

- [ ] **Step 4: Run full verification**

Run: `npm test && npm run build`
Expected: all tests PASS, build succeeds

- [ ] **Step 5: Commit**

```bash
git add README.md README.zh.md
git commit -m "docs: document Grammar Everything routes and content layout"
```

---

## Spec coverage self-review

| Spec § | Task |
|--------|------|
| §5.1 Home tiles / arcade lock | Prototype + Task 5 tests |
| §5.2 linear unlock | Prototype + Task 5 |
| §5.3 arcade pool | Prototype + Task 5 |
| §7.4 tuning from config | Task 2 |
| §8.1 content model | Tasks 1, 3, 4 |
| §8.2 week-1 pack | Task 4 |
| §8.3 local progress keys | Task 6 |
| §9 reports export | Task 6 |
| §10 architecture / pictures move | Task 7 |
| §11 testing list | Tasks 4–6, existing engine/home tests |
| §12 later (image prompt, recognition) | Out of scope |

## Execution handoff

Plan saved to `docs/superpowers/plans/2026-08-22-grammar-everything.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks
2. **Inline Execution** — execute tasks in this session with executing-plans checkpoints

Which approach?
