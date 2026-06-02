# Changelog

All notable progress on the Anniversary Cards app. Newest first.

---

## 2026-06-02 — Vercel deploy, login fix & seed sync

### Vercel deployment (production)
- **Diagnosed** initial `404: NOT_FOUND` on Vercel — Git repo root is `anniversary-cards/` but the SvelteKit app lives in the nested `anniversary-cards/anniversary-cards/` folder. Fix: set **Root Directory** to `anniversary-cards` in Vercel project settings.
- **Diagnosed** runtime crash `ERR_INVALID_MODULE_SPECIFIER` with encoded Windows paths (`Website\Weding-card\…`) — caused by a local `.vercel/output/` build (Windows paths) that had been committed to Git. Vercel was serving stale prebuilt output instead of building on Linux.
- **Removed** `anniversary-cards/.vercel/` from Git tracking (~140 files).
- **Added** `.vercel/` to root `.gitignore` so local Vercel build output is never committed again.
- **Documented** required Vercel env vars for build + runtime: `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY` (and `SUPABASE_SERVICE_ROLE_KEY` for local seed only). Build fails at `$env/static/public` import if the two `PUBLIC_*` vars are missing.
- **Added** `.env.example` — template listing all three env var names for local dev and Vercel setup.

### Login form — inputs not accepting text
- **Fixed** email/password fields on `/login` appearing focused but not accepting keyboard input. Root cause: login panel used `class="card"`, which collided with the globally loaded Pokémon holo engine CSS (`static/css/cards/base.css`) — `.card { pointer-events: none; aspect-ratio: … }` was applied to the login box.
- **Renamed** login container class from `card` → `login-card` in `src/routes/login/+page.svelte`.
- **Added** `bind:value` on email and password inputs (reliable typing in Svelte 5).
- **Added** explicit `pointer-events: auto` and `user-select: text` on login inputs.
- **Updated** `src/routes/+layout.svelte` — hide top bar and bottom tab bar on `/login` (`isLogin` guard); full-height `login-main` wrapper so nav chrome doesn't overlap the form.

### Admin tab (ניהול) not visible after login
- **Diagnosed** missing **ניהול** nav tab for Netanel — `isAdmin` reads `profiles.role === 'admin'` from Supabase (`src/lib/stores/user.js`), not from auth email alone. If `001_schema.sql` was not run in the Supabase SQL Editor, the `profiles` table doesn't exist and the app falls back to a default `{ role: 'user' }` profile.
- **Setup reminder:** run `supabase/migrations/001_schema.sql` in Supabase SQL Editor, then `node supabase/seed.js`, then log out and back in.

### Seed script — sync existing users
- **Updated** `supabase/seed.js` — when a user already exists in auth (`already been registered`), the script no longer skips silently. It now finds the user via `auth.admin.listUsers`, updates `user_metadata`, and **upserts** the matching `profiles` row (name, role, avatar). Safe to re-run after migration to fix admin role for Netanel or refresh Almog's profile.

---

## 2026-06-02

### Phase B — Supabase backend + real auth

#### Auth & session
- **Added** `src/hooks.server.js` — Supabase SSR middleware: creates a server-side client on every request, exposes `locals.supabase` + `locals.safeGetSession()`, and redirects unauthenticated requests to `/login` (all routes except `/login` are guarded).
- **Added** `src/routes/login/+page.svelte` + `+page.server.js` — luxury-styled Hebrew login form (email + password); SvelteKit `enhance` for progressive enhancement; error handling in Hebrew; already-logged-in users are redirected to `/`.
- **Added** `src/routes/auth/logout/+server.js` — POST endpoint that calls `supabase.auth.signOut()` and redirects to `/login`.
- **Added** `src/routes/+layout.server.js` — loads `session`, `profile`, and `wallet` from Supabase on every navigation; passed down as `$page.data`.
- **Added** `src/routes/admin/+layout.server.js` — server-side admin guard: non-admin profiles are redirected to `/` before any admin page renders.
- **Replaced** the POC user-switcher popover in `+layout.svelte` with a logout button (POST to `/auth/logout`). The avatar + name still display from the real session profile.

