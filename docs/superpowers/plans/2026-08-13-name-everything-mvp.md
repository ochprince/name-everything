# Name Everything MVP (Week-1 Web) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a mobile-first Web app where a user can practice Name Everything cards (image + speakable sentence; word/zh folded), mark Got it / Forgot / 记录, and review those queues locally.

**Architecture:** New Vite + React + TypeScript SPA in a sibling repo. Static JSON content pack (T1 nouns filtered from `my_app` cet4-all) drives the deck; images and original word/sentence audio hotlink `https://ali.bczcdn.com/r/...`. Client-only state (localStorage) tracks progress. No auth, no AI, no camera in week-1 must-scope. Capacitor wrapping is out of scope for this plan.

**Tech Stack:** React 18, Vite 5, TypeScript, React Router 6, Tailwind CSS 3, Vitest + Testing Library, `lucide-react` for icons.

**Spec:** `docs/superpowers/specs/2026-08-13-name-everything-mvp-design.md`

## Global Constraints

- New project path: `E:/Workspace-Web/name-everything` (do not modify picture-talk or my_app main loops).
- Learning content: image + sentence always visible; `word` and `zh` collapsed by default.
- Buttons (week-1 copy): `Forgot` | `记录` | `Got it` (Got it is primary).
- Week-1 media: hotlink Baicizhan CDN like `my_app` (`https://ali.bczcdn.com/r/{file}`). Do not copy image/audio binaries into git. Do not copy the 2315 cet4-all JSON files — emit one `t1-cards.json`.
- Source JSON (read-only): `E:/Workspace-Web/my_app/assets/data/words/cet4-all`.
- No Chinese on the card face unless user expands `zh`.
- Tier: ship T1 only. No auth. No SRS. localStorage only.
- Mobile-first single column; bottom tab bar: 练习 / 复习 / 我的.
- Commits happen in `name-everything` repo once `git init` is done.

---

## File structure (target)

```
name-everything/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── tailwind.config.js
├── postcss.config.js
├── index.html
├── README.md
├── scripts/
│   └── build-t1-pack.mjs      # reads my_app cet4-all → src/content/t1-cards.json
├── public/
│   └── images/cards/fallback.svg
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── vite-env.d.ts
│   ├── types/card.ts
│   ├── content/t1-cards.json
│   ├── content/loadCards.ts
│   ├── lib/storage.ts
│   ├── lib/deck.ts
│   ├── lib/stats.ts
│   ├── lib/tts.ts
│   ├── lib/playAudio.ts
│   ├── hooks/useProgress.ts
│   ├── components/BottomNav.tsx
│   ├── components/PracticeCard.tsx
│   ├── components/FoldRow.tsx
│   ├── pages/PracticePage.tsx
│   ├── pages/ReviewPage.tsx
│   ├── pages/MePage.tsx
│   └── test/setup.ts
└── src/**/*.test.ts
```

---

### Task 1: Scaffold the Vite app

**Files:**
- Create: entire Vite React-TS project under `E:/Workspace-Web/name-everything`
- Create: Tailwind + Vitest wiring as below

**Interfaces:**
- Consumes: none
- Produces: runnable `npm run dev`, `npm test`

- [ ] **Step 1: Create project**

```bash
cd /e/Workspace-Web
npm create vite@latest name-everything -- --template react-ts
cd name-everything
npm install
npm install react-router-dom lucide-react
npm install -D tailwindcss@3 postcss autoprefixer vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
npx tailwindcss init -p
git init
```

- [ ] **Step 2: Configure Tailwind**

Replace `tailwind.config.js` content:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1a1a1a',
        paper: '#f7f4ef',
        accent: '#0f6b5c',
        muted: '#6b6560',
        danger: '#8b3a3a',
      },
    },
  },
  plugins: [],
}
```

Replace `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color: #1a1a1a;
  background: #f7f4ef;
  font-family: "Segoe UI", "PingFang SC", "Noto Sans SC", system-ui, sans-serif;
}

html,
body,
#root {
  height: 100%;
}

body {
  margin: 0;
}
```

- [ ] **Step 3: Configure Vitest in `vite.config.ts`**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
  },
})
```

Create `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom'
```

