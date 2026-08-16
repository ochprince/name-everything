---
name: Name Everything
description: See a thing, say the English sentence — a night-to-dawn cyclorama, not a vocab flashcard.
colors:
  cyc: "#05060a"
  cobalt: "#1e3a8a"
  rose: "#e8a598"
  day: "#f4f1ea"
  ink: "#05060a"
typography:
  cue:
    fontFamily: "Big Shoulders Text, Noto Sans SC, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "0.08em"
  sentence:
    fontFamily: "Big Shoulders Text, Noto Sans SC, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 500
    lineHeight: 1.375
    letterSpacing: "0.01em"
  mark:
    fontFamily: "Big Shoulders Text, Noto Sans SC, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.22em"
rounded:
  sm: "12px"
  md: "16px"
  lg: "16px"
  full: "9999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "28px"
  gutter: "16px"
  tab-reserve: "7rem"
components:
  button-got-it:
    backgroundColor: "{colors.day}"
    textColor: "{colors.cyc}"
    rounded: "{rounded.md}"
    height: "56px"
    padding: "0 10px"
    typography: "{typography.cue}"
  button-find-it:
    backgroundColor: "{colors.day}"
    textColor: "{colors.cyc}"
    rounded: "{rounded.md}"
    height: "56px"
    padding: "0 10px"
    typography: "{typography.cue}"
  button-forgot:
    backgroundColor: "{colors.cyc}"
    textColor: "{colors.day}"
    rounded: "{rounded.md}"
    height: "56px"
    padding: "0 10px"
    typography: "{typography.cue}"
  button-pin:
    backgroundColor: "{colors.rose}"
    textColor: "{colors.cyc}"
    rounded: "{rounded.md}"
    height: "56px"
    padding: "0 10px"
    typography: "{typography.cue}"
  horizon-sentence:
    backgroundColor: "{colors.rose}"
    textColor: "{colors.cyc}"
    rounded: "{rounded.md}"
    padding: "12px"
    typography: "{typography.sentence}"
---

# Name Everything visual system

## Overview

The practice surface is a **cyclorama**: depthless night at the top, a cobalt horizon, rose gathering toward day-wash at the feet. The object photograph is an actor inset on that wash. The speakable English sentence sits on a rose horizon band. Word and 中文 are lighting cues you raise; **Got it** is day.

This is Operate UI. Familiar tap targets, locked button copy (`Aha!` then `Forgot` / `Got it`), one-handed phone column. Expression lives in the wash, the cue type, and the action materials — not in a cream flashcard shell.

## Colors

| Token | Hex | Role |
| --- | --- | --- |
| `cyc` | `#05060a` | Ground, chrome, Forgot fill |
| `cobalt` | `#1e3a8a` | Horizon structure in the wash |
| `rose` | `#e8a598` | Sentence band, 记录, counts, empty cue |
| `day` | `#f4f1ea` | Got it fill, body on cyc, selected tabs |
| `ink` | `#05060a` | Text on rose/day |

Sentence on rose uses `cyc` ink (not `day`) so contrast stays ≥4.5:1. Inactive nav is `day` at ~80% opacity, never a cool gray. Color is never the only state signal: labels stay.

## Typography

One family: self-hosted **Big Shoulders Text** (latin) with **Noto Sans SC** for Han. Lighting-plot stencil caps for chrome; the sentence is the same face at readable weight. Fixed rem steps, not fluid clamp. Tracking on chrome `0.08em`–`0.22em`; sentence `0.01em`. Do not introduce Inter, Space Grotesk, or a second display serif.

## Layout

Mobile-first single column, `max-w-md`, `px-4`. Photo keeps a 4:3 set-piece crop, slightly inset (`px-2`), capped at about `32vh` so the cue stage has room. The cue panel between photo and actions is a stable flex region (min ~12.5rem): think countdown and revealed word/sentence swap inside it without shoving the action row. Stage chrome uses a fixed `h-dvh` column with `pb-28` for the tab bar; review overlay uses `sheet` chrome (no tab reserve). Safe-area padding on the top of each page.

## Elevation & Depth

Object photos cast a large offset shadow (`0 22px 44px -14px` black). No zero-offset glow, no glass. The cyclorama wash is a radial + linear stack plus a 7% grain overlay — atmosphere, not a card.

## Shapes

Controls are `rounded-2xl` (16px). Fold cues and speaker marks are pills/circles. Do not mix hard 4px admin radii into this world.

## Components

- **Got it** — day-wash fill, cyc ink, primary.
- **Forgot** — cyc fill, day outline.
- **Aha!** — day-wash fill, same cue size as Got it; think phase only.
- **Next** — same day-wash fill as Aha!; timeout reveal only.
- **Horizon sentence** — rose band + speaker.
- **Think countdown** — large day numeral in the cue stage (not a tappable eye). Timeout reveals in place; 复习 badge increments.
- **BottomNav** — cyc bar, rose active, day/80 idle; hairline rose→cobalt.

Motion is a lighting raise, not page choreography. Word and sentence lift ~480ms (`cubic-bezier(0.16, 1, 0.3, 1)`) with a short `translateY`, sentence 80ms later. Think time is 3s / 5s / 10s / 15s (default 5s). Timeout raises the answer and waits for Next. `prefers-reduced-motion: reduce` drops the raise; the think timer stays.

## Do's and Don'ts

**Do**

- Lead with the picture; keep word/sentence hidden until Aha! (or review).
- Put sentence ink on rose as `cyc`.
- Treat empty Forgot / 记录 as rose cue bands with the spec copy.

**Don't**

- Cream/paper flashcards, purple SaaS gradients, or Inter.
- Hero-metric dashboards on 我的 (no giant number + tiny label grid).
- Gradient text, glass cards, or colored side-stripes.
- Overlay a second product name on the review sheet (use 返回).