#### Database schema (`supabase/migrations/001_schema.sql`)
- **Created** 6 tables with full RLS: `profiles`, `wallets`, `tasks`, `task_completions`, `cards`, `user_collection`.
- **Created** trigger `on_auth_user_created` → `handle_new_user()`: auto-inserts a profile row and a wallet (50 ♥ default) for every new Supabase auth user. Profile `name`, `role`, and `avatar` are read from `user_metadata` set at signup.
- **Created** RPC `add_to_collection(p_user_id, p_card_id, p_card_number)`: atomic upsert that inserts a new collection entry (count = 1) or increments `count` on conflict — prevents double-insert race conditions.
- **Created** `card-photos` public Storage bucket with policies: authenticated users can upload, anyone can read, admin can delete.

#### Seed script (`supabase/seed.js`)
- **Added** `node supabase/seed.js` — uses the service-role key to create Netanel (admin) and Almog (user) via `auth.admin.createUser` with `email_confirm: true` and `user_metadata` (name, role, avatar). The trigger auto-creates their profiles + wallets. Seeds 4 starter tasks. Safe to re-run.
- _(See also **2026-06-02 — Vercel deploy, login fix & seed sync** above for existing-user profile sync on re-run.)_

#### Stores — localStorage fully replaced
- **Rewrote** `src/lib/stores/user.js` — now a `derived` store over `$page.data.profile`; no localStorage, no hardcoded users. `isAdmin` derived from `profile.role`.
- **Rewrote** `src/lib/stores/wallet.js` — writable store initialised from `$page.data.wallet` (via `initWallet()` called reactively in `+layout.svelte`). `wallet.credit()` / `wallet.debit()` / `wallet.reset()` are now async and write to the `wallets` table; store updates locally on success for instant UI feedback. `freePacks.use()` async; daily reset logic unchanged (Israel UTC+3).
- **Rewrote** `src/lib/stores/tasks.js` — exports `loadTasks()` and `loadCompletions(userId)` for on-demand async fetching. `tasks.addTask()` / `updateTask()` / `deleteTask()` / `complete()` are all async and write to Supabase. Completion keys are consistent with the DB `period_key` column (`YYYY-MM-DD` for daily, `once` for special/secret). DB column `reward_type` normalised to camelCase `rewardType` in the store.
- **Rewrote** `src/lib/stores/collection.js` — exports `loadCollection(userId)`. `collection.addCard()` upserts the card in the `cards` pool (via `onConflict: card_number`) then calls the `add_to_collection` RPC. `removeCard()` and `reset()` delete from `user_collection`. Derived stores (`collectedCards`, `collectedCount`, `collectionYears`) unchanged in API.
- **Added** `src/lib/supabase.js` — browser-side `createBrowserClient` singleton (env vars `PUBLIC_SUPABASE_URL` + `PUBLIC_SUPABASE_ANON_KEY`).

#### Pages updated for async stores
- **Updated** `src/routes/tasks/+page.svelte` — `onMount` calls `loadTasks()` + `loadCompletions($user.id)`; `claim()` is now `async`, awaits `tasks.complete()`; loading state shown while fetching.
- **Updated** `src/routes/admin/tasks/+page.svelte` — `onMount` calls `loadTasks()`; `saveTask()`, `deleteTask()`, `toggleActive()` are all async; saving spinner on submit button.
- **Updated** `src/routes/album/+page.svelte` — `onMount` calls `loadCollection($user.id)`; `clearCollection()` async; loading state.
- **Updated** `src/routes/admin/card-editor/+page.svelte` — tracks `selectedFile` separately from the preview data URL; on save, uploads the file to Supabase Storage (`card-photos` bucket, path `cards/{number}_{timestamp}.ext`) and stores the public URL in `cards.photo_url`; falls back to the typed URL if no file was picked. `saveCard()` async with saving state on button.