Add to `package.json` scripts:

```json
"test": "vitest run",
"test:watch": "vitest"
```

Ensure `tsconfig` / `tsconfig.app.json` include Vitest types if needed (`"types": ["vitest/globals"]` in the app tsconfig that covers tests).

- [ ] **Step 4: Smoke-run**

```bash
npm test
npm run build
```

Expected: tests may be empty/pass; build succeeds.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "chore: scaffold Vite React TS app with Tailwind and Vitest"
```

---

### Task 2: Card types + T1 content pack (cet4-all → CDN)

**Files:**
- Create: `src/types/card.ts`
- Create: `scripts/build-t1-pack.mjs`
- Create: `src/content/t1-cards.json` (generated; commit the JSON, not source binaries)
- Create: `src/content/loadCards.ts`
- Create: `src/content/loadCards.test.ts`
- Create: `public/images/cards/fallback.svg` (img `onerror` only)

**Interfaces:**
- Consumes: read-only `E:/Workspace-Web/my_app/assets/data/words/cet4-all/{id}.json`
- Produces:
  - `export type CardTier = 'T1' | 'T2' | 'T3'`
  - `export type ImageSource = 'curated' | 'baicizhan' | 'ai' | 'camera'`
  - `export interface Card { id: string; word: string; sentence: string; image: string; imageSource: ImageSource; zh?: string; tags: string[]; tier: CardTier; wordAudio?: string; sentenceAudio?: string; audioHint?: { word?: string; sentence?: string } }`
  - `export function loadCards(): Card[]`
  - CDN prefix: `https://ali.bczcdn.com/r/`

**T1 allowlist (40 ids, all exist in cet4-all; skip branded / verb-first / truncated sentences):**

| Tag | ids |
|-----|-----|
| home | ladder, boot, bowl, spoon, plate, basin, couch, curtain, glue, mirror, laptop, keyboard, cap, diary |
| street | airplane, garage, gym, clinic, museum, grocery, motel, dock, harbor, jet, bank, gate, cabin, corridor |
| food | ingredient, dish, barbecue, harvest |
| body | lung, bear, nest, branch, log, ocean, trail, bench |

`zh`: take `mean_cn`, strip leading `n.`, keep text before first `；` / `，` / `;`.

- [ ] **Step 1: Write failing test**

Create `src/content/loadCards.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { loadCards } from './loadCards'

const CDN = /^https:\/\/ali\.bczcdn\.com\/r\//

describe('loadCards', () => {
  it('returns at least 30 T1 baicizhan-placeholder cards with required fields', () => {
    const cards = loadCards()
    expect(cards.length).toBeGreaterThanOrEqual(30)
    for (const c of cards) {
      expect(c.id).toBeTruthy()
      expect(c.word).toBeTruthy()
      expect(c.sentence).toBeTruthy()
      expect(c.image).toMatch(CDN)
      expect(c.wordAudio).toMatch(CDN)
      expect(c.sentenceAudio).toMatch(CDN)
      expect(c.imageSource).toBe('baicizhan')
      expect(c.tier).toBe('T1')
      expect(Array.isArray(c.tags)).toBe(true)
      expect(c.tags.length).toBeGreaterThan(0)
      expect(c.sentence.toLowerCase()).not.toContain('baicizhan')
    }
    const ids = new Set(cards.map((c) => c.id))
    expect(ids.size).toBe(cards.length)
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npm test -- src/content/loadCards.test.ts
```

Expected: FAIL (module not found).

- [ ] **Step 3: Implement types + pack builder + loader**

`src/types/card.ts`:

```ts
export type CardTier = 'T1' | 'T2' | 'T3'
export type ImageSource = 'curated' | 'baicizhan' | 'ai' | 'camera'

export interface Card {
  id: string
  word: string
  sentence: string
  image: string
  imageSource: ImageSource
  zh?: string
  tags: string[]
  tier: CardTier
  wordAudio?: string
  sentenceAudio?: string
  audioHint?: {
    word?: string
    sentence?: string
  }
}
```

`scripts/build-t1-pack.mjs` — Node script that:

