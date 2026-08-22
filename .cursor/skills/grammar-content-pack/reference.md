# Grammar Content Pack — Reference

Schema source: `docs/superpowers/specs/2026-08-22-grammar-everything-design.md` §8.1  
Types: `src/features/grammar/content/pack.ts`

## Field quick reference

### chapters.json

```json
{ "id": "nonfinite", "title_zh": "非谓语", "description_zh": "…", "sort_order": 3, "released": false }
```

### grammar_points.json

```json
{ "id": "gp-pp-active", "title_zh": "现在分词（主动）", "body_zh": "…" }
```

### levels.json

```json
{ "id": "participle-1", "chapter_id": "nonfinite", "sort_order": 1, "grammar_point_id": "gp-participle" }
```

Optional overrides: `pass_threshold`, `lives`, `fall_duration_ms`.

### sentences.json

```json
{
  "id": "s-part-anchor",
  "level_id": "participle-1",
  "kind": "anchor",
  "en": "She pushed the door, seeing students sitting on the chairs.",
  "zh": "她推开门，看见学生们坐在椅子上。",
  "prompt_kind": "zh",
  "sort_order": 0
}
```

### sentence_spans.json

**Anchor only.** Do not add rows whose `sentence_id` is a `playable` sentence.

```json
{
  "id": "sp-part-v",
  "sentence_id": "s-part-anchor",
  "grammar_point_id": "gp-v",
  "start": 4,
  "end": 10
}
```

`en.slice(start, end)` must equal the highlighted text.

### sentence_slots.json

```json
{
  "id": "s-part-p2-slot-0",
  "sentence_id": "s-part-p2",
  "slot_index": 0,
  "role": "PP-P",
  "correct": "canceled",
  "distractors": ["was canceled", "cancel", "canceling"]
}
```

## Worked example — 分词（时态随主句谓语）

**Rule (Chinese):** 分词不自带时态，时态跟随主句谓语；主动 doing，被动 done；`canceled` ≠ `was canceled`.

**Chapter:** `nonfinite` (existing)

**New grammar_points:**

| id | title_zh |
|----|----------|
| `gp-nonfinite-tense` | 非谓语不带时态 |
| `gp-pp-active` | 现在分词（主动） |
| `gp-pp-passive` | 过去分词（被动） |
| `gp-pp-vs-pred-passive` | 分词被动 ≠ 谓语被动 |
| `gp-participle` | 分词（关标题） |

**Level:** `participle-1` → `gp-participle`

**Four sentences:**

| id | kind | en (short) |
|----|------|------------|
| `s-part-anchor` | anchor | She pushed the door, seeing students sitting on the chairs. |
| `s-part-p1` | playable | He entered the hall, noticing everyone chatting happily. |
| `s-part-p2` | playable | The sports meeting canceled, students went back sadly. |
| `s-part-p3` | playable | The game called off, they left the stadium early. |

**Anchor spans only** (no spans for `s-part-p1` … `p3`):

| text | grammar_point_id |
|------|------------------|
| She | gp-s |
| pushed | gp-v |
| seeing | gp-pp-active |
| sitting | gp-pp-active |
| seeing students sitting on the chairs | gp-nonfinite-tense |

**Slot teaching focus:**

| Level area | correct | distractors intent |
|------------|---------|-------------------|
| Main V | pushed / entered / went | finite vs -ing (pushing) |
| PP active | seeing / sitting | saw, seen, sits |
| PP passive | canceled / called off | **was canceled**, cancel, canceling |

## Distractor patterns

| Mistake to catch | distractor examples |
|------------------|---------------------|
| Nonfinite used as finite predicate | pushing, was seeing |
| Wrong participle voice | seen vs seeing; cancel vs canceled |
| Passive predicate vs participle | was canceled, was called off |
| Wrong tense on main verb | go / goes / going for went |

## Vocabulary guardrails

Prefer: push, enter, see, sit, chat, go, leave, call off, student, door, hall, chair, game, meeting, classroom, stadium.

Avoid: nevertheless, approximately, infrastructure, phenomenon, commence.