#### Admin cleanup page (`/admin/cleanup`)
- **Added** full data-management screen at `/admin/cleanup` (linked from the admin hub).
- Per-user actions (shown for all profiles): **Reset wallet** (→ 50 ♥, clear daily free-pack counter), **Clear collection** (delete all `user_collection` rows), **Clear task completions** (delete all `task_completions` rows), **Full reset** (all three at once, with confirmation).
- Per-card actions: lists the entire `cards` pool; admin can **delete** any card (cascades to `user_collection` via FK).
- All actions show a Hebrew toast on success/error; buttons show a busy state while the Supabase call is in flight.

#### Infrastructure
- **Switched** `svelte.config.js` from `adapter-auto` to `@sveltejs/adapter-vercel`.
- **Added** `.env` with `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- **Added** `.env` to `.gitignore`.
- **Installed** `@supabase/ssr`, `@supabase/supabase-js`, `@sveltejs/adapter-vercel`.

---

## 2026-06-01

### Design: full purple purge — black / gold / silver only
- **Fixed** every purple / violet occurrence across the entire codebase after user feedback.
- `app.css` — background tokens `--bg-0…3` changed from purple-tinted blacks (`#050310 → #1a0e38`) to pure blacks (`#050505 → #1a1a1a`). `body::before` ambient gradient: removed the `rgba(176,107,255,…)` blob, now only subtle gold at top + silver at bottom on pure black. `--accent` repointed from `#b06bff` (purple) to `#c8c8d4` (silver). `--accent-dim/glow` updated to match. Text ink tokens (`--ink`, `--ink-mid`, `--ink-dim`, `--ink-faint`) changed from purple-tinted white to neutral warm white `#f0ece8`. `--tier-epic` changed from purple to silver/platinum `#e8e0d0`. Epic tier badge updated from purple to silver.
- `PackOpener.svelte` — epic flash changed from purple-white to silver-white; epic particles changed from purple to silver; "open another" button gradient changed from gold+purple to gold+silver.
- `CardFront.svelte` — empty slot background changed from `hsl(280 30%…)` (purple) to pure dark grey `#111111`; epic badge gradient changed from `#7c3aed/#db2777` (purple/pink) to silver.
- All routes (`+page.svelte`, `/album`, `/packs`, `/tasks`, `/admin/tasks`, `/pack-test`) — every `var(--accent)` reference for the "rare/epic" pack tier, daily task accent, epic tier colour, info toast, and filter tabs now resolves to silver or gold instead of purple.

