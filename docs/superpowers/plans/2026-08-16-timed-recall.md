# Timed Recall Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace honor-system Got it / Forgot with a timed recall loop, a daily set of 10 practice Got its, and three memory tiers that let T1 actually finish.

**Architecture:** Keep cyclorama chrome. Progress grows `warmIds` / `strongIds` / `dailyContinues` and renames the hold setting to `thinkHoldMs`. `pickNextCard` draws only 毫无记忆 + 有点记忆 (5:2). PracticeCard gains a think phase; review sheets start revealed. PracticePage owns set wrap screens and the timeout fly-to-复习 motion.

**Tech Stack:** React 18, Vite 5, TypeScript, Vitest, React Testing Library, Tailwind 3, localStorage.

## Global Constraints

- Work only on `feat/timed-recall`; do not merge to `main`.
- Interface chrome may be Chinese; card face stays English unless ZH is chosen after reveal.
- No fake SRS; weights are 5:2 only; 较好记忆 never returns to practice.
- Timeout never reveals the answer.
- Copy: Aha! / Forgot / Got it / 今日已完成 / 继续 / 这一批都会了 / 思考时长.
- Inherit cyclorama tokens; no cream flashcards, gradient text, or hero-metric wrap.
- TDD: failing test before production code.
- Update `README.md` and `README.zh.md` together.

## File map

- Modify: `src/lib/storage.ts`, `src/lib/storage.test.ts`
- Modify: `src/lib/deck.ts`, `src/lib/deck.test.ts`
- Modify: `src/components/PracticeCard.tsx`, `src/components/PracticeCard.test.tsx`
- Modify: `src/pages/PracticePage.tsx`, `src/pages/PracticePage.test.tsx`
- Modify: `src/pages/ReviewPage.tsx`, `src/pages/ReviewPage.test.tsx`
- Modify: `src/pages/MePage.tsx`, `src/pages/MePage.test.tsx`
- Modify: `src/components/BottomNav.tsx`
- Modify: `src/index.css`
- Modify: `PRODUCT.md`, `DESIGN.md`, `README.md`, `README.zh.md`

### Task 1: Progress model

**Files:** `src/lib/storage.ts`, `src/lib/storage.test.ts`

**Produces:** `THINK_HOLD_OPTIONS`, `thinkHoldMs`, `warmIds`, `strongIds`, `dailyContinues`, `markPracticeGotIt` (keep `markGotIt` as this), `markReviewGotIt`, `markForgot` + streak touch, `currentSetView`, `ackDailyContinue`.

- [ ] Failing tests for tiers, streak-on-forgot, thinkHold migration, set wrap math
- [ ] Implement
- [ ] Tests pass
- [ ] Commit

### Task 2: Deck

**Files:** `src/lib/deck.ts`, `src/lib/deck.test.ts`

**Produces:** `pickNextCard` returns `null` when only 较好记忆 remain; 5:2 cold/warm; never recycles `strongIds`.

- [ ] Failing tests
- [ ] Implement
- [ ] Tests pass
- [ ] Commit

### Task 3: PracticeCard think / reveal

**Files:** `src/components/PracticeCard.tsx`, `src/components/PracticeCard.test.tsx`, `src/index.css`

**Produces:** think countdown + Aha!; reveal Forgot/Got it with no hold; `onTimeout`; `chrome='sheet'` starts revealed.

- [ ] Failing tests
- [ ] Implement
- [ ] Tests pass
- [ ] Commit

### Task 4: Practice / review / me pages

**Files:** pages, BottomNav, READMEs, PRODUCT.md, DESIGN.md

**Produces:** `n / d` header, daily/pack wraps, timeout fly to `#nav-review`, review Got it → warm, 思考时长 settings.

- [ ] Failing tests
- [ ] Implement
- [ ] Full `npm test` + `npm run build`
- [ ] Commit
