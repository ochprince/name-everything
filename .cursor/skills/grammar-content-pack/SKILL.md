# Grammar Content Pack

Turn a **语法知识点**（中文说明 + 可选英文例句）into Grammar Everything content in **Supabase** via SQL migrations.

**Announce at start:** "I'm using the grammar-content-pack skill."

Canonical store: Postgres. **Authoritative table shapes: `supabase/schema.sql` only.** Do not infer schema by scanning historical migrations. The app reads via Supabase Data API. **Do not create, edit, or mention pack JSON files for authoring.**

**Fixing existing rows** (bad distractors, 报错 export, typos, span offsets) → use [grammar-content-fix](../grammar-content-fix/SKILL.md), not this skill.

## Environment (portable)

Skills themselves are markdown + Node scripts under `.cursor/skills/`. Another machine needs:

| Need | What | Used for |
|------|------|----------|
| Repo checkout | this project with `supabase/migrations/` | write/deploy SQL |
| Node 18+ | run validate/coverage scripts | Step 10 |
| `.env.local` (or CI secrets) | `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY` | Data API read (validate, coverage, fetch live rows) |
| Deploy path | GitHub ↔ Supabase **Deploy to production**, **or** `supabase` CLI + `SUPABASE_DB_PASSWORD` / `--db-url` | apply migrations |
| Optional | `npm run grammar:validate` / `grammar:coverage` scripts in `package.json` | convenience wrappers |

Not required for authoring SQL text alone: Vite app running, publishable key in the browser, or local Postgres. Do not create `supabase/seed.sql`; live Postgres is canonical and already-applied migrations stay as history.

Publishable/anon key is enough for **read** validation. Writing content is via **migrations**, not the anon key.

## Inputs

User provides one or more of:

- Rule in Chinese (required)
- Example sentences in English (optional; you may author them)
- Target chapter hint (optional)

## Outputs

Append content with a **new SQL migration** (never rewrite already-applied migrations wholesale):

| Table | Role |
|------|------|
| `chapters` | Chapter placement; usually unchanged |
| `grammar_points` | Clickable rule cards (`title_zh`, `body_zh`) |
| `levels` | One level = one list title (`grammar_point_id`) |
| `sentences` | 1 `anchor` + ≥3 `playable` per level |
| `sentence_spans` | **Only anchor** — clickable grammar spans on the learn page |
| `slots` | Reusable blank definitions: `role` + `correct` + `distractors` |
| `sentence_slot_refs` | Per sentence: ordered `slot_id` list (`slot_index` = play / LTR order) |

Do **not** put lesson text in `game_tuning`. There is **no** `sentence_slots` table.

Schema / RLS: **`supabase/schema.sql`** (mirrored by baseline migration `20260823140000_grammar_content.sql`).

### Step 2b — Merge vs new level (decision rule, 2026-08-23)

**Not every knowledge point deserves its own level.** Decide before authoring:

- **Merge into an existing level** (add playable sentences, no new level): the point is an **application / variant / recognition trick / supplementary angle** of an existing level's theme and fits its skeleton — e.g. "to + base verb is always nonfinite" merged into the "three forms" level.
- **New level**: only when the point introduces a **new grammatical function/structure** (a different syntactic slot, e.g. subject vs adverbial vs object-complement).

**Merging is not just adding sentences.** A genuinely new knowledge point being merged must still be fully recorded:

1. **Author the `grammar_point`(s)** — the knowledge itself is content, not just examples.
2. **Link it to the level's anchor via `sentence_spans`** on the corresponding constituent(s) — the point must be clickable from the benchmark sentence's relevant spans.
3. **Add the example sentences** as playables (with full-coverage slots).

So a merge = new grammar_points + anchor spans + example sentences, without a new level row. Reuse existing `grammar_point` ids when they already cover the point.

## Workflow

Copy this checklist and track progress:

