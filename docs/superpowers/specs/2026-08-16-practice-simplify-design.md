# Practice simplify (2026-08-16)

**Goal:** Two actions only (Forgot / Got it), stable practice cursor, click blank to hide cues.

## Behavior

1. Remove 记录 / pin from practice chrome and review tabs. Review shows one Forgot list. Existing `pinnedIds` ignored (test data disposable).
2. Persist `currentCardId` (+ `recentPracticeTag`) in progress. Remount / tab switch restores the same card. Only Forgot / Got it advance and write the next id.
3. After reveal: click image or empty cue-stage background hides cues; word/sentence/speakers/lang toggle do not.

## Touch

- `src/lib/storage.ts` (+ tests)
- `src/pages/PracticePage.tsx` (+ tests)
- `src/pages/ReviewPage.tsx` (+ tests)
- `src/components/PracticeCard.tsx` (+ tests)