### Full UI/UX rebuild — עשור של אהבה
- **App renamed** to **עשור של אהבה** (A Decade of Love).
- **Economy redesigned**: currency changed from "coins" to **♥ לבבות (hearts)**. 2 free packs per day (resets at midnight Israel time UTC+3). Pack costs: regular 10♥ · rare 15♥ · legendary 20♥. Secret tasks reward a **free pack** instead of hearts.
- **3 task types**: daily (reset every morning) · special (one-time) · secret (hidden veil, reveals on completion → free pack).
- **User store** (`src/lib/stores/user.js`) — POC persona switcher (Netanel = admin / Almog = user) via localStorage. Replaces real auth for Phase B.
- **Wallet store** (`src/lib/stores/wallet.js`) — hearts balance + daily free-pack counter with Israel midnight reset, all localStorage-backed.
- **Tasks store** (`src/lib/stores/tasks.js`) — task definitions + per-user completion tracking; 3 seed tasks included. Completions keyed by `taskId:userId:date` (daily) or `taskId:userId` (special/secret) to prevent double-claiming.
- **Design system (`app.css`)** — full luxury token system: pure black backgrounds, `--gold #f5c451`, `--silver #c8c8d4`, `--heart #e84d6b`, glassmorphism surfaces, button classes (`btn-gold`, `btn-glass`, `btn-heart`, `btn-ghost`), 8pt spacing grid, spring easing curves, all keyframes.
- **Layout (`+layout.svelte`)** — sticky gold top bar (brand "עשור של אהבה", hearts balance, free-pack count, user-switcher popover); **bottom tab bar** (Home / Packs / Album / Tasks / Admin) with SVG icons, active gold highlight, safe-area padding.
- **Home dashboard (`/`)** — anniversary hero with animated gold particles + pulsing ring + names in gold/silver; 10-year / days-together counter; 4-stat row (hearts, cards, free packs, daily task progress); pack-shop mini-cards; album progress bar; daily task quick-view.
- **Tasks page (`/tasks`)** — three sections (daily / special / secret) with per-type accent colours; secret tasks hidden behind a veil until claimed; claiming credits hearts and shows a tier-coloured toast; heart animation on claim.
- **Admin hub (`/admin`)** — landing page linking to task creator and card editor.
- **Admin task creator (`/admin/tasks`)** — full modular CRUD: type picker (daily/special/secret), description, hearts reward or free-pack reward, active toggle; live sortable task table; admin can add/edit/delete tasks without touching code.
- **Packs page (`/packs`)** — 3 pack-type selector cards (regular/rare/legendary) with costs, free-pack banner when available, select → open → `PackOpener` animation; sound toggle.
- **Anniversary screen (`/anniversary`)** — 60 animated gold/silver/heart particles, pulsing concentric rings, animated day-counter (counts up on load), "10" in large gold gradient text, milestone timeline (2016→2026), actions linking to album and packs, romantic quote.
- **Album (`/album`)** — added **🗑 נקה** clear-collection button for POC testing.

### Album: effects hidden on thumbnails + image persistence fix
- **Fixed** holographic shine/glare showing on album grid thumbnails (they should only show on inspect). Used `:global()` CSS to `display:none` `.card__shine` / `.card__glare` inside `.slot-card` and blocked the base.css non-interactive hover rule from leaking.
- **Fixed** `ERR_FILE_NOT_FOUND` when clicking a card in the album after page reload. Root cause: `URL.createObjectURL()` blob URLs are session-only — they die on reload. Added `toDataURL()` in `src/lib/utils.js` (canvas → base64 JPEG at ≤480px) and now convert any blob URL to a persistent data URL before saving to localStorage. Both the editor's "Save to Album" and the pack-test's `onPackDone` await this conversion.

### Album v1 — slot-based binder
- **Added** `src/lib/stores/collection.js` — localStorage-backed collection store (POC; Supabase in Phase B). Stores card entries keyed by slot number 1–100 with `count` for duplicates. Derived stores: `collectedCards`, `collectedCount`, `collectionYears`.
- **Added** `/album` route — 100 numbered slots in a fluid grid (`auto-fill minmax(130px,1fr)`):
  - **Empty slots**: dark glass card with a diamond placeholder and slot number.
  - **Filled slots**: card thumbnail (no effects), rarity badge, duplicate count (×N). Hover lifts with gold glow.
  - **Click → modal**: full interactive holographic card with `showcase={true}` auto-shimmer + tilt/zoom. Click outside or press Esc to close.
  - **Year tabs**: dynamically generated from collected cards' years; filters the grid.
  - **Rarity filter**: הכל / אגדי / אפי / נדיר / רגיל chips.
  - **Progress bar**: animated `X / 100` fill.
- **Added** card editor fields: **Card Number (1–100)** and **Year** (side-by-side), plus a **"Save to Album"** primary button.
- **Added** pack-test → album wiring: when all 5 cards are swiped (`done` event), each is auto-saved to the collection. Pack-test deck updated with `cardNumber` + `year` per slot.
- **Updated** nav to include "האלבום" link.

### Sound: real card-slide MP3
- **Changed** `playFlip()` to use the real `assets/oxidvideos-taking-playing-card-2-522516.mp3` asset (copied to `static/sounds/card-slide.mp3`, 16KB). Decoded once into an `AudioBuffer` and re-triggered per flip. Synthesized fallback while the buffer loads.

