# Grammar Produce Answer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** In grammar level drills and arcade challenge, randomly make ~50% of falling sentences whole-sentence English input (`produce`) instead of slot MCQ, with lenient matching against `sentence.en`.

**Architecture:** Keep the shared `FallingPlayPage` + `engine.ts` loop. Add `answerMode` on `FallingState`, pick per sentence, stretch fall duration for `produce`, and branch the bottom UI between 4-option grid and input+submit. Pure compare helpers live in a new `englishAnswerCompare.ts` module with Vitest coverage.

**Tech Stack:** React 18, TypeScript, Vitest, existing grammar `game_tuning.json` / `FallingPlayPage`.

## Global Constraints

- Spec: [`docs/superpowers/specs/2026-08-25-grammar-produce-answer-design.md`](../specs/2026-08-25-grammar-produce-answer-design.md)
- Scope: `level` + `arcade` via `FallingPlayPage` only; no new sentence generation / skeleton UI / difficulty modes
- Tuning numbers only from `game_tuning.json` (`produce_answer_ratio`, `produce_fall_duration_factor`)
- Compare: lowercase + expand contractions + strip punctuation + collapse whitespace; no synonym / word-order / a-an fuzz
- Empty submit: no-op (no wrong, no life loss, no speed-up)
- Update `README.md` and `README.zh.md` together
- TDD: failing test before production code; commit after each task
- Do not change content pack sentence/slot JSON shapes

## File map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/features/grammar/lib/englishAnswerCompare.ts` | Normalize + match English answers |
| Create | `src/features/grammar/lib/englishAnswerCompare.test.ts` | Compare unit tests |
| Modify | `src/features/grammar/content/game_tuning.json` | Add produce ratio + fall factor |
| Modify | `src/features/grammar/content/types.ts` | Extend `GameTuning` |
| Modify | `src/features/grammar/lib/engine.ts` | `AnswerMode`, state field, pick/duration helpers, `startRound`/`beginSentence` |
| Modify | `src/features/grammar/lib/engine.test.ts` | Mode + duration + default mcq regression |
| Modify | `src/features/grammar/pages/FallingPlayPage.tsx` | Pick mode per sentence; produce UI + submit |
| Modify | `README.md`, `README.zh.md` | Note 50% produce recall vs true substitution |

**Note:** Supabase `game_tuning` is key/value; local JSON is enough for app default. If remote rows omit the new keys, add them in ops separately — not a blocker for this plan.

---

### Task 1: Lenient English answer compare

**Files:**
- Create: `src/features/grammar/lib/englishAnswerCompare.ts`
- Create: `src/features/grammar/lib/englishAnswerCompare.test.ts`

**Interfaces:**
- Consumes: nothing from later tasks
- Produces:
  - `normalizeEnglishForCompare(input: string): string`
  - `englishAnswersMatch(a: string, b: string): boolean`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import {
  englishAnswersMatch,
  normalizeEnglishForCompare,
} from './englishAnswerCompare'

