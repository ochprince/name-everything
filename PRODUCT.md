# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary user: someone with existing English who still translates in their head first. They open the app in a micro-moment (commute, kettle, walking) to practice seeing a thing and responding in English, not to learn a word list from zero.

Not the primary user: absolute beginners relying on this product to teach a syllabus.

Interface chrome may be Chinese. Learning content is English-first.

## Product Purpose

Name Everything is a mobile-first practice loop: one image + one speakable English sentence, then Got it / Forgot / 记录. Success is repeated short sessions where the user reacts in English and builds a local review trail. Week-1 success is a usable Web loop, not accounts or store launch.

## Positioning

The product is “see → say in English” on a single card, with the target word and Chinese gloss folded away so translation is optional. Neighboring vocab apps lead with the word or a translation; this one leads with the picture and a spoken-register sentence.

## Operating Context

Used on a phone in one column, often with one hand, in mixed indoor or commute light, for seconds-to-minutes. No teacher, no classroom, no account. Progress lives only on the device (localStorage). Content for week 1 is a static T1 pack hotlinking Baicizhan CDN media for local validation only; that pack is not a long-term product asset.

## Capabilities and Constraints

Confirmed for week 1:

- Image + speakable sentence always visible; `word` and `zh` collapsed by default.
- Buttons: `Forgot` | `记录` | `Got it` (`Got it` is primary). Recorded state may read `已记录`.
- Bottom tabs: 练习 / 复习 / 我的.
- T1 only. No auth, no SRS, no camera, no AI generation, no Capacitor shell.
- Media: hotlink `https://ali.bczcdn.com/r/{file}`; do not ship image/audio binaries in git.
- Stack already in repo: React 18, Vite 5, TypeScript, React Router 6, Tailwind CSS 3.

Undecided (do not invent): official product name and long-term licensed imagery.

## Brand Commitments

Working name: Name Everything. Official name TBD — do not treat the working name as a final brand lock. User binding for this build: UI craft via Impeccable + frontend-design; do not ship the plan’s cream/paper “minimal scaffold” look.

## Evidence on Hand

- Spec: `docs/superpowers/specs/2026-08-13-name-everything-mvp-design.md`
- Plan: `docs/superpowers/plans/2026-08-13-name-everything-mvp.md`
- T1 pack: `src/content/t1-cards.json` (generated from sibling `my_app` cet4-all; CDN URLs)
- No testimonials, customers, or licensed photography. Do not fabricate social proof. Card images are third-party CDN placeholders.

## Product Principles

- Picture and sentence are the practice; the word and translation are opt-in.
- Honest queues (Forgot vs 记录) beat a fake curriculum or SRS theater.
- One-handed phone use in a micro-moment outranks desktop density.
- Chrome can be Chinese; the card face stays English unless the user unfolds 中文.
- Week-1 CDN media is a validation stub, never a store-ready asset claim.

## Accessibility & Inclusion

No product-specific standard was set beyond ordinary operable controls (buttons, expand/collapse) and readable contrast. Prefer large tap targets for the three actions on a phone.
