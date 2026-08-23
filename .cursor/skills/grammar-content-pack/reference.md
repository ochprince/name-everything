# Grammar Content Pack — Reference

Schema source: `docs/superpowers/specs/2026-08-22-grammar-everything-design.md` §8.1  
DDL: `supabase/migrations/20260823100000_grammar_content.sql`  
Types: `src/features/grammar/content/types.ts`

Authoring is **SQL migrations only**. Query live tables for existing ids.

## Field quick reference

### chapters

```sql
INSERT INTO chapters (id, title_zh, description_zh, sort_order, released) VALUES
  ('nonfinite', '非谓语', '不定式、分词、动名词。', 3, false);
```

### grammar_points

```sql
INSERT INTO grammar_points (id, title_zh, body_zh) VALUES
  ('gp-pp-active', '现在分词（主动）', '…');
```

### levels

```sql
INSERT INTO levels (id, chapter_id, sort_order, grammar_point_id, pass_threshold, lives, fall_duration_ms) VALUES
  ('participle-1', 'nonfinite', 1, 'gp-participle', NULL, NULL, NULL);
```

Optional overrides: `pass_threshold`, `lives`, `fall_duration_ms`.

### sentences

```sql
INSERT INTO sentences (id, level_id, kind, en, zh, prompt_kind, image_url, sort_order) VALUES
  ('s-part-anchor', 'participle-1', 'anchor',
   'She pushed the door, seeing students sitting on the chairs.',
   '她推开门，看见学生们坐在椅子上。',
   'zh', NULL, 0);
```

### sentence_spans

**Anchor only.** Do not insert rows whose `sentence_id` is a `playable` sentence. Quote `"end"`.

```sql
INSERT INTO sentence_spans (id, sentence_id, grammar_point_id, start, "end") VALUES
  ('sp-part-v', 's-part-anchor', 'gp-v', 4, 10);
```

`en.slice(start, end)` must equal the highlighted text.

### sentence_slots

`distractors` is JSONB.

```sql
INSERT INTO sentence_slots (id, sentence_id, slot_index, role, correct, distractors) VALUES
  ('s-part-p2-slot-0', 's-part-p2', 0, 'PP-P', 'canceled',
   '["was canceled","cancel","canceling"]'::jsonb);
```

## Worked example — 分词（时态随主句谓语）

**Rule (Chinese):** 分词不自带时态，时态跟随主句谓语；主动 doing，被动 done；`canceled` ≠ `was canceled`.

**Chapter:** `nonfinite` (existing)

**New grammar_points:**

| id | title_zh |
|----|----------|
| `gp-participle` | 分词（时态随主句） |
| `gp-pp-active` | 现在分词（主动） |
| `gp-pp-passive` | 过去分词（被动） |

**Level:** `participle-1` → umbrella `gp-participle`

**Deploy:** new file `supabase/migrations/YYYYMMDDHHMMSS_participle-1.sql` with `INSERT`s, then push GitHub (or `supabase db push`).

**Validate:**

```bash
node .cursor/skills/grammar-content-pack/scripts/validate-pack.mjs
node .cursor/skills/grammar-content-pack/scripts/check-coverage.mjs
```

## Vocabulary guardrails

Prefer high-frequency words. If an uncommon word is required on the anchor, add a `grammar_point` + span so learners can tap it.

## DB integrity (use these instead of ad-hoc JSON checks)

| Mechanism | What it catches |
|-----------|-----------------|
| PRIMARY KEY | duplicate ids |
| FOREIGN KEY | orphan level/sentence/span/slot refs |
| `CHECK (kind IN …)` | invalid sentence kind |
| Unique `(sentence_id, slot_index)` | duplicate slot order |
| Partial unique index one-anchor-per-level | two anchors in one level |
| RLS + SELECT policies | public read for pack tables |
| Migration transactions (`BEGIN`/`COMMIT`) | partial apply on failure |

Failed deploy → fix SQL and ship a follow-up migration; do not hand-edit production rows as the source of truth.