describe('englishAnswerCompare', () => {
  it('lowercases and strips punctuation and extra spaces', () => {
    expect(normalizeEnglishForCompare("  He said, \"Hello!\"  ")).toBe('he said hello')
    expect(englishAnswersMatch('Hello, world!', 'hello world')).toBe(true)
  })

  it('treats common contractions as equal to expanded forms', () => {
    expect(englishAnswersMatch("It's fine.", 'It is fine')).toBe(true)
    expect(englishAnswersMatch("There're two cats", 'There are two cats')).toBe(true)
    expect(englishAnswersMatch("I'm ready", 'I am ready')).toBe(true)
    expect(englishAnswersMatch("They can't go", 'They cannot go')).toBe(true)
    expect(englishAnswersMatch("Won't you stay?", 'Will not you stay')).toBe(true)
  })

  it('rejects clearly different answers', () => {
    expect(englishAnswersMatch('He gives her a book', 'She gives him a book')).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/features/grammar/lib/englishAnswerCompare.test.ts`

Expected: FAIL (module not found / exports missing)

- [ ] **Step 3: Write minimal implementation**

Create `englishAnswerCompare.ts`:

```ts
const CONTRACTIONS: Array<[RegExp, string]> = [
  [/\bwon't\b/g, 'will not'],
  [/\bcan't\b/g, 'cannot'],
  [/\bshan't\b/g, 'shall not'],
  [/\bain't\b/g, 'am not'],
  [/\bI'm\b/gi, 'i am'],
  [/\blet's\b/gi, 'let us'],
  [/\bthere's\b/gi, 'there is'],
  [/\bthere're\b/gi, 'there are'],
  [/\b(that|what|who|where|here|how)'s\b/gi, '$1 is'],
  [/\b(you|we|they|who)'re\b/gi, '$1 are'],
  [/\b(I|you|we|they|he|she|it|who)'ve\b/gi, '$1 have'],
  [/\b(I|you|he|she|it|we|they|who)'ll\b/gi, '$1 will'],
  [/\b(I|you|he|she|it|we|they|who)'d\b/gi, '$1 would'],
  [/\b(is|are|was|were|do|does|did|has|have|had|would|should|could|must|need)n't\b/gi, '$1 not'],
  [/\bit's\b/gi, 'it is'],
  [/\bhe's\b/gi, 'he is'],
  [/\bshe's\b/gi, 'she is'],
]

export function normalizeEnglishForCompare(input: string): string {
  let text = input.trim().toLowerCase()
  // Normalize curly apostrophes before contraction expansion
  text = text.replace(/[\u2019\u2018]/g, "'")
  for (const [pattern, replacement] of CONTRACTIONS) {
    text = text.replace(pattern, replacement.toLowerCase())
  }
  text = text.replace(/[^a-z0-9\s]/g, ' ')
  text = text.replace(/\s+/g, ' ').trim()
  return text
}

export function englishAnswersMatch(a: string, b: string): boolean {
  return normalizeEnglishForCompare(a) === normalizeEnglishForCompare(b)
}
```

Notes for implementer:
- Apply contractions **after** lowercasing (patterns can use lowercase-only forms if preferred; keep behavior equivalent).
- Order matters: expand `won't` / `can't` before generic `'t` / `'s` rules.
- After expansion, strip remaining non-alphanumeric (except spaces).

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/features/grammar/lib/englishAnswerCompare.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/grammar/lib/englishAnswerCompare.ts src/features/grammar/lib/englishAnswerCompare.test.ts
git commit -m "$(cat <<'EOF'
feat(grammar): add lenient English answer compare

Support punctuation stripping and common contraction expansion
for produce-mode whole-sentence matching.
EOF
)"
```

---

### Task 2: Tuning + engine `answerMode`

**Files:**
- Modify: `src/features/grammar/content/game_tuning.json`
- Modify: `src/features/grammar/content/types.ts` (`GameTuning`)
- Modify: `src/features/grammar/lib/engine.ts`
- Modify: `src/features/grammar/lib/engine.test.ts`

**Interfaces:**
- Consumes: none from Task 1 (engine does not import compare yet)
- Produces:
  - `export type AnswerMode = 'mcq' | 'produce'`
  - `FallingState.answerMode: AnswerMode`
  - `pickAnswerMode(ratio?: number, random?: () => number): AnswerMode`
  - `fallDurationForAnswerMode(baseMs: number, mode: AnswerMode): number`
  - `startRound(firstId, lives?, baseFallDurationMs?, answerMode?: AnswerMode): FallingState` — default `answerMode` is `'mcq'` (keeps existing tests stable); multiplies duration when `produce`
  - `beginSentence(state, sentenceId, baseFallDurationMs?, answerMode?: AnswerMode): FallingState` — same duration rule; default `answerMode` `'mcq'` if omitted

- [ ] **Step 1: Write the failing tests (append to `engine.test.ts`)**

```ts
import {
  // ...existing imports
  beginSentence,
  fallDurationForAnswerMode,
  pickAnswerMode,
} from './engine'

it('pickAnswerMode uses ratio against random()', () => {
  expect(pickAnswerMode(0.5, () => 0.49)).toBe('produce')
  expect(pickAnswerMode(0.5, () => 0.5)).toBe('mcq')
  expect(pickAnswerMode(0, () => 0)).toBe('mcq')
  expect(pickAnswerMode(1, () => 0.99)).toBe('produce')
})

it('fallDurationForAnswerMode stretches produce rounds', () => {
  expect(fallDurationForAnswerMode(8000, 'mcq')).toBe(8000)
  expect(fallDurationForAnswerMode(8000, 'produce')).toBe(
    Math.round(8000 * gameTuning.produce_fall_duration_factor),
  )
})

it('startRound defaults to mcq and preserves base duration', () => {
  const state = startRound('s1', 3, 8000)
  expect(state.answerMode).toBe('mcq')
  expect(state.fallDurationMs).toBe(8000)
  expect(state.remainingMs).toBe(8000)
})

it('startRound and beginSentence apply produce duration factor', () => {
  const started = startRound('s1', 3, 8000, 'produce')
  expect(started.answerMode).toBe('produce')
  expect(started.fallDurationMs).toBe(Math.round(8000 * gameTuning.produce_fall_duration_factor))
  expect(started.remainingMs).toBe(started.fallDurationMs)

  const next = beginSentence(started, 's2', 8000, 'produce')
  expect(next.sentenceId).toBe('s2')
  expect(next.answerMode).toBe('produce')
  expect(next.slotIndex).toBe(0)
  expect(next.fallSpeed).toBe(1)
  expect(next.fallDurationMs).toBe(Math.round(8000 * gameTuning.produce_fall_duration_factor))
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/features/grammar/lib/engine.test.ts`

Expected: FAIL on missing exports / missing `produce_*` tuning fields / missing `answerMode`

- [ ] **Step 3: Update tuning + types**

In `game_tuning.json` add:

```json
"produce_answer_ratio": 0.5,
"produce_fall_duration_factor": 1.5
```

In `types.ts` `GameTuning`:

```ts
export type GameTuning = {
  lives: number
  pass_threshold_default: number
  fall_duration_ms: number
  wrong_speed_factor: number
  min_fall_duration_ms: number
  correct_bounce_factor: number
  produce_answer_ratio: number
  produce_fall_duration_factor: number
}
```

- [ ] **Step 4: Implement engine helpers**

In `engine.ts`:

```ts
export type AnswerMode = 'mcq' | 'produce'

export type FallingState = {
  lives: number
  score: number
  sentenceId: string | null
  slotIndex: number
  remainingMs: number
  fallDurationMs: number
  fallSpeed: number
  status: 'playing' | 'over'
  lastWrong: boolean
  answerMode: AnswerMode
}

export function pickAnswerMode(
  ratio: number = gameTuning.produce_answer_ratio,
  random: () => number = Math.random,
): AnswerMode {
  return random() < ratio ? 'produce' : 'mcq'
}

export function fallDurationForAnswerMode(
  baseMs: number,
  mode: AnswerMode,
): number {
  if (mode === 'produce') {
    return Math.round(baseMs * gameTuning.produce_fall_duration_factor)
  }
  return baseMs
}

export function startRound(
  firstId: string,
  lives: number = gameTuning.lives,
  baseFallDurationMs: number = gameTuning.fall_duration_ms,
  answerMode: AnswerMode = 'mcq',
): FallingState {
  const fallDurationMs = fallDurationForAnswerMode(baseFallDurationMs, answerMode)
  return {
    lives,
    score: 0,
    sentenceId: firstId,
    slotIndex: 0,
    remainingMs: fallDurationMs,
    fallDurationMs,
    fallSpeed: 1,
    status: 'playing',
    lastWrong: false,
    answerMode,
  }
}

export function beginSentence(
  state: FallingState,
  sentenceId: string,
  baseFallDurationMs = state.fallDurationMs,
  answerMode: AnswerMode = 'mcq',
): FallingState {
  const fallDurationMs = fallDurationForAnswerMode(baseFallDurationMs, answerMode)
  return {
    ...state,
    sentenceId,
    slotIndex: 0,
    remainingMs: fallDurationMs,
    fallDurationMs,
    fallSpeed: 1,
    lastWrong: false,
    answerMode,
  }
}
```

**Critical:** Callers currently pass **base** duration into `beginSentence` (arcade/level base). After this change, `beginSentence`'s third arg remains base ms; do **not** pass the previous sentence's already-multiplied `fallDurationMs` as base when starting a produce round from a previous produce round. `FallingPlayPage` already computes `nextFallMs` from arcade/level base — keep that. Defaulting the third parameter to `state.fallDurationMs` is only for call sites that omit it; page must keep passing explicit base.

- [ ] **Step 5: Run engine tests**

Run: `npm test -- src/features/grammar/lib/engine.test.ts`

Expected: PASS (including prior cases; `startRound` without 4th arg stays mcq)

- [ ] **Step 6: Commit**

```bash
git add src/features/grammar/content/game_tuning.json src/features/grammar/content/types.ts src/features/grammar/lib/engine.ts src/features/grammar/lib/engine.test.ts
git commit -m "$(cat <<'EOF'
feat(grammar): add produce answerMode to falling engine

Pick mcq vs produce per sentence and stretch fall duration for
produce rounds via game_tuning factors.
EOF
)"
```

---

### Task 3: Wire produce UI in `FallingPlayPage`

**Files:**
- Modify: `src/features/grammar/pages/FallingPlayPage.tsx`

**Interfaces:**
- Consumes:
  - `pickAnswerMode`, `startRound`, `beginSentence`, `markCleared`, `applyWrong` from `engine`
  - `englishAnswersMatch` from `englishAnswerCompare`
  - `gameTuning.produce_answer_ratio` (via `pickAnswerMode` default)
- Produces: playable produce path in UI (no new exported API)

- [ ] **Step 1: Update imports and initial round**

```ts
import {
  // existing...
  pickAnswerMode,
  markCleared, // if not already imported
} from '../lib/engine'
import { englishAnswersMatch } from '../lib/englishAnswerCompare'
```

Change initial state creation so the first sentence can be produce:

```ts
const [state, setState] = useState<FallingState | null>(() => {
  if (!firstId) return null
  return startRound(firstId, lives, initialFallMs, pickAnswerMode())
})
```

In `advanceToNextSentence`, when calling `beginSentence`:

```ts
const answerMode = pickAnswerMode()
setState((current) =>
  current ? beginSentence(current, nextId, nextFallMs, answerMode) : current,
)
```

- [ ] **Step 2: Add produce draft state + submit handler**

Near other hooks:

```ts
const [produceDraft, setProduceDraft] = useState('')

useEffect(() => {
  setProduceDraft('')
}, [state?.sentenceId])
```

Add:

```ts
function submitProduce() {
  unlockUiSound()
  if (round.status !== 'playing' || sentenceResult) return
  if (round.answerMode !== 'produce' || !sentence) return
  const trimmed = produceDraft.trim()
  if (!trimmed) return

  if (!englishAnswersMatch(trimmed, sentence.en)) {
    playUiFail()
    if (sentenceRef.current) gsap.killTweensOf(sentenceRef.current)
    setState((current) => (current ? applyWrong(current) : current))
    return
  }

  setState((current) => {
    if (!current || !current.sentenceId) return current
    bottomHandledRef.current = true
    setClearedIds((prev) => new Set(prev).add(current.sentenceId!))
    playUiSuccess()
    setSentenceResult({ outcome: 'cleared', sentenceId: current.sentenceId })
    return markCleared(current)
  })
}
```

Keep existing `pick()` for `mcq` only — optionally guard:

```ts
if (round.answerMode !== 'mcq') return
```

at the top of `pick`.

- [ ] **Step 3: Branch the bottom answer area**

Replace the always-on options grid with:

```tsx
<div className="mt-4">
  <div className="rounded-2xl border border-day/20 bg-cyc/40 px-3 py-4">
    {round.answerMode === 'produce' ? (
      <form
        className="flex flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          submitProduce()
        }}
      >
        <input
          type="text"
          value={produceDraft}
          onChange={(event) => setProduceDraft(event.target.value)}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder="输入英文句子"
          className="min-h-14 w-full rounded-2xl border border-day/75 bg-cyc px-3 text-lg font-semibold tracking-[0.02em] text-day placeholder:text-day/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-day"
        />
        <button
          type="submit"
          className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-day/75 bg-day px-3 text-base font-semibold text-ink transition-[filter] duration-200 hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-day active:brightness-95"
        >
          提交
        </button>
      </form>
    ) : (
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => pick(option)}
            className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-day/75 bg-cyc px-3 text-lg font-semibold tracking-[0.04em] text-day transition-[filter,background-color] duration-200 ease-out hover:border-day hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-day active:brightness-95"
          >
            {option}
          </button>
        ))}
      </div>
    )}
  </div>
</div>
```

Match existing color tokens (`text-ink` / `bg-day` etc.) to whatever the file already uses for primary buttons — if `text-ink` is wrong, reuse a nearby success/primary button class from the same page.

- [ ] **Step 4: Guard options effect for produce**

Optional clarity:

```ts
useEffect(() => {
  if (!slot || state?.answerMode === 'produce') {
    setOptions([])
    return
  }
  setOptions(slotOptions(slot))
}, [slot?.id, state?.answerMode])
```

- [ ] **Step 5: Manual smoke check**

Run: `npm test -- src/features/grammar/lib/`

Expected: PASS

Then run the app, open a level play or arcade run, confirm roughly half the sentences show an input, 1.5× fall time feel, wrong submit accelerates, correct clears, empty submit does nothing, landing still fails the sentence.

- [ ] **Step 6: Commit**

```bash
git add src/features/grammar/pages/FallingPlayPage.tsx
git commit -m "$(cat <<'EOF'
feat(grammar): add produce input path to falling play

Randomly switch sentences to whole-sentence English input with
lenient matching while reusing lives, speed-up, and clear flow.
EOF
)"
```

---

### Task 4: README bilingual note

**Files:**
- Modify: `README.md`
- Modify: `README.zh.md`

**Interfaces:**
- Consumes: shipped produce behavior from Tasks 1–3
- Produces: docs only

- [ ] **Step 1: Update Chinese note (item 4 under 已知问题)**

Replace/amend the “识别未达替换” bullet so it states:

- 已引入：关卡练习与挑战模式中约 50% 句子为整句英文输入（中文提示 → 输入英文 → 与例句 `en` 宽松比对）
- 仍待做：真替换（新目标句 / 生成式骨架题）

Keep the rest of the known-issues list intact.

- [ ] **Step 2: Update English README equivalently**

Same meaning under “Known issues & design notes” item 4.

- [ ] **Step 3: Commit**

```bash
git add README.md README.zh.md
git commit -m "$(cat <<'EOF'
docs: note 50% produce recall in grammar falling play

Clarify that input questions are recall-vs-en, while true
substitution generation remains future work.
EOF
)"
```

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| 50% per-sentence produce in level + arcade | Task 2–3 |
| Chinese only, no skeleton | Task 3 |
| Compare vs `sentence.en` leniently | Task 1, 3 |
| Case / punctuation / contractions | Task 1 |
| Fall duration ×1.5 still falling | Task 2–3 |
| Wrong = accelerate, retry | Task 3 |
| Empty submit no-op | Task 3 |
| Tuning keys in `game_tuning.json` | Task 2 |
| README EN+ZH | Task 4 |
| No true substitution / difficulty modes | out of scope |

## Plan self-review

- No TBD/placeholder steps
- `beginSentence` third arg stays **base** ms; page must pass arcade/level base (documented in Task 2)
- `startRound` default `answerMode: 'mcq'` preserves existing engine tests
- Types/names consistent: `AnswerMode`, `pickAnswerMode`, `fallDurationForAnswerMode`, `englishAnswersMatch`
