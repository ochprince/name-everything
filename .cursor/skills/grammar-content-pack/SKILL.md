---
name: grammar-content-pack
description: Converts a Chinese grammar knowledge point into Grammar Everything content pack JSON (chapters, grammar_points, levels, sentences, sentence_spans, sentence_slots). Use when adding grammar lessons, writing anchor/playable sentences, designing distractors, or updating src/features/grammar/content/*.json.
---

# Grammar Content Pack

Turn a **语法知识点**（中文说明 + 可选英文例句）into pack data under `src/features/grammar/content/`.

**Announce at start:** "I'm using the grammar-content-pack skill."

## Inputs

User provides one or more of:

- Rule in Chinese (required)
- Example sentences in English (optional; you may author them)
- Target chapter hint (optional)

## Outputs

Append to these six files (never replace whole files):

| File | Role |
|------|------|
| `chapters.json` | Chapter placement; usually unchanged |
| `grammar_points.json` | Clickable rule cards (`title_zh`, `body_zh`) |
| `levels.json` | One level = one list title (`grammar_point_id`) |
| `sentences.json` | 1 `anchor` + ≥3 `playable` per level |
| `sentence_spans.json` | **Only anchor** — clickable grammar spans on the learn page |
| `sentence_slots.json` | Falling-fill slots for **every** sentence (anchor + playables) |

Do **not** put lesson text in `game_tuning.json`.

## Workflow

Copy this checklist and track progress:

```
- [ ] 1. Read existing pack JSON + classify chapter
- [ ] 2. Draft grammar_points (reuse shared points when possible)
- [ ] 3. Plan level id + 4+ sentences (1 anchor + 3 playables minimum)
- [ ] 4. Write simple-vocab EN + zh prompts
- [ ] 5. Assign stable ids (no collisions)
- [ ] 6. Build anchor spans (half-open [start, end) on en)
- [ ] 7. Build slots + teaching distractors
- [ ] 8. Append JSON entries
- [ ] 9. Run validate-pack.mjs
- [ ] 10. Run pack tests (npm test -- pack.test)
```

### Step 1 — Classify chapter

Read `chapters.json` first. Map the rule to an **existing** chapter when possible:

| Chapter `id` | When to use |
|--------------|-------------|
| `simple` | 五大句型主干：S/V/O、双宾等 |
| `predicate` | 谓语上的时态、语态、情态（有限动词作谓语） |
| `nonfinite` | 不定式、分词、动名词；非谓语不带时态、分词主动/被动等 |

**New chapter:** only if none of the above fit. Requirements:

- New stable `id` (lowercase, hyphenated)
- `sort_order` after last chapter
- `released: false` unless user explicitly asks to publish
- Brief `title_zh` / `description_zh`
- Tell the user why a new chapter was needed

### Step 2 — Refine grammar_points

- **Reuse** shared points when they apply: `gp-s`, `gp-v`, `gp-o`, `gp-io`, `gp-do`, etc.
- **Add** topic-specific points with prefix `gp-` + short slug: `gp-pp-active`, `gp-nonfinite-tense`.
- One level uses **one** umbrella `grammar_point_id` (list title on Learn page).
- Sub-rules become extra `grammar_points` linked via **anchor** `sentence_spans` only.
- `body_zh`: one idea per card; short; match 例句锚定法（识别 → 替换）.

### Step 3 — Levels and sentence count

Per level (pack invariant):

- Exactly **1** `kind: "anchor"`
- At least **3** `kind: "playable"`
- **Minimum 4 sentences total** per level (1 + 3)
- `playable.en` must differ from anchor **and** from each other in the same level
- `sort_order`: anchor `0`, playables `1..n`

Level id pattern: `{topic-slug}-{n}` (e.g. `participle-1`).  
Level `grammar_point_id`: umbrella point (e.g. `gp-participle`).

### Step 4 — Sentence writing rules

- **Simple words only**: common verbs (go, see, push, leave), short clauses, no rare nouns.
- **Anchor** = most typical short example of the rule; carries **识别** (learn-page spans).
- **Playables** = **替换** same skeleton (换主语/宾语/动词/分词), not new grammar; **slots only**, no spans.
- Every sentence needs matching `zh` for falling-fill prompt.
- `prompt_kind`: always `"zh"` for now.

### Step 5 — Stable id conventions

Check existing ids in all six files before allocating new ones.

| Entity | Pattern | Example |
|--------|---------|---------|
| grammar_point | `gp-{slug}` | `gp-pp-passive` |
| level | `{slug}-{n}` | `participle-1` |
| sentence | `s-{level-short}-{anchor\|pN}` | `s-part-anchor`, `s-part-p1` |
| span | `sp-{level-short}-{role}` | `sp-part-v` |
| slot | `{sentence-id}-slot-{index}` | `s-part-p1-slot-2` |

**Never reuse** an existing `id`. Prefer descriptive slugs over numbers alone.

### Step 6 — sentence_spans (anchor only)

**Only the anchor sentence** gets `sentence_spans`. Playables do **not** get spans — they inherit the level's grammar via the anchor + `levels.grammar_point_id`. Do not write playable spans; the validator rejects them.

- Required on **anchor** (Learn page clickable spans).
- `[start, end)` half-open indices on `en` (JavaScript `slice` semantics).
- Do not rely on whole-sentence spans for clicking (UI filters full-length spans).
- Mark: main clause `gp-s` / `gp-v`, rule-specific spans, optional meta span (e.g. nonfinite phrase → `gp-nonfinite-tense`).
- Verify offsets with `span-offset.mjs` or `validate-pack.mjs` (reports slice mismatches).

```bash
node .cursor/skills/grammar-content-pack/scripts/span-offset.mjs "<en>" "<substring>"
```

### Step 7 — sentence_slots

Every sentence (anchor + playables):

- Continuous `slot_index` from `0`
- `role`: reuse `S` `V` `O` `IO` `DO` `A`; add `PP-A` / `PP-P` for participles; `INF` for infinitives
- `correct`: exact substring of `en`
- `distractors`: 3–4 items teaching **boundaries** (e.g. `was canceled` vs `canceled`, `pushing` vs `pushed`, `seen` vs `seeing`)
- Slot order follows natural left-to-right reading where possible

### Step 8 — Append JSON

- Merge arrays; preserve existing entry order; append new blocks at end.
- Keep valid JSON (trailing commas forbidden).
- Do not set `released: true` on new chapters unless user asks.

### Step 9 — Validate

From repo root:

```bash
node .cursor/skills/grammar-content-pack/scripts/validate-pack.mjs
```

Fix all errors before claiming done. The script validates the **entire** pack; pre-existing errors must be fixed too.

### Step 10 — Tests

```bash
npm test -- src/features/grammar/content/pack.test.ts
```

Released chapters must satisfy: ≥1 level, each with 1 anchor + ≥3 playables. Multiple chapters may be `released: true`. Unreleased chapters may have zero levels.

## Chapter assignment examples

| Knowledge | Chapter | Umbrella point |
|-----------|---------|----------------|
| 双宾 S+V+IO+DO | `simple` | `gp-ditrans` |
| 一般过去时被动谓语 | `predicate` | `gp-passive-past` (new) |
| 分词不自带时态；doing 主动 / done 被动 | `nonfinite` | `gp-participle` |

Full worked example (participles): [reference.md](reference.md)

## Completion gate

Before reporting success:

1. `validate-pack.mjs` exit code 0
2. `pack.test.ts` pass (if released chapter touched, all its invariants hold)
3. Summarize: chapter, level id, new grammar_point ids, 4 sentence ids, what each playable drills