1. Reads each allowlist id from `E:/Workspace-Web/my_app/assets/data/words/cet4-all/{id}.json`
2. Builds `image` / `wordAudio` / `sentenceAudio` as `https://ali.bczcdn.com/r/` + filename
3. Copies original `sentence` (keep Baicizhan wording; unescape `\u0027` / `\'`)
4. Sets `imageSource: "baicizhan"`, `tier: "T1"`, tags from the table above
5. Writes `src/content/t1-cards.json`

Do **not** copy jpeg/mp3/aac files. Do **not** import the whole cet4-all folder.

`src/content/loadCards.ts`:

```ts
import type { Card } from '../types/card'
import raw from './t1-cards.json'

export function loadCards(): Card[] {
  return raw as Card[]
}
```

Example generated entry:

```json
{
  "id": "ladder",
  "word": "ladder",
  "sentence": "I climbed up the ladder to change the light bulb.",
  "image": "https://ali.bczcdn.com/r/i_13_8950_0_5_160405151318-gigapixel-scale.jpg",
  "imageSource": "baicizhan",
  "zh": "梯子",
  "tags": ["home"],
  "tier": "T1",
  "wordAudio": "https://ali.bczcdn.com/r/us_ladder_20231218142026034_9b6140a46e1b180efdfc.mp3",
  "sentenceAudio": "https://ali.bczcdn.com/r/sa_1_8950_0_6_160406144733.aac"
}
```

Add a tiny `public/images/cards/fallback.svg` for `<img onError>`. Enable JSON resolve in TS (`resolveJsonModule: true` — Vite template usually has this).

Run:

```bash
node scripts/build-t1-pack.mjs
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npm test -- src/content/loadCards.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/types/card.ts src/content scripts/build-t1-pack.mjs public/images
git commit -m "feat: add T1 pack from cet4-all with Baicizhan CDN media"
```

---

### Task 3: Progress storage (Got it / Forgot / 记录 / stats)

**Files:**
- Create: `src/lib/storage.ts`
- Create: `src/lib/storage.test.ts`

**Interfaces:**
- Consumes: `Card.id: string`
- Produces:
  - `export type ProgressState = { forgotIds: string[]; pinnedIds: string[]; gotItToday: Record<string, string[]>; streaks: { lastActiveDate: string | null; count: number }; settings: { expandWord: boolean; expandZh: boolean } }`
  - `export function loadProgress(): ProgressState`
  - `export function saveProgress(state: ProgressState): void`
  - `export function markGotIt(state, cardId, today: string): ProgressState`
  - `export function markForgot(state, cardId): ProgressState`
  - `export function togglePin(state, cardId): ProgressState`
  - `export function todayKey(d?: Date): string` → `YYYY-MM-DD` local
  - Storage key: `name-everything/progress/v1`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import {
  loadProgress,
  saveProgress,
  markGotIt,
  markForgot,
  togglePin,
  todayKey,
} from './storage'

beforeEach(() => {
  localStorage.clear()
})

