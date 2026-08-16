# Name Everything

**See a thing, say the English sentence.** Mobile-first practice loop: one image, a short think timer, then Find it / Forgot / Got it.

**Try it:** [https://ochprince.github.io/name-everything/](https://ochprince.github.io/name-everything/)

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

## Week-1 out of scope

- AI long-tail card generation
- Camera / photo recognition mode
- Capacitor native shell or app-store release
- Listen & repeat (recording / pronunciation scoring)
- Live 60s life-scene challenges
- Formal product naming / brand polish pass
- Multi-device accounts or sync
- Formal spaced-repetition (SRS) scheduling
- Copying Baicizhan jpeg / mp3 binaries into this repo

## Regenerate T1 cards

From the repo root (requires a sibling `my_app` checkout with `assets/data/words/cet4-all`):

```bash
node scripts/build-t1-pack.mjs
```

Writes `src/content/t1-cards.json` with CDN URLs for images and audio.

## Media notes

Card images and audio **hotlink the Baicizhan CDN** (`https://ali.bczcdn.com/r/…`) for practice wiring. See **Disclaimer** above for ownership and takedown. Do not treat this pack as a long-term product asset; replace with licensed media before any commercial or store release.

## Week-1 verification checklist

Manual smoke-check after `npm run dev` (stop the dev server when done):

- [ ] **Practice** — image visible; countdown in the cue stage; word / sentence hidden until Find it; timeout reveals the answer, increments the 复习 count, and waits for Next
- [ ] Find it reveals word + sentence; Forgot / Got it apply immediately
- [ ] A daily set of 10 practice Got its shows 今日已完成; Continue starts another set
- [ ] **Review** — Forgot list updates; sheet opens already revealed
- [ ] **Me** — today count, streak, and 思考时长 persist
- [ ] Mobile viewport usable (one column, large tap targets)
