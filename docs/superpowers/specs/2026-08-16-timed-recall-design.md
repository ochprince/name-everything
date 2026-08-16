# Timed recall practice — Design Spec

**Date:** 2026-08-16  
**Status:** Confirmed  
**Branch:** `feat/timed-recall` (preview on Pages before merging to `main`)

## Problem

The current loop lets the user tap Got it / Forgot with no time pressure. The closed-eye reveal is optional, so many cards are judged without a recall attempt.

## Loop

Practice card, think phase:

1. Photo only. Cue stage shows a countdown (default 5s; settings 3s / 5s / 10s / 15s).
2. One action: **Aha!**. Tapping the photo or the number does not reveal.
3. Timer hits 0: reveal word + sentence (auto-speak if enabled). Card → Forgot queue (毫无记忆) immediately so the 复习 badge increments. Bottom action is **Next** only — no Forgot / Got it, no fly-to-nav. Stay on the card until Next.

Aha!:

1. Stop the timer. Raise word + sentence (existing lighting raise). Auto-speak if enabled.
2. Actions become **Forgot** | **Got it**. No Forgot hold / tide. Study as long as needed. Stay revealed until one action.

Forgot (after Aha!): enqueue Forgot, next card.  
Timeout **Next**: the cursor already moved on timeout; Next only dismisses the lingering card. Leaving practice (e.g. 复习) drops the linger so the next visit is the following card.  
Got it: graduate to 较好记忆, count toward today’s set, next card (or a wrap screen).

## Daily set

- Only **practice** Got it counts.
- Header: `n / d` where `n` is today’s practice Got it total (does not reset on Continue) and `d = max(n, min(10, n + remaining pool))`.
- At 10 practice Got its with pool remaining: wrap **今日已完成** + **继续**.
- Pool empty (no 毫无记忆 / 有点记忆 left): wrap **这一批都会了**, no continue. If the last Got it happens before 10, still this wrap — do not pad to 10.
- Continue keeps the header at `10 / 10` (or `n / n` after more Got its) and starts another set from the remaining pool. The wrap repeats every additional 10.
- Mid-set refresh restores the same card and count.

## Memory tiers (not SRS)

| Tier | Entered by | Practice |
| --- | --- | --- |
| 毫无记忆 | Unseen, or in Forgot queue (timeout / practice Forgot) | Weight 5 |
| 有点记忆 | Review Got it, not yet practice Got it | Weight 2 |
| 较好记忆 | Practice Got it | **Never** in practice |

Empty bucket skipped. Do not draw the same id twice in a row when another card exists. Tag rotation unchanged.

Review Got it does **not** increment the daily 10. Review Forgot stays in the Forgot list (newest first).

## Streak

Any learning action on a calendar day increments streak once: practice Got it / Forgot / timeout, or review Got it / Forgot. Opening the app with no judgment does not count.

## Review

- List still shows thumbnail + sentence.
- Sheet opens already revealed (photo + word + sentence). No think timer, no Aha!.
- Forgot / Got it apply immediately.

## Settings

Replace **Forgot 停顿** with **思考时长**: 3s / 5s / 10s (default 5s). Drop 不停顿 and 15s. Migrate stored 0 / 15000 / unknown → 5000.

## Untouched

Cyclorama tokens, bottom tabs, `pinnedIds` (unused), CDN media, no auth.

## Anti-goals

Fake SRS intervals. Auto-advance or fly the photo on timeout. Recycle 较好记忆 into practice. Hero-metric wrap screens. Forgot tide.