describe('progress storage', () => {
  it('markForgot adds id and markGotIt removes it from forgot', () => {
    let s = loadProgress()
    s = markForgot(s, 'cup')
    expect(s.forgotIds).toContain('cup')
    s = markGotIt(s, 'cup', todayKey())
    expect(s.forgotIds).not.toContain('cup')
    expect(s.gotItToday[todayKey()]).toContain('cup')
  })

  it('togglePin pins and unpins without touching forgot', () => {
    let s = loadProgress()
    s = markForgot(s, 'door')
    s = togglePin(s, 'door')
    expect(s.pinnedIds).toContain('door')
    expect(s.forgotIds).toContain('door')
    s = togglePin(s, 'door')
    expect(s.pinnedIds).not.toContain('door')
    expect(s.forgotIds).toContain('door')
  })

  it('persists to localStorage', () => {
    let s = loadProgress()
    s = togglePin(s, 'bag')
    saveProgress(s)
    const again = loadProgress()
    expect(again.pinnedIds).toContain('bag')
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npm test -- src/lib/storage.test.ts
```

- [ ] **Step 3: Implement `src/lib/storage.ts`**

```ts
const KEY = 'name-everything/progress/v1'

export type ProgressState = {
  forgotIds: string[]
  pinnedIds: string[]
  gotItToday: Record<string, string[]>
  streaks: { lastActiveDate: string | null; count: number }
  settings: { expandWord: boolean; expandZh: boolean }
}

export function todayKey(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function defaultProgress(): ProgressState {
  return {
    forgotIds: [],
    pinnedIds: [],
    gotItToday: {},
    streaks: { lastActiveDate: null, count: 0 },
    settings: { expandWord: false, expandZh: false },
  }
}

export function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultProgress()
    return { ...defaultProgress(), ...JSON.parse(raw) }
  } catch {
    return defaultProgress()
  }
}

export function saveProgress(state: ProgressState): void {
  localStorage.setItem(KEY, JSON.stringify(state))
}

function uniq(ids: string[]): string[] {
  return [...new Set(ids)]
}

export function markForgot(state: ProgressState, cardId: string): ProgressState {
  return {
    ...state,
    forgotIds: uniq([...state.forgotIds, cardId]),
  }
}

export function togglePin(state: ProgressState, cardId: string): ProgressState {
  const has = state.pinnedIds.includes(cardId)
  return {
    ...state,
    pinnedIds: has
      ? state.pinnedIds.filter((id) => id !== cardId)
      : uniq([...state.pinnedIds, cardId]),
  }
}

export function markGotIt(
  state: ProgressState,
  cardId: string,
  today: string,
): ProgressState {
  const dayList = uniq([...(state.gotItToday[today] ?? []), cardId])
  let streaks = { ...state.streaks }
  if (streaks.lastActiveDate !== today) {
    const yesterday = new Date(`${today}T12:00:00`)
    yesterday.setDate(yesterday.getDate() - 1)
    const yKey = todayKey(yesterday)
    streaks = {
      lastActiveDate: today,
      count: streaks.lastActiveDate === yKey ? streaks.count + 1 : 1,
    }
  }
  return {
    ...state,
    forgotIds: state.forgotIds.filter((id) => id !== cardId),
    gotItToday: { ...state.gotItToday, [today]: dayList },
    streaks,
  }
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
npm test -- src/lib/storage.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/storage.ts src/lib/storage.test.ts
git commit -m "feat: local progress storage for got it, forgot, and pins"
```

---

### Task 4: Deck picker (30% forgot cap + tag rotation)

**Files:**
- Create: `src/lib/deck.ts`
- Create: `src/lib/deck.test.ts`

**Interfaces:**
- Consumes: `Card`, `ProgressState`, `todayKey`
- Produces: `export function pickNextCard(cards: Card[], progress: ProgressState, recentTag: string | null, rng?: () => number): { card: Card; recentTag: string } | null`

Rules from spec:
1. Up to ~30% of picks may come from `forgotIds` when available (implement as: with probability 0.3 if forgot pool non-empty, else curated).
2. Prefer cards whose primary tag ≠ `recentTag` when possible.
3. Deprioritize ids in `gotItToday[today]` (only use if nothing else left).

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect } from 'vitest'
import { pickNextCard } from './deck'
import type { Card } from '../types/card'
import { defaultProgress, markForgot, markGotIt, todayKey } from './storage'

const cards: Card[] = [
  { id: 'a', word: 'a', sentence: 'A.', image: '/images/cards/a.jpg', imageSource: 'curated', tags: ['home'], tier: 'T1' },
  { id: 'b', word: 'b', sentence: 'B.', image: '/images/cards/b.jpg', imageSource: 'curated', tags: ['street'], tier: 'T1' },
  { id: 'c', word: 'c', sentence: 'C.', image: '/images/cards/c.jpg', imageSource: 'curated', tags: ['food'], tier: 'T1' },
]

describe('pickNextCard', () => {
  it('returns null for empty catalog', () => {
    expect(pickNextCard([], defaultProgress(), null)).toBeNull()
  })

  it('can force-pick from forgot when rng says so', () => {
    let p = markForgot(defaultProgress(), 'b')
    const result = pickNextCard(cards, p, null, () => 0.1)
    expect(result?.card.id).toBe('b')
  })

  it('avoids same tag as recent when alternatives exist', () => {
    const result = pickNextCard(cards, defaultProgress(), 'home', () => 0.9)
    expect(result?.card.tags[0]).not.toBe('home')
  })

  it('falls back to got-it cards only when needed', () => {
    let p = defaultProgress()
    const t = todayKey()
    p = markGotIt(p, 'a', t)
    p = markGotIt(p, 'b', t)
    p = markGotIt(p, 'c', t)
    const result = pickNextCard(cards, p, null, () => 0.9)
    expect(result).not.toBeNull()
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npm test -- src/lib/deck.test.ts
```

- [ ] **Step 3: Implement `src/lib/deck.ts`**

```ts
import type { Card } from '../types/card'
import { todayKey, type ProgressState } from './storage'

function primaryTag(card: Card): string {
  return card.tags[0] ?? ''
}

export function pickNextCard(
  cards: Card[],
  progress: ProgressState,
  recentTag: string | null,
  rng: () => number = Math.random,
): { card: Card; recentTag: string } | null {
  if (cards.length === 0) return null
  const today = todayKey()
  const got = new Set(progress.gotItToday[today] ?? [])
  const forgotSet = new Set(progress.forgotIds)

  const byId = new Map(cards.map((c) => [c.id, c]))
  const forgotCards = progress.forgotIds
    .map((id) => byId.get(id))
    .filter((c): c is Card => Boolean(c))

  const fresh = cards.filter((c) => !got.has(c.id) && !forgotSet.has(c.id))
  const gotCards = cards.filter((c) => got.has(c.id))

  let pool: Card[] = []
  if (forgotCards.length && rng() < 0.3) {
    pool = forgotCards
  } else if (fresh.length) {
    pool = fresh
  } else if (forgotCards.length) {
    pool = forgotCards
  } else {
    pool = gotCards.length ? gotCards : cards
  }

  const rotated = recentTag
    ? pool.filter((c) => primaryTag(c) !== recentTag)
    : pool
  const finalPool = rotated.length ? rotated : pool
  const card = finalPool[Math.floor(rng() * finalPool.length)]
  return { card, recentTag: primaryTag(card) }
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
npm test -- src/lib/deck.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/deck.ts src/lib/deck.test.ts
git commit -m "feat: deck picker with forgot cap and tag rotation"
```

---

### Task 5: FoldRow + PracticeCard UI

**Files:**
- Create: `src/components/FoldRow.tsx`
- Create: `src/components/PracticeCard.tsx`
- Create: `src/components/PracticeCard.test.tsx`

**Interfaces:**
- Consumes: `Card`, progress flags `pinned`, settings expand defaults
- Produces: React components; callbacks `onGotIt`, `onForgot`, `onTogglePin`

- [ ] **Step 1: Write failing component test**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PracticeCard } from './PracticeCard'
import type { Card } from '../types/card'

const card: Card = {
  id: 'cup',
  word: 'cup',
  sentence: 'This is a cup.',
  image: '/images/cards/cup.svg',
  imageSource: 'curated',
  zh: '杯子',
  tags: ['home'],
  tier: 'T1',
}

describe('PracticeCard', () => {
  it('shows sentence but hides word and zh by default', () => {
    render(
      <PracticeCard
        card={card}
        pinned={false}
        expandWordDefault={false}
        expandZhDefault={false}
        onGotIt={() => {}}
        onForgot={() => {}}
        onTogglePin={() => {}}
      />,
    )
    expect(screen.getByText('This is a cup.')).toBeInTheDocument()
    expect(screen.queryByText('cup')).not.toBeInTheDocument()
    expect(screen.queryByText('杯子')).not.toBeInTheDocument()
  })

  it('fires Got it / Forgot / pin callbacks', async () => {
    const user = userEvent.setup()
    const onGotIt = vi.fn()
    const onForgot = vi.fn()
    const onTogglePin = vi.fn()
    render(
      <PracticeCard
        card={card}
        pinned={false}
        expandWordDefault={false}
        expandZhDefault={false}
        onGotIt={onGotIt}
        onForgot={onForgot}
        onTogglePin={onTogglePin}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Got it' }))
    await user.click(screen.getByRole('button', { name: 'Forgot' }))
    await user.click(screen.getByRole('button', { name: '记录' }))
    expect(onGotIt).toHaveBeenCalled()
    expect(onForgot).toHaveBeenCalled()
    expect(onTogglePin).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npm test -- src/components/PracticeCard.test.tsx
```

- [ ] **Step 3: Implement components**

`FoldRow.tsx` — button that toggles revealing children; collapsed label like `Word` / `中文`.

`PracticeCard.tsx` — layout:
- image (`aspect-[4/3] object-cover w-full rounded-lg`); `src={card.image}` (CDN URL); `onError` swap to `/images/cards/fallback.svg`
- sentence (text-xl)
- FoldRow for word, FoldRow for zh (if present)
- optional small play buttons later (Task 8)
- bottom actions row: Forgot (outline), 记录 (outline; if pinned label `已记录`), Got it (filled `bg-accent text-white`)

Keep UI minimal and mobile padded (`px-4 pb-28` reserved for tab bar).

- [ ] **Step 4: Run — expect PASS**

```bash
npm test -- src/components/PracticeCard.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add src/components
git commit -m "feat: practice card with folded word/zh and three actions"
```

---

### Task 6: App shell — routes, BottomNav, PracticePage

**Files:**
- Create: `src/components/BottomNav.tsx`
- Create: `src/hooks/useProgress.ts`
- Create: `src/pages/PracticePage.tsx`
- Modify: `src/App.tsx`, `src/main.tsx`
- Modify: `index.html` (title, viewport)

**Interfaces:**
- Consumes: `loadCards`, `pickNextCard`, storage helpers
- Produces: routes `/` (练习), `/review`, `/me`

- [ ] **Step 1: Implement `useProgress`**

```ts
import { useCallback, useEffect, useState } from 'react'
import {
  loadProgress,
  saveProgress,
  type ProgressState,
} from '../lib/storage'

export function useProgress() {
  const [progress, setProgress] = useState<ProgressState>(() => loadProgress())

  useEffect(() => {
    saveProgress(progress)
  }, [progress])

  const update = useCallback((fn: (p: ProgressState) => ProgressState) => {
    setProgress((p) => fn(p))
  }, [])

  return { progress, update }
}
```

- [ ] **Step 2: Implement BottomNav + pages wiring**

`BottomNav`: three `NavLink`s — 练习 `/`, 复习 `/review`, 我的 `/me`.

`PracticePage`:
- show today's got-it count
- hold `current` card + `recentTag` in state
- `advance()` calls `pickNextCard(loadCards(), progress, recentTag)`
- wire PracticeCard callbacks to `markGotIt` / `markForgot` / `togglePin` then `advance()` (pin toggles without forcing advance — stay on card until Got it/Forgot, OR advance on all three; **choose: Got it & Forgot advance; 记录 toggles pin and stays**)

- [ ] **Step 3: Manual check**

```bash
npm run dev
```

On phone width: open `/`, see card, fold rows, three buttons, tab bar.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/main.tsx src/pages/PracticePage.tsx src/components/BottomNav.tsx src/hooks/useProgress.ts index.html
git commit -m "feat: app shell with practice loop and bottom navigation"
```

---

### Task 7: Review page

**Files:**
- Create: `src/pages/ReviewPage.tsx`

**Interfaces:**
- Consumes: `progress.forgotIds`, `progress.pinnedIds`, `loadCards`, PracticeCard actions
- Produces: tabs `Forgot` | `记录`; empty states; detail = same PracticeCard

- [ ] **Step 1: Implement ReviewPage**

- Segmented control: Forgot / 记录  
- List rows: thumbnail + sentence snippet  
- Tap → full PracticeCard overlay or inline  
- Empty Forgot: 「暂时没有 Forgot，去练习里诚实点一下吧」  
- Empty 记录: 「点「记录」钉住想复习的卡片」  
- Got it on a forgot card removes from list (via existing `markGotIt`)

- [ ] **Step 2: Manual check** — Forgot a card in 练习, see it under 复习 → Forgot; pin appears under 记录.

- [ ] **Step 3: Commit**

```bash
git add src/pages/ReviewPage.tsx
git commit -m "feat: review lists for forgot and pinned cards"
```

---

### Task 8: Me page + CDN audio + TTS fallback

**Files:**
- Create: `src/pages/MePage.tsx`
- Create: `src/lib/tts.ts`
- Create: `src/lib/playAudio.ts`
- Modify: `src/components/PracticeCard.tsx` (speak buttons)
- Modify: `src/lib/storage.ts` if settings setters needed (`setSettings`)

**Interfaces:**
- Produces:
  - `speak(text: string): void` using `window.speechSynthesis`
  - `playCardAudio(url: string | undefined, fallbackText: string): void` — `new Audio(url).play()` when url is http(s); on error or missing url, call `speak(fallbackText)`
- Me page shows: today count, streak count, toggles `expandWord` / `expandZh`

- [ ] **Step 1: Implement play helpers**

```ts
export function speak(text: string): void {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'en-US'
  window.speechSynthesis.speak(u)
}
```

```ts
import { speak } from './tts'

let current: HTMLAudioElement | null = null

export function playCardAudio(url: string | undefined, fallbackText: string): void {
  if (current) {
    current.pause()
    current = null
  }
  if (url && /^https?:\/\//.test(url)) {
    const audio = new Audio(url)
    current = audio
    audio.play().catch(() => speak(fallbackText))
    return
  }
  speak(fallbackText)
}
```

Add small speaker buttons on PracticeCard: sentence always (`playCardAudio(card.sentenceAudio, card.sentence)`); word when expanded (`playCardAudio(card.wordAudio, card.word)`).

- [ ] **Step 2: Implement MePage**

- 今日已练：`gotItToday[today].length`  
- 连续天数：`streaks.count`  
- Switches writing into `progress.settings` via `update`

PracticeCard must read `expandWordDefault={progress.settings.expandWord}` etc.

- [ ] **Step 3: Manual check** — toggle expand defaults; sentence speaker plays CDN audio on Chrome/Android; kill network and confirm TTS fallback.

- [ ] **Step 4: Commit**

```bash
git add src/pages/MePage.tsx src/lib/tts.ts src/lib/playAudio.ts src/components/PracticeCard.tsx src/lib/storage.ts
git commit -m "feat: me page stats/settings and CDN audio with TTS fallback"
```

---

### Task 9: README + week-1 verification checklist

**Files:**
- Create/Modify: `README.md`

- [ ] **Step 1: Write README** with:
  - Product one-liner
  - `npm install` / `npm run dev` / `npm test` / `npm run build`
  - Link to spec path (sibling repo note)
  - Week-1 out of scope list
  - How to regenerate cards: `node scripts/build-t1-pack.mjs` (requires sibling `my_app` cet4-all)
  - Disclaimer: images/audio hotlink 百词斩 CDN for local validation only; replace before any public/store release (same stance as `my_app` README)

- [ ] **Step 2: Full verification**

```bash
npm test
npm run build
npm run dev
```

Checklist:
- [ ] 练习 shows image + original sentence; word/zh hidden until expand
- [ ] Sentence speaker plays CDN audio (TTS if CDN fails)
- [ ] Got it / Forgot / 记录 behave per spec
- [ ] 复习 lists update
- [ ] 我的 shows counts; settings affect defaults
- [ ] Mobile viewport usable

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: README and week-1 verification notes"
```

---

## Spec coverage self-check

| Spec item | Task |
|-----------|------|
| New React web app, not old repos | Task 1 |
| Card model + T1 pack from cet4-all + CDN media | Task 2 |
| Got it / Forgot / 记录 + local persist | Task 3 |
| Forgot ≤30% + tag rotate + got-it deprioritize | Task 4 |
| Image + sentence visible; word/zh folded | Task 5 |
| Tabs 练习/复习/我的 + practice loop | Task 6 |
| Review queues | Task 7 |
| Stats, expand settings, CDN audio + TTS fallback | Task 8 |
| No auth/AI/camera/SRS/Capacitor in must | omitted by design (Could later) |

## Out of this plan (explicit)

- AI long-tail generation, camera mode, Capacitor shell, listen & repeat, live 60s challenges, formal product naming/brand polish pass.
- Copying 百词斩 jpeg/mp3 binaries into the new repo; shipping this CDN pack to stores.
