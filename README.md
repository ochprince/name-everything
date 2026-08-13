# Name Everything

**See a thing, say the English sentence.** Mobile-first practice loop: one image + one speakable English sentence, then Got it / Forgot / 记录.

## Quick start

```bash
npm install
npm run dev      # local dev server
npm test         # unit tests (Vitest)
npm run build    # production build
```

## Spec

Design spec: [`docs/superpowers/specs/2026-08-13-name-everything-mvp-design.md`](docs/superpowers/specs/2026-08-13-name-everything-mvp-design.md)

## Week-1 out of scope

- AI long-tail card generation
- Camera / photo recognition mode
- Capacitor native shell or app-store release
- Listen & repeat (recording / pronunciation scoring)
- Live 60s life-scene challenges
- Formal product naming / brand polish pass
- Multi-device accounts or sync
- Formal spaced-repetition (SRS) scheduling
- Copying 百词斩 jpeg/mp3 binaries into this repo

## Regenerate T1 cards

From the repo root (requires sibling checkout `my_app` with `assets/data/words/cet4-all`):

```bash
node scripts/build-t1-pack.mjs
```

Writes `src/content/t1-cards.json` with CDN URLs for images and audio.

## Media disclaimer

Card images and audio **hotlink the 百词斩 CDN** (`https://ali.bczcdn.com/r/…`) for **local validation only**. Do not treat this pack as a long-term product asset. **Replace with licensed media before any public or store release** (same stance as the `my_app` README).

## Week-1 verification checklist

Manual smoke-check after `npm run dev` (stop the dev server when done):

- [ ] **练习** — image + original sentence visible; word / 中文 hidden until expand
- [ ] Sentence speaker plays CDN audio (TTS fallback if CDN fails)
- [ ] Got it / Forgot / 记录 behave per spec; 已记录 when pinned
- [ ] **复习** — Forgot and 记录 queues update after actions
- [ ] **我的** — today count, streak, settings (default expand word / 中文) persist
- [ ] Mobile viewport usable (one column, large tap targets)
