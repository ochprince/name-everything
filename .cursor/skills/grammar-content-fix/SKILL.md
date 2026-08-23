---
name: grammar-content-fix
description: >-
  Triages Grammar Everything content bugs (bad distractors, wrong correct
  answers, span offsets, wording) from user notes or exported asset_reports,
  then ships minimal Supabase SQL UPDATE migrations. Use when fixing existing
  grammar slots/sentences/points, reviewing 报错 / grammar-reports.json, or
  improving distractors — not when authoring a new knowledge point (use
  grammar-content-pack instead).
---

# Grammar Content Fix

Repair **existing** Grammar Everything rows in Supabase. Minimal diff; SQL migrations only.

**Announce at start:** "I'm using the grammar-content-fix skill."

**Not this skill:** new knowledge points, new levels, or merge-into-level authoring → use [grammar-content-pack](../grammar-content-pack/SKILL.md).

Canonical store: Postgres via `supabase/migrations/`. **Do not edit pack JSON for fixes.**

## Environment (portable)

Same as [grammar-content-pack](../grammar-content-pack/SKILL.md) § Environment:

- `.env.local`: `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY` (live fetch + validate)
- Deploy: GitHub integration **or** `supabase db push` with DB password
- Node 18+ for shared scripts under `grammar-content-pack/scripts/`

Fuzzy NL reports are OK if they name a word/pattern; the agent searches live `sentence_slots` / neighboring slots. Exact `asset_id` is optional.

## Inputs

One or more of:

- Exported `grammar-reports.json` (from **我的** → 语法报错)
- Live `asset_reports` rows (if readable) or pasted report notes
- Free-text: “slot X distractors are bad”, wrong answer, typo, span mismatch, or fuzzy notes like “must 的干扰项有 must be，下一格却是 be”

## Report shape

```json
{
  "id": "…",
  "asset_type": "sentence" | "grammar_point" | "sentence_slot",
  "asset_id": "s-nf-p2-slot-8",
  "level_id": "nonfinite-1",
  "note": "干扰项太容易",
  "created_at": "ISO-8601"
}
```

| `asset_type` | Look up |
|--------------|---------|
| `sentence_slot` | `sentence_slots` by `id` |
| `sentence` | `sentences` by `id` (+ its slots if needed) |
| `grammar_point` | `grammar_points` by `id` |

## Workflow

```
- [ ] 1. Triage reports (group by asset_id; skip empty / duplicate notes)
- [ ] 2. Fetch live row(s) from Supabase Data API
- [ ] 3. Diagnose root cause (distractor / correct / en / span / copy)
- [ ] 4. Decide: UPDATE only | hand off to grammar-content-pack
- [ ] 5. Write new migration (UPDATE / DELETE+INSERT for that id only)
- [ ] 6. Deploy (push GitHub or supabase db push)
- [ ] 7. Re-fetch row; run validate-pack + check-coverage if slots/sentences touched
- [ ] 8. Summarize what changed per report
```

### Step 1 — Triage

- Prefer **user-provided export file** or pasted notes over inventing issues.
- One migration may batch several related fixes; keep scope to reported assets unless a shared typo clearly affects siblings (same `correct` + same bad distractors).
- If note is vague (“不好”), ask what wrong option they saw / expected — do not rewrite the whole sentence casually.

### Step 2 — Fetch live state

Use env from `.env.local` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`). Prefer the shared helper:

```bash
node -e "
import { fetchTable } from './.cursor/skills/grammar-content-pack/scripts/supabase-fetch.mjs'
const rows = await fetchTable('sentence_slots')
console.log(rows.find(r => r.id === 'ASSET_ID'))
"
```

Or REST: `GET /rest/v1/sentence_slots?id=eq.{asset_id}&select=*`.

Always fix against **live DB**, not memory of old content.

### Step 3 — Diagnose

| Symptom | Likely table / fields |
|---------|------------------------|
| 干扰项太弱 / 不像边界 | `sentence_slots.distractors` |
| **干扰项吞掉下一空**（见下） | `sentence_slots.distractors` on slot *i* |
| 正确答案不对 / 选了也对不上 | `sentence_slots.correct` (+ ensure substring of `sentences.en`) |
| 句子英文笔误 | `sentences.en` then realign slots / spans |
| 学习页点选范围错 | `sentence_spans.start` / `"end"` |
| 知识点说明误导 | `grammar_points.body_zh` / `title_zh` |

Distractor design (same teaching bar as pack skill): 3–4 options that teach **boundaries** (e.g. `was canceled` vs `canceled`), never equal to `correct`.

#### Cross-slot swallow (common NL report)

Fuzzy reports like “must 的干扰项有 must be，但下一格是 be” map to this check:

1. Load **all slots** for the same `sentence_id`, ordered by `slot_index`.
2. For each slot *i*, each distractor *d*: if *d* equals `correct_i + " " + correct_{i+1}` (or otherwise concatenates / contains the **next** slot’s `correct` as a trailing constituent), *d* is illegal — choosing it would cover material that belongs to a later blank.
3. Fix: replace that distractor with a same-role boundary foil that does **not** include the next slot’s text (e.g. for `must` before `be`: prefer `can` / `should` / `have to`, drop `must be`).
4. Scan **sibling sentences** in the same level (same skeleton) for the same bad pattern and batch-fix in one migration when identical.

Example already in pack: modal level `must` slots used distractor `must be` while the next slot’s `correct` is `be` → remove `must be`.

Natural-language location: if the user does not give an id, search live `sentence_slots` by `correct` / distractor substring / sentence `en` keywords from the note, then confirm with neighboring slots before updating.
### Step 4 — Scope gate

| Situation | Action |
|-----------|--------|
| Wrong distractors / typo / span offset / body copy | Stay here — `UPDATE` |
| Need new playable / new level / new grammar_point for a **new rule** | Stop; invoke **grammar-content-pack** |
| Slot missing so coverage fails | Prefer add slot via pack skill rules; if tiny omission on existing sentence, `INSERT` one slot row here with continuous `slot_index` |

### Step 5 — Migration

File: `supabase/migrations/YYYYMMDDHHMMSS_fix_{slug}.sql`

```sql
BEGIN;

UPDATE sentence_slots
SET distractors = '["or","but","so","because"]'::jsonb
WHERE id = 's-nf-p2-slot-8';

COMMIT;
```

Rules:

- Prefer **`UPDATE … WHERE id = …`**. Never rewrite the historical seed migration.
- Escape quotes (`''`). JSONB distractors: `'[…]'::jsonb`.
- Quote span end column: `"end"`.
- If changing `correct`, keep it an exact substring of current `sentences.en`.
- If changing `en`, update dependent slots/spans in the **same** transaction.
- Rely on PK/FK/CHECK; if deploy fails, fix SQL and ship a follow-up migration.

### Step 6 — Deploy

Push `supabase/migrations/` (GitHub integration with Deploy to production) or `supabase db push`.

### Step 7 — Verify

```bash
npm run grammar:validate
npm run grammar:coverage
```

Re-fetch the fixed `asset_id` and confirm the note is addressed. If only `grammar_points` copy changed, validate still OK; coverage optional.

### Step 8 — Report back

For each report: `asset_id` → change (before → after) → migration filename.

## Completion gate

1. Migration deployed
2. Targeted rows match the intended fix in live DB
3. `grammar:validate` OK when sentences/slots/spans touched; coverage 100% if slots/en changed
4. No drive-by new levels or unsolicited lesson expansion