```
- [ ] 1. Query live pack (or latest migrations) + classify chapter
- [ ] 2. Draft grammar_points (reuse shared points when possible)
- [ ] 3. Plan level id + 4+ sentences (1 anchor + 3 playables minimum)
- [ ] 4. Write EN + zh prompts
- [ ] 5. Assign stable ids (no collisions — check DB / migrations)
- [ ] 6. Build anchor spans (half-open [start, end) on en)
- [ ] 7. Build slots + teaching distractors
- [ ] 8. Write a new migration SQL (INSERTs only for new rows)
- [ ] 9. Deploy migration (push GitHub or supabase db push)
- [ ] 10. Run validate-pack.mjs + check-coverage.mjs against live DB
- [ ] 11. Run pack tests (npm test -- pack.test) if app fixtures need update
```

### Step 1 — Classify chapter

Query `chapters` (or read DDL + existing migrations). Map the rule to an **existing** chapter when possible:

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

- Exactly **1** `kind: 'anchor'`
- At least **3** `kind: 'playable'`
- **Minimum 4 sentences total** per level (1 + 3)
- `playable.en` must differ from anchor **and** from each other in the same level
- `sort_order`: anchor `0`, playables `1..n`

Level id pattern: `{topic-slug}-{n}` (e.g. `participle-1`).  
Level `grammar_point_id`: umbrella point (e.g. `gp-participle`).

### Step 4 — Sentence writing rules

- **Anchor** = most typical example of the rule; carries **识别** (learn-page spans).
- **Playables** = **替换** same skeleton (换主语/宾语/动词/分词), not new grammar; **slots only**, no spans.
- Vocabulary: avoid rare/formal words (see [reference.md](reference.md) § Vocabulary guardrails); if the anchor needs an uncommon word, add a `grammar_point` + anchor span for it.
- Every sentence needs matching `zh` for falling-fill prompt.
- `prompt_kind`: always `'zh'` for now.

### Step 5 — Stable id conventions

Before allocating new ids, query Supabase (or scan migrations) for collisions.

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
- `[start, end)` half-open indices on `en` (JavaScript `slice` semantics). Column name in SQL: `"end"` (quoted).
- Do not rely on whole-sentence spans for clicking (UI filters full-length spans).
- Mark: main clause `gp-s` / `gp-v`, rule-specific spans, optional meta span (e.g. nonfinite phrase → `gp-nonfinite-tense`).
- Verify offsets with `span-offset.mjs` or `validate-pack.mjs`.

```bash
node .cursor/skills/grammar-content-pack/scripts/span-offset.mjs "<en>" "<substring>"
```

### Step 7 — slots + sentence_slot_refs

Every sentence (anchor + playables) must have refs covering **every word** of `en` (word-boundary match via slot `correct`).

Hard rules:

1. **Reuse before create:** if `(role, correct, distractors)` already exists in `slots`, reuse that `slots.id` in `sentence_slot_refs`.
2. **New slot id** pattern: `sl-{role}-{correct-slug}` (add `-2`, `-3` on collision when distractors differ).
3. **`slot_index` = left-to-right order in `en`:** non-overlapping matches of each `correct` advancing through the sentence. Index `0..n-1` continuous. Play order == reading order.
4. **No cross-slot swallow:** a distractor must not equal `correct_i + " " + correct_{i+1}` or otherwise include the next blank’s `correct` as a trailing constituent.
5. `distractors`: JSONB array of 3–4 teaching boundary foils; never equal to `correct`.

```sql
INSERT INTO slots (id, role, correct, distractors) VALUES
  ('sl-mod-must', 'MOD', 'must', '["should","can","will"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO sentence_slot_refs (sentence_id, slot_index, slot_id) VALUES
  ('s-ex-p4', 0, 'sl-s-she'),
  ('s-ex-p4', 1, 'sl-mod-must'),
  ('s-ex-p4', 2, 'sl-v-be');
```

Verify with `check-coverage.mjs` (100%) and `validate-pack.mjs` (LTR + swallow checks).
### Step 8 — Write SQL migration

Create a new file:

```
supabase/migrations/YYYYMMDDHHMMSS_{slug}.sql
```

Rules:

