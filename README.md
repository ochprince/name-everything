# Name Everything

**See a thing, say the English sentence.** Mobile-first practice loop: one image, a short think timer, then Aha! / Forgot / Got it.

**Goal:** make thinking and speaking in English a habit — English first, translation second.

Inspired by [Learn How to Think In English](https://youtu.be/MpiWuR-yL9k): name what’s around you, attach words to pictures (not translations), listen and repeat, and live small moments of the day in English. The app is meant to stay useful *and* fun on that path.

**Try it:** [https://ochprince.github.io/name-everything/](https://ochprince.github.io/name-everything/)

中文说明见 [README.zh.md](README.zh.md).

## Disclaimer

本项目仅供个人学习与技术交流，不作任何商业用途。练习卡片中的图片、音频等素材通过第三方 CDN 引用，版权归原权利人所有；本仓库不对其主张权利，亦不保证可长期可用。

如权利人认为存在侵权，请通过 GitHub Issues 或仓库所有者联系方式告知，我们将在核实后尽快下架或移除相关内容。

This project is for personal learning and technical exchange only, and is not intended for commercial use. Card images and audio are hotlinked from a third-party CDN; copyright remains with the respective rights holders. This repository claims no ownership of that media and does not guarantee long-term availability.

If you believe any content infringes your rights, please open a GitHub Issue or contact the repository owner. We will review the request and remove or take down the material promptly.

## Quick start

```bash
npm install
npm run dev      # local dev server
npm test         # unit tests (Vitest)
npm run build    # production build
```

## Spec

Design spec: [`docs/superpowers/specs/2026-08-13-name-everything-mvp-design.md`](docs/superpowers/specs/2026-08-13-name-everything-mvp-design.md)  
Timed recall: [`docs/superpowers/specs/2026-08-16-timed-recall-design.md`](docs/superpowers/specs/2026-08-16-timed-recall-design.md)  
Grammar Everything: [`docs/superpowers/specs/2026-08-22-grammar-everything-design.md`](docs/superpowers/specs/2026-08-22-grammar-everything-design.md)  
Implementation plan: [`docs/superpowers/plans/2026-08-22-grammar-everything.md`](docs/superpowers/plans/2026-08-22-grammar-everything.md)

## Practice Home

The **练习** tab opens a module picker at `/` (no countdown until you enter a module):

| Tile | Route | Notes |
|------|-------|-------|
| 词汇记忆 | `/practice/pictures` | Timed picture recall (Name Everything) |
| 语法学习 | `/practice/grammar/learn` | Chapters → levels → learn page → falling-fill |
| 挑战模式 | `/practice/grammar/play` | Timed challenge from passed levels; trophy on full clear when pool ≥ 30 |

Grammar content is stored in **Supabase** (`chapters`, `grammar_points`, `levels`, `sentences`, `sentence_spans`, `slots`, `sentence_slot_refs`, `game_tuning`). The app loads it via the Data API with **IndexedDB per-table cache**: after the first full fetch, later visits reuse cache and only re-download tables whose `content_table_versions` entry changed (DB triggers bump versions on content writes). Author new lessons as SQL migrations under `supabase/migrations/` (see `.cursor/skills/grammar-content-pack`), then push so GitHub-linked Supabase applies them. Validate with `npm run grammar:validate` and `npm run grammar:coverage`.

Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY` for local dev. GitHub Pages builds need the same keys as repository secrets (`deploy-pages.yml`). Database password is only for Supabase CLI / direct Postgres (`SUPABASE_DB_PASSWORD` in your shell, not in the Vite app).

Grammar reports are saved locally for export on **我的** and also inserted into `asset_reports` when Supabase is configured.

## Roadmap

- [x] **Name Everything** — one tap: 1 image + 1 word + 1 speakable sentence. A countdown adds just enough pressure; review trains a scene → word reflex.
- [x] **Grammar Everything (substitute)** — learn page + timed falling-fill for passed levels; chapter 1 playable in repo. *Identify* and *restructure* remain on the roadmap. Spec: [`docs/superpowers/specs/2026-08-22-grammar-everything-design.md`](docs/superpowers/specs/2026-08-22-grammar-everything-design.md). Plan: [`docs/superpowers/plans/2026-08-22-grammar-everything.md`](docs/superpowers/plans/2026-08-22-grammar-everything.md). Sketch: [`docs/thought/2026-08-22-grammar-everything.md`](docs/thought/2026-08-22-grammar-everything.md).
- [ ] **Listen & Repeat** — turn “what you just said” or the scene example into shadowing + recording, then pack those clips into timed recap playlists. You hear your own effort and progress; mouth and mind work together.
- [ ] **Live Small Moments** — 60-second challenges tied to real scenes (waking up, commute, meals, walking around). AI asks what you’re doing now and builds a 60s dialogue from the answer — closer to daily life, more interactive, more pressure.
- [ ] **Comprehensible Input content** — design content around comprehensible input: increase reading volume and ramp up gradually.
- [ ] **Shadowing** — practice standard pronunciation and spoken English by shadowing; the point is to speak out loud.

## Known issues & design notes

Grammar falling-fill gameplay — recorded from user review (2026-08-25):

1. **Brute-force exploit** — rapidly clicking all four options reveals the answer: a wrong pick does not kill the sentence immediately (3 strikes per sentence), so the 4th option always goes through. Scores can be farmed this way.
2. **Idea — difficulty modes**:
   - Hard mode: each option has only one error chance.
   - Hell mode: no error chances at all.
3. **Me-page settings organization** — config items currently mix vocab-memory settings with grammar/challenge-mode settings. Group them by module (sections/blocks) so the page stays elegant and clear as items grow (grammar game-mode/difficulty selectors may join later). Alternative: split settings into a standalone page with a single entry point from Me — the common app pattern.
4. **Challenge mode is still recognition, not substitution** — ~50% of sentences in level drills and challenge mode are now whole-sentence English input (Chinese prompt → type English → lenient match against that sentence's `en`): recall production, not multiple-choice recognition. True **substitution** remains future work: generative prompts with a new target sentence (swap subject/object/verb), not comparing against the same example `en`.

## Week-1 out of scope

Product ideas above live on the Roadmap, not in week 1.

- AI long-tail card generation
- Camera / photo recognition mode
- Capacitor native shell or app-store release
- Formal product naming / brand polish pass
- Multi-device accounts or sync
- Formal spaced-repetition (SRS) scheduling
- Copying Baicizhan jpeg / mp3 binaries into this repo

## Regenerate T1 cards

From the repo root (requires a sibling `my_app` checkout with `assets/data/words/cet4-all`):

```bash
node scripts/build-t1-pack.mjs
```

Writes `src/features/pictures/content/t1-cards.json` with CDN URLs for images and audio.

## Media notes

Card images and audio **hotlink the Baicizhan CDN** (`https://ali.bczcdn.com/r/…`) for practice wiring. See **Disclaimer** above for ownership and takedown. Do not treat this pack as a long-term product asset; replace with licensed media before any commercial or store release.

## Week-1 verification checklist

Manual smoke-check after `npm run dev` (stop the dev server when done):

- [ ] **Home** — three tiles; no countdown on `/`; 挑战模式 disabled until one level passed; click shows hint
- [ ] **词汇记忆** (`/practice/pictures`) — image visible; countdown in the cue stage; word / sentence hidden until Aha!; timeout reveals the answer, increments the 复习 count, and waits for Next
- [ ] Aha! reveals word + sentence; Forgot / Got it apply immediately
- [ ] A daily set of 10 practice Got its shows 今日已完成; Continue keeps the header at 10 / 10 and starts another set
- [ ] **语法学习** — chapter list; linear unlock; learn page spans; start falling-fill; pass threshold unlocks next level
- [ ] **挑战模式** — stratified 30-sentence sessions; grouped speed ramp; trophy on 30/30 when pool ≥ 30; hub shows history and cumulative trophy count
- [ ] **Review** — Forgot list updates; sheet opens already revealed
- [ ] **Me** — today count, streak, 思考时长 persist; export grammar reports JSON
- [ ] Mobile viewport usable (one column, large tap targets)
