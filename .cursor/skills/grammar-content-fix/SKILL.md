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
| `sentence_slot` | Prefer `slots.id` (reusable definition). Occurrence blanks resolve as `{sentence_id}-slot-{index}` in the app. |
| `sentence` | `sentences` by `id` (+ its `sentence_slot_refs`) |
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
| 干扰项太弱 / 不像边界 | `slots.distractors` |
| **干扰项吞掉下一空** | `slots.distractors` (check neighbor via `sentence_slot_refs`) |
| 正确答案不对 | `slots.correct` (+ substring of `sentences.en`) |
| 句子英文笔误 | `sentences.en` then realign refs / spans |
| 学习页点选范围错 | `sentence_spans.start` / `"end"` |
| 知识点说明误导 | `grammar_points.body_zh` / `title_zh` |

Distractor design: 3–4 boundary foils; never equal to `correct`.

#### Cross-slot swallow

1. Load `sentence_slot_refs` for the sentence ordered by `slot_index` (must match LTR in `en`).
2. Join `slots` for each ref.
3. If distractor *d* equals `correct_i + " " + correct_{i+1}` (or ends with next correct), replace *d*.
4. Updating `slots` once fixes every sentence that refs that `slot_id`.

```sql
UPDATE slots
SET distractors = '["should","can","will"]'::jsonb
WHERE id = 'sl-mod-must';
```

Natural-language location: search `slots.correct` / distractors / `sentences.en`, then confirm neighbors via refs.### Step 4 — Scope gate

| Situation | Action |
|-----------|--------|
| Wrong distractors / typo / span offset / body copy | Stay here — `UPDATE` |
| Need new playable / new level / new grammar_point for a **new rule** | Stop; invoke **grammar-content-pack** |
| Slot missing so coverage fails | Prefer add slot via pack skill rules; if tiny omission on existing sentence, `INSERT` one slot row here with continuous `slot_index` |

### Step 5 — Migration

File: `supabase/migrations/YYYYMMDDHHMMSS_fix_{slug}.sql`

```sql
BEGIN;

UPDATE slots
SET distractors = '["should","can","will"]'::jsonb
WHERE id = 'sl-mod-must';

COMMIT;
```

Rules:

- Prefer **`UPDATE slots` / `UPDATE sentences` / … `WHERE id = …`**. Never rewrite the baseline seed.
- Escape quotes (`''`). JSONB distractors: `'[…]'::jsonb`.
- Quote span end column: `"end"`.
- Changing a shared `slots` row affects every sentence that refs it — intended for reusable fixes.
- If changing `en`, update `sentence_slot_refs` / spans in the **same** transaction; keep `slot_index` LTR.
- There is **no** `sentence_slots` table.
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
