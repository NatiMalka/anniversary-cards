<script>
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { get }                from 'svelte/store';
  import { goto }              from '$app/navigation';
  import { base }              from '$app/paths';
  import { user }              from '$lib/stores/user.js';
  import { wallet, freePacks } from '$lib/stores/wallet.js';
  import { collection, loadCollection } from '$lib/stores/collection.js';
  import { pool, loadPool }             from '$lib/stores/cardPool.js';
  import ThreePack             from './ThreePack.svelte';
  import PackOpener            from './PackOpener.svelte';
  import AlbumReveal           from './AlbumReveal.svelte';
  import { drawPack }          from '$lib/packDraw.js';

  /**
   * pack: { id, label, cost, color, tiers }
   */
  export let pack;
  export let sound = true;

  const PACK_IMG_POSITION = { regular: '0% 50%', rare: '50% 50%', legendary: '100% 50%' };
  $: packImagePosition = PACK_IMG_POSITION[pack.id] ?? '50% 50%';

  const dispatch = createEventDispatcher();

  let phase = 'focus'; // 'focus' | 'opening' | 'reveal'
  let openCards = [];
  let revealNewCards = [];
  let revealSourceRects = [];
  let error = '';

  $: free      = freePacks.remaining($user.id);
  $: hearts    = wallet.balance($user.id);
  $: canAfford = free > 0 || hearts >= pack.cost;

  onMount(() => {
    loadPool();
    if ($user.id) loadCollection($user.id);
  });

  function buildCards() {
    const col = get(collection);
    return drawPack(get(pool), pack.odds, 5).map(c => ({
      ...c,
      isNew: c.cardNumber != null && !col[String(c.cardNumber)]
    }));
  }

  function preloadImages(cards) {
    for (const c of cards) {
      if (c.photo && !c.photo.startsWith('/')) new Image().src = c.photo;
    }
  }

  function openPack() {
    error = '';
    const usedFree = freePacks.use($user.id);
    if (!usedFree) {
      const ok = wallet.debit($user.id, pack.cost);
      if (!ok) { error = `לא מספיק ♥ לבבות (נדרש: ${pack.cost})`; return; }
    }
    openCards = buildCards();
    preloadImages(openCards); // kick off image fetches before the tear animation starts
    phase = 'opening';
  }

  // grant now happens on "המשך" (onContinue), so cards persist even if the reveal is interrupted.
  function onDone() {}

  // If client-side navigation really happens, THIS overlay (inside /packs)
  // unmounts — so `destroyed` is our reliable signal that goto worked.
  let destroyed = false;
  onDestroy(() => { destroyed = true; });

  // Navigate home. Prefer instant client-side navigation (goto); if the overlay
  // hasn't unmounted shortly after (goto didn't actually transition), force a
  // hard navigation so we never get stuck. goto is fired un-awaited (can't hang).
  function goHome() {
    const home = `${base}/`;
    goto(home).catch(() => {});
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        if (!destroyed) window.location.assign(home);
      }, 400);
    }
  }

  // Self-resetting guard so it can NEVER get stuck (Svelte preserves component
  // state across HMR, and this overlay lives across multiple pack opens).
  let continuing = false;
  async function onContinue(e) {
    if (continuing) return;
    continuing = true;
    const newCards    = e.detail?.newCards ?? [];
    revealNewCards    = newCards;
    revealSourceRects = e.detail?.sourceRects ?? [];
    try {
      if (newCards.length === 0) {
        // nothing to reveal — persist the duplicates in the background, go home now
        collection.grantMany(openCards, $user.id);
        goHome();
      } else {
        // reveal needs the cards in the store first (so they render in their slots)
        await collection.grantMany(openCards, $user.id);
        phase = 'reveal';
      }
    } finally {
      continuing = false;
    }
  }

  function close()      { dispatch('close'); }
  function onReset()    { phase = 'focus'; }
  function handleKey(e) { if (e.key === 'Escape') close(); }
</script>

<svelte:window on:keydown={handleKey} />

