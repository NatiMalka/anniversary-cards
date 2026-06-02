<script>
  import { page } from '$app/stores';
  import { user } from '$lib/stores/user.js';
  import { wallet, freePacks } from '$lib/stores/wallet.js';
  import ThreePack from '$lib/components/ThreePack.svelte';
  import PackFocusOverlay from '$lib/components/PackFocusOverlay.svelte';

  const PACK_TYPES = {
    regular:   { id: 'regular',   label: 'רגילה', cost: 10, desc: 'רגיל – נדיר', tiers: ['common','rare'],    color: 'var(--silver-dim)', glow: 'rgba(138,138,154,0.22)', border: 'rgba(138,138,154,0.35)' },
    legendary: { id: 'legendary', label: 'אגדית', cost: 20, desc: 'אפי – אגדי',  tiers: ['epic','legendary'], color: 'var(--gold)',        glow: 'rgba(245,196,81,0.4)',   border: 'rgba(245,196,81,0.5)',  center: true },
    rare:      { id: 'rare',      label: 'נדירה', cost: 15, desc: 'נדיר – אפי',  tiers: ['rare','epic'],      color: 'var(--silver)',      glow: 'rgba(200,200,212,0.26)', border: 'rgba(200,200,212,0.4)' },
  };

  const PACK_ORDER = ['regular', 'legendary', 'rare'];

  // Auto-open overlay if ?type= param is present
  const initType = $page.url.searchParams.get('type');
  let focusedPack = initType && PACK_TYPES[initType] ? PACK_TYPES[initType] : null;
  let sound = true;

  $: free   = freePacks.remaining($user.id);
  $: hearts = wallet.balance($user.id);
</script>

<svelte:head><title>חבילות — עשור של אהבה</title></svelte:head>

{#if focusedPack}
  <PackFocusOverlay pack={focusedPack} {sound} on:close={() => focusedPack = null} />
{/if}

<div class="page">

  <!-- ── Compact header ─────────────────────────────────────────── -->
  <header class="pack-header">
    <h1>חבילות</h1>
    <div class="header-pills">
      {#if free > 0}
        <span class="pill pill-free" aria-label="{free} חבילות חינמיות">🎁 {free} חינם</span>
      {/if}
      <span class="pill pill-hearts" aria-label="{hearts} לבבות">
        <svg viewBox="0 0 24 24" fill="currentColor" width="10" height="10" aria-hidden="true">
          <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/>
        </svg>
        {hearts}
      </span>
      <button class="pill pill-refill" on:click={() => wallet.reset($user.id)} aria-label="מלא לבבות לבדיקה">♻️</button>
    </div>
  </header>

  <!-- ── Pack stage ─────────────────────────────────────────────── -->
  <section class="packs-stage" aria-label="בחרי סוג חבילה">
    <p class="stage-hint">בחרי חבילה לפתיחה</p>
    <div class="packs-grid">
      {#each PACK_ORDER as id}
        {@const pk = PACK_TYPES[id]}
        <button
          class="pack-tile"
          class:center={pk.center}
          style="--glow:{pk.glow};"
          aria-label="חבילה {pk.label}, {pk.cost} לבבות"
          on:click={() => focusedPack = pk}
        >
          <div class="pack-frame">
            <ThreePack packType={pk.id} />
          </div>
        </button>
      {/each}
    </div>
  </section>

  <!-- ── Sound ──────────────────────────────────────────────────── -->
  <label class="sound-row">
    <input type="checkbox" bind:checked={sound} />
    <span>צלילים</span>
  </label>

</div>

<style>
  /* ── Page ───────────────────────────────────────────────────── */
  .page {
    padding-bottom: calc(var(--nav-bot-h) + var(--sp-6));
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
  }

  /* ── Header ─────────────────────────────────────────────────── */
  .pack-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    animation: fadeUp 0.45s var(--ease-out) 0.04s both;
  }
  .pack-header h1 {
    font-size: var(--text-2xl);
    font-family: 'Frank Ruhl Libre', serif;
    margin: 0;
  }
  .header-pills {
    display: flex;
    gap: var(--sp-2);
    align-items: center;
  }
  .pill {
    display: inline-flex;
    align-items: center;
    gap: 0.3em;
    font-size: var(--text-xs);
    font-weight: 600;
    padding: 0.28em 0.8em;
    border-radius: var(--r-pill);
    border: 1px solid transparent;
    line-height: 1.4;
  }
  .pill-free    { background: rgba(245,196,81,0.1);  border-color: rgba(245,196,81,0.2);  color: var(--gold);  }
  .pill-hearts  { background: rgba(232,77,107,0.1); border-color: rgba(232,77,107,0.2); color: var(--heart); }
  .pill-refill  { background: none; border-style: dashed; border-color: rgba(255,255,255,0.15); color: var(--ink-dim); cursor: pointer; opacity: 0.55; font: inherit; }
  .pill-refill:hover { opacity: 1; color: var(--ink); }

  /* ── Pack stage ─────────────────────────────────────────────── */
  .packs-stage {
    display: flex;
    flex-direction: column;
    gap: var(--sp-3);
    animation: fadeUp 0.55s var(--ease-out) 0.1s both;
  }

  .stage-hint {
    margin: 0;
    text-align: center;
    font-size: var(--text-sm);
    color: var(--ink-dim);
  }

  .packs-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--sp-3);
    align-items: end;
    padding-top: 8px;
  }

  .pack-tile {
    position: relative;
    display: block;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
    transition: transform 0.25s var(--ease-out), filter 0.25s ease;
  }
  .pack-tile:hover {
    transform: translateY(-6px);
    filter: drop-shadow(0 16px 24px var(--glow));
  }
  .pack-tile:focus-visible { outline: 2px solid rgba(245,196,81,0.6); outline-offset: 4px; border-radius: 10px; }

  .pack-tile.center {
    transform: translateY(-18px);
    filter: drop-shadow(0 16px 28px var(--glow));
    z-index: 2;
  }
  .pack-tile.center:hover { transform: translateY(-24px); }

  .pack-frame {
    position: relative;
    width: 100%;
    aspect-ratio: 0.706;
    border-radius: 7px;
    overflow: hidden;
  }

  /* ── Sound ──────────────────────────────────────────────────── */
  .sound-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--sp-2);
    font-size: var(--text-sm);
    color: var(--ink-dim);
    cursor: pointer;
  }
  .sound-row input { cursor: pointer; accent-color: var(--gold); }

  /* ── Reduced motion ─────────────────────────────────────────── */
  @media (prefers-reduced-motion: reduce) {
    .pack-header, .packs-stage { animation: none; }
  }
</style>