- Prefer **`INSERT`** for new rows. Use **`UPDATE`** only when fixing existing content.
- Wrap in `BEGIN;` / `COMMIT;` for multi-statement safety.
- Rely on DB constraints: PK, FKs, `CHECK (kind…)`, PK `(sentence_id, slot_index)` on refs, one-anchor-per-level index.
- Escape single quotes (`''`). `slots.distractors` is **JSONB**.
- `sentence_spans."end"` must be quoted.
- Do **not** rewrite already-applied migrations. There is no `supabase/seed.sql`; do not recreate it.
- Do **not** recreate a denormalized `sentence_slots` table.
Example fragment:

```sql
BEGIN;

INSERT INTO grammar_points (id, title_zh, body_zh) VALUES
  ('gp-example', '标题', '说明');

INSERT INTO sentences (id, level_id, kind, en, zh, prompt_kind, image_url, sort_order) VALUES
  ('s-ex-p4', 'some-level-1', 'playable', 'She must be ready.', '她必须准备好。', 'zh', NULL, 4);

INSERT INTO slots (id, role, correct, distractors) VALUES
  ('sl-s-she', 'S', 'She', '["He","Her","It"]'::jsonb),
  ('sl-mod-must', 'MOD', 'must', '["should","can","will"]'::jsonb),
  ('sl-v-be', 'V', 'be', '["is","was","being"]'::jsonb),
  ('sl-c-ready', 'C', 'ready', '["readily","readiness","read"]'::jsonb);

INSERT INTO sentence_slot_refs (sentence_id, slot_index, slot_id) VALUES
  ('s-ex-p4', 0, 'sl-s-she'),
  ('s-ex-p4', 1, 'sl-mod-must'),
  ('s-ex-p4', 2, 'sl-v-be'),
  ('s-ex-p4', 3, 'sl-c-ready');

COMMIT;
```

### Step 9 — Deploy

With Supabase GitHub integration ([docs](https://supabase.com/docs/guides/deployment/branching/github-integration)):

1. Commit the migration under `supabase/migrations/`.
2. Push to the linked branch; Supabase applies new migrations automatically.
3. Or locally: `supabase db push` after `supabase link`.

If deploy fails (constraint / FK / syntax), **fix the migration and push a corrected follow-up** — do not force past failed checks. Prefer enabling GitHub required check “Supabase Preview”.

### Step 10 — Validate against live DB

Requires `.env.local` (or env) with:

- `VITE_SUPABASE_URL` (or `SUPABASE_URL`)
- `VITE_SUPABASE_PUBLISHABLE_KEY` (or `SUPABASE_ANON_KEY` / `SUPABASE_PUBLISHABLE_KEY`)

```bash
node .cursor/skills/grammar-content-pack/scripts/validate-pack.mjs
node .cursor/skills/grammar-content-pack/scripts/check-coverage.mjs
```

Scripts fetch via Data API with **retries** (schema cache lag after migrate). Fix all errors before claiming done.

- `validate-pack.mjs` — unique ids, FKs, anchor/playables/slots/spans, span offsets
- `check-coverage.mjs` — full-sentence coverage; must be `100.0%` / `0 uncovered`

### Step 11 — Tests

```bash
npm test -- src/features/grammar/content/pack.test.ts
```

Released chapters must satisfy: ≥1 level, each with 1 anchor + ≥3 playables.

## Chapter assignment examples

| Knowledge | Chapter | Umbrella point |
|-----------|---------|----------------|
| 双宾 S+V+IO+DO | `simple` | `gp-ditrans` |
| 一般过去时被动谓语 | `predicate` | `gp-passive-past` (new) |
| 分词不自带时态；doing 主动 / done 被动 | `nonfinite` | `gp-participle` |

Full worked example: [reference.md](reference.md)

## Completion gate

Before reporting success:

1. Migration deployed (GitHub integration or `db push`)
2. `validate-pack.mjs` exit code 0 against live DB
3. `check-coverage.mjs` 100% coverage
4. Summarize: chapter, level id, new grammar_point ids, sentence ids, what each playable drills