### Album: grid z-index fix (zoomed card overlap)
- **Fixed** zoomed card overlapping neighbours in the 3+2 grid. CSS `:has()` couldn't reach across Svelte component scope (different hash per file). Switched to reading the `activeCard` store directly and driving z-index via `bind:this` + `el.contains($activeCard)` — DOM traversal bypasses all scoping.

### Pack-opening v3 — stage-level drag (swipe finally works)
- **Fixed** swipe completely broken: holo card layers (3D `preserve-3d` + `backface-visibility`) were winning every pointer hit-test regardless of any overlay approach. Switched to handling all drag events on the **whole stage** with cards set to `pointer-events: none` — a press anywhere drags the top card.

### Auto-shimmer on reveal cards (mobile effect fix)
- **Fixed** no card effects visible in the reveal phase on mobile (or any touch device). Added `showcase="quick"` prop path: `PackOpener → CardFront → Card.svelte`. The `showcase="quick"` mode starts the circular holo shimmer animation 400ms after card mount (vs the original 2s), so it kicks in right after the flip-up. Works without any pointer movement.

### Pack-opening v2 & v3 — tactile redesign
- **Changed** open gesture to **drag-to-tear**: pointer drag tracks the pack top in real-time (follows `--p` CSS variable), completes past 50% threshold, snaps back if released early.
- **Changed** reveal flow: **one stacked card** in focus at a time (up to 360px / 82vw); swipe in any direction → card flings off-screen in the drag direction and vanishes; next card flips up.
- **Changed** final layout: **3 + 2 responsive flex grid** appears only after all 5 are swiped (staggered `popIn`), no overlap → no holo bleed.
- **Fixed** mix-blend-mode "effects going crazy": old overlapping fan had neighbouring card shine layers bleeding together; the spaced grid isolates each card.

---

## 2026-05-31

### Pack-opening simulator — initial prototype
- **Added** `PackOpener.svelte` — 3D pack-opening experience: floating pack → drag-to-tear → flash/rays/particles → stacked card reveal with swipe → 3+2 grid.
- **Added** `sound.js` — synthesized Web Audio cues (tear / flip / tier-scaled reveal chime), mutable.
- **Added** `/pack-test` route — test harness with per-slot effect + tier pickers, photo override, randomize, sound toggle, restart.
- **Added** sticky RTL top nav in `+layout.svelte`.
- **Added** docs: `PROJECT.md` and this `CHANGELOG.md`.
- **Copied** `assets/pack-image.png` → `static/pack-image.png` (used as pack and temporary card back).

### Text & photo sharpness fixes
- **Fixed** blurry template text: forced flat layer (`backface-visibility:visible`, font-smoothing), replaced hazy 14px shadow with crisp tight shadow.
- **Fixed** blurry photos on hi-DPI: globally removed `backface-visibility:hidden` + `translate3d` layer promotion from card faces so they rasterize at full device pixel ratio.
- **Fixed** blur on zoom (popover): drop `will-change` while `.active` so re-rasterization happens at the enlarged size.

### Full-art effects override
- **Added** `static/css/cards/_fullart.css` (loaded last): removed the Pokémon art-window `clip-path` from **holo**, **reverse holo**, and **cosmos** effects so they cover the whole card.

### Phase A — effects engine + card editor (initial build)
- **Scaffolded** SvelteKit app with Hebrew RTL shell, Heebo + Frank Ruhl Libre fonts, dark romantic theme.
- **Ported** holographic engine from `pokemon-cards-css`: `Card.svelte` (removed gtag, SSR-guarded, CDN dropped, effect prop, slotted front), stores, helpers.
- **Added** `effects.js` — maps ~22 effect ids → CSS `data-*` attributes (verified against real selectors).
- **Added** `CardFront.svelte` — photo + template overlay (title/date/description/rarity badge), flat mode.
- **Added** card editor at `/`: upload, fields, effect picker, live preview, all-effects gallery.
- **Verified** clean SSR + production build; all assets serve; correct DOM layer order.