<div class="overlay" role="dialog" aria-modal="true" aria-label="פתיחת חבילה">

  <!-- backdrop always visible -->
  <div class="backdrop" on:click|self={close} aria-hidden="true"></div>

  {#if phase === 'focus'}
    <!-- ── Focus panel ─────────────────────────────────────────── -->
    <div class="panel focus-panel">

      <button class="close-btn" on:click={close} aria-label="סגור">✕</button>

      <!-- 3D pack showcase -->
      <div class="showcase-wrap" style="--pack-glow:{pack.glow ?? 'rgba(245,196,81,0.35)'};">
        <ThreePack packType={pack.id} showcase={true} />
        <div class="showcase-ring" aria-hidden="true"></div>
      </div>

      <!-- pack info -->
      <div class="pack-info">
        <span class="pack-label" style="color:{pack.color}">{pack.label}</span>

        <span class="cost-badge">
          <svg viewBox="0 0 24 24" fill="currentColor" width="11" height="11" aria-hidden="true">
            <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/>
          </svg>
          {#if free > 0}
            <span class="free-tag">חינם 🎁</span>
            <span class="free-left">({free} נשארו)</span>
          {:else}
            {pack.cost}
            <span class="balance-dim">/ {hearts} יתרה</span>
          {/if}
        </span>
      </div>

      {#if error}
        <p class="error-msg" role="alert">{error}</p>
      {/if}

      <button
        class="btn btn-gold btn-lg open-btn"
        disabled={!canAfford}
        on:click={openPack}
        aria-label="פתחי חבילה {pack.label}"
      >
        ✨ פתחי {pack.label}
      </button>

      {#if !canAfford}
        <p class="cant-text">לא מספיק ♥ לבבות</p>
      {/if}

    </div>

  {:else if phase === 'opening'}
    <!-- ── Pack opener (full-width inside overlay) ─────────────── -->
    <div class="panel opening-panel">
      <button class="btn btn-ghost btn-sm back-floating" on:click={onReset}>← חזרה</button>
      <PackOpener cards={openCards} {sound} packImage="/pack-images.png" {packImagePosition} on:done={onDone} on:reset={onReset} on:continue={onContinue} />
    </div>

  {:else if phase === 'reveal'}
    <!-- ── Album reveal (cards slide into their slots) ──────────── -->
    <AlbumReveal newCards={revealNewCards} sourceRects={revealSourceRects} {sound} on:done={goHome} />
  {/if}

</div>

<style>
  /* ── Overlay shell ──────────────────────────────────────────── */
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: overlayIn 0.22s ease both;
  }

  @keyframes overlayIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.9);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
  }

  /* ── Panel base ─────────────────────────────────────────────── */
  .panel {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow-y: auto;
  }

  /* Focus panel — compact card */
  .focus-panel {
    gap: var(--sp-4);
    padding: var(--sp-8) var(--sp-6) var(--sp-6);
    width: min(380px, 94vw);
    max-height: 92vh;
    animation: panelIn 0.3s var(--ease-out) both;
  }

  @keyframes panelIn {
    from { transform: scale(0.86) translateY(28px); opacity: 0; }
    to   { transform: scale(1)    translateY(0);    opacity: 1; }
  }

  /* Opening panel — wider for pack opener */
  .opening-panel {
    gap: 0;
    padding: var(--sp-4) var(--sp-2) var(--sp-2);
    width: min(560px, 98vw);
    max-height: 98vh;
    animation: panelIn 0.25s var(--ease-out) both;
  }

  /* ── Close button ───────────────────────────────────────────── */
  .close-btn {
    position: absolute;
    top: var(--sp-3);
    left: var(--sp-3);
    width: 34px; height: 34px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.06);
    color: var(--ink-dim);
    font-size: 0.8rem;
    cursor: pointer;
    transition: background 0.18s, color 0.18s;
    z-index: 2;
  }
  .close-btn:hover { background: rgba(255,255,255,0.13); color: var(--ink); }

  /* ── 3D showcase ────────────────────────────────────────────── */
  .showcase-wrap {
    position: relative;
    width: min(240px, 66vw);
    aspect-ratio: 0.706;
    border-radius: 14px;
    overflow: hidden;
    box-shadow:
      0 28px 90px rgba(0,0,0,0.85),
      0 0  50px var(--pack-glow, rgba(245,196,81,0.3));
  }

  .showcase-ring {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.14);
    pointer-events: none;
  }

  /* ── Pack info ──────────────────────────────────────────────── */
  .pack-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--sp-2);
    text-align: center;
  }

  .pack-label {
    font-family: 'Frank Ruhl Libre', serif;
    font-size: var(--text-2xl);
    font-weight: 700;
    line-height: 1.2;
  }

  .cost-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.4em;
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--heart);
    background: rgba(232,77,107,0.1);
    border: 1px solid rgba(232,77,107,0.22);
    border-radius: var(--r-pill);
    padding: 0.28em 0.8em;
  }
  .cost-badge svg { color: var(--heart); flex-shrink: 0; }

  .free-tag    { color: var(--gold); }
  .free-left   { font-size: var(--text-xs); color: var(--ink-dim); font-weight: 400; }
  .balance-dim { font-size: var(--text-xs); color: var(--ink-dim); font-weight: 400; }

  /* ── Open button ────────────────────────────────────────────── */
  .open-btn {
    width: 100%;
    max-width: 260px;
    letter-spacing: 0.02em;
  }
  .open-btn:not(:disabled) {
    animation: btnPulse 2.8s ease-in-out infinite;
  }
  @keyframes btnPulse {
    0%,100% { box-shadow: 0 4px 22px rgba(245,196,81,0.22), 0 0 0 1px rgba(245,196,81,0.3); }
    50%     { box-shadow: 0 8px 36px rgba(245,196,81,0.42), 0 0 0 1px rgba(245,196,81,0.55); }
  }

  .cant-text {
    font-size: var(--text-xs);
    color: var(--danger);
    margin: 0;
    text-align: center;
  }

  .error-msg {
    margin: 0;
    padding: var(--sp-2) var(--sp-3);
    font-size: var(--text-sm);
    color: var(--danger);
    background: rgba(248,113,113,0.08);
    border: 1px solid rgba(248,113,113,0.2);
    border-radius: var(--r-md);
    text-align: center;
  }

  /* ── Back button (opening phase) ────────────────────────────── */
  .back-floating {
    align-self: flex-start;
    margin-bottom: var(--sp-3);
  }
</style>
