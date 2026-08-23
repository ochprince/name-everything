# Grammar Content Pack — Reference

Schema source: `docs/superpowers/specs/2026-08-22-grammar-everything-design.md` §8.1  
**Authoritative DDL: `supabase/schema.sql`** (do not infer from deleted / historical migrations)

## Field quick reference

### slots (reusable)

```sql
INSERT INTO slots (id, role, correct, distractors) VALUES
  ('sl-pp-p-canceled', 'PP-P', 'canceled',
   '["was canceled","cancel","canceling"]'::jsonb);
```

### sentence_slot_refs (per-sentence order)

`slot_index` must match left-to-right non-overlapping matches of `correct` in `sentences.en`. Full word coverage required.

```sql
INSERT INTO sentence_slot_refs (sentence_id, slot_index, slot_id) VALUES
  ('s-part-p2', 0, 'sl-s-she'),
  ('s-part-p2', 1, 'sl-pp-p-canceled');
```

### sentence_spans

**Anchor only.** Quote `"end"`.

```sql
INSERT INTO sentence_spans (id, sentence_id, grammar_point_id, start, "end") VALUES
  ('sp-part-v', 's-part-anchor', 'gp-v', 4, 10);
```

## Invariants

| Rule | Check |
|------|-------|
| Full coverage | every word of `en` covered by some slot `correct` |
| LTR order | `slot_index` follows appearance order in `en` |
| No swallow | distractor must not include next blank’s `correct` |
| Reuse | same `(role, correct, distractors)` → one `slots` row |

```bash
npm run grammar:validate
npm run grammar:coverage
```

## Vocabulary guardrails

Prefer high-frequency words. Uncommon anchor words get a `grammar_point` + span.
