# Anniversary Cards — Project Overview

A romantic 10th-wedding-anniversary gift: a Pokémon-style **holographic card pack-opening** web app for two people (the husband, an admin, and his wife). Real photos become holographic cards bearing a date + short description. You earn coins by completing admin-defined tasks, spend them to open packs of 5 cards, and collect cards in a filterable album.

The visual engine is ported from [`pokemon-cards-css`](../../pokemon-cards-css) (Svelte + CSS, GPLv3 © Simon Goellner / @simeydotme).

> **Language:** the app UI is **Hebrew, fully RTL**. Code/docs are in English.

---

## Stack & key decisions

| Area | Choice |
|---|---|
| Framework | SvelteKit (Svelte 5, legacy syntax for the ported engine) |
| Hosting | Vercel (adapter switch in Phase B) |
| Backend | Supabase — Auth, Postgres, Storage (free tier, 2 users) — _not wired yet_ |
| Collections | **Separate** album + coin wallet per user |
| Coins | Admin defines tasks; both users self-mark completion (honor system) |
| Effects | All ~22 effects available; admin picks per card; rendered **full-art** (no per-card mask) |
| Card design | In-app template (photo + date + description + rarity) **or** a flat pre-designed import (e.g. cardconjurer) |
| Build order | **Editor + effects first**, then pack-opening feel, then backend & app assembly |

Full design doc: `C:\Users\netam\.claude\plans\glimmering-roaming-parasol.md`

---

## ✅ Implemented so far

### Effects engine (ported)
- `src/lib/components/Card.svelte` — ported from pokemon-cards-css: removed gtag, SSR-guarded `document`/`window`, dropped the pokemontcg CDN coupling, added an `effect` prop, and replaced the hard-coded front `<img>` with a `<slot>` so a custom face composes **under** the shine/glare.
- `src/lib/stores/{activeCard,orientation}.js`, `src/lib/helpers/Math.js` — ported; orientation has an SSR guard + `enableGyroscope()` for the iOS permission gesture.
- `src/lib/effects.js` — maps our ~22 friendly effect ids → the `data-rarity/subtypes/supertype/trainer-gallery/set/number` attributes the stylesheets key off. Verified against the actual CSS selectors. Includes default rarity tiers + Hebrew labels.
- `static/css/**` + `static/img/**` — the engine stylesheets and textures, linked globally in `src/app.html`.
- `static/css/cards/_fullart.css` — **app override** (loaded last): removes the Pokémon "art-window" clip from holo/cosmos/reverse so effects cover the whole card; and fixes hi-DPI/zoom blur (backface-visibility + `will-change` on zoom).

### Card compositor
- `src/lib/components/CardFront.svelte` — composes photo + romantic template overlay (title, date, description, rarity badge) and feeds it into `<Card>`'s slot. Supports **flat mode** (skip template for pre-designed imports). RTL, container-query text sizing, crisp-text treatment.

### Editor (Phase A)
- `src/routes/+page.svelte` — upload a photo, fill title/date/description, pick rarity tier, pick any effect, live preview, and an "all effects" comparison gallery. Toggle template vs flat.

### Pack-opening simulator (feel prototype)
- `src/lib/components/PackOpener.svelte` — 3D experience: floating pack with pointer parallax → anticipation shake + glow → top **peels/tears** with a golden flash, light rays, and gold particle burst → 5 cards rise from the pack mouth, **spread into a fan**, and **flip face-up sequentially** with tier-based flair (color flash + particle count scales with rarity) → interactive fan (each card is a live holo card you can tilt/zoom). "Open another" replays.
- `src/lib/sound.js` — tiny synthesized Web Audio cues (tear / flip / reveal-chime that scales with tier), mutable. No audio files.
- `src/routes/pack-test/+page.svelte` — standalone test route with controls (per-slot effect + tier, photo override for all cards, randomize, sound toggle, restart).

### Shell
- `src/routes/+layout.svelte` — sticky RTL nav (Editor / Pack opening), global romantic dark theme (`src/app.css`), Heebo + Frank Ruhl Libre fonts.

---

## 🚧 To implement (roadmap)

### Phase B — Backend & auth (Supabase)
- Switch to `@sveltejs/adapter-vercel`.
- Supabase project; `@supabase/ssr`; `hooks.server.js` request-scoped client; `locals.session/user/profile`.
- Email+password login for 2 known users; admin role flag; route guards (`/admin/**`).
- Postgres schema + RLS: `profiles, cards, packs, wallets, coin_transactions, tasks, task_completions, pack_openings, user_collection`. Auto-create profile+wallet trigger.
- Image upload pipeline: in-browser compression (~1200px WebP) + crop to 0.718, upload to a **private** Storage bucket, signed URLs.
- Wire the editor's save → real `cards` rows; pool list with weight/active toggles.

### Phase C — Economy & packs
- Wallet UI; tasks CRUD (admin); self-mark + `claim_task` RPC (period_key dedupe).
- ✅ **Weighted pull (client-side):** 3 card types (common/rare/legendary) set explicitly in the editor (decoupled from effect); per-pack `odds` in `src/lib/packs.js`; `src/lib/packDraw.js` rolls a type per slot and draws a real card from the pool (weighted by `cards.weight`), with a sparse-pool fallback; opened cards granted to the album via `collection.grantMany` → `add_to_collection`. _(2-user honor-system POC — see below for the hardened version.)_
- Pack config (admin): price, cards-per-pack, rarity odds, premium guaranteed-rare.
- `open_pack` RPC (SECURITY DEFINER, atomic): lock wallet → weighted roll by tier + card `weight` → guarantee → deduct coins → grant to opener's collection → audit. Called from a SvelteKit action; feed results into `PackOpener`. _(Hardens the current client-side draw.)_

### Phase D — Album / binder
- `user_collection` grid with a lightweight non-interactive `CardThumb`.
- Filters: rarity tier / effect / year / tag / owned + duplicates count.
- Single-card focus view reusing the interactive `Card`.

### Phase E — Reveal integration
- Connect `PackOpener` to real opened cards; "new!" badges; duplicates handling.

### Phase F — Polish
- Real card-back art; haptics; iOS gyro permission button; skeletons/transitions; refine sounds (or real assets); GPLv3 attribution/About page; `prefers-reduced-motion` paths; performance pass on mobile blend-modes.

---

## Run it

```bash
cd anniversary-cards
npm install
npm run dev        # http://localhost:5173 (or next free port)
```

- `/` — card editor
- `/pack-test` — pack-opening simulator

## Open questions / to confirm with the user
- Final card template design (frame style, fields, fonts) — iterating in the editor.
- Which effects make the cut (all ~22, or a curated subset).
- Pack types, prices, and rarity odds.
- Whether to use synthesized sounds or commissioned/real sound assets.
- Real card-back artwork (currently the pack image doubles as the back).
