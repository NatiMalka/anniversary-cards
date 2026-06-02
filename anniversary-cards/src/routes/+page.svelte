<script>
  import { browser } from '$app/environment';
  import { user } from '$lib/stores/user.js';
  import { wallet, freePacks } from '$lib/stores/wallet.js';
  import { collectedCount } from '$lib/stores/collection.js';
  import { dailyTasks, completions } from '$lib/stores/tasks.js';
  import ThreePack from '$lib/components/ThreePack.svelte';
  import PackFocusOverlay from '$lib/components/PackFocusOverlay.svelte';

  const ANNIVERSARY = new Date('2016-06-14');
  const TODAY       = new Date();
  const years       = TODAY.getFullYear() - ANNIVERSARY.getFullYear();
  const days        = Math.floor((TODAY.getTime() - ANNIVERSARY.getTime()) / 86400000);

  // Legendary in center
  const PACK_TYPES = [
    { id: 'regular',   label: 'רגילה', cost: 10, desc: 'רגיל – נדיר', tiers: ['common','rare'],    color: 'var(--silver-dim)', glow: 'rgba(138,138,154,0.22)', border: 'rgba(138,138,154,0.35)' },
    { id: 'legendary', label: 'אגדית', cost: 20, desc: 'אפי – אגדי',  tiers: ['epic','legendary'], color: 'var(--gold)',        glow: 'rgba(245,196,81,0.42)',  border: 'rgba(245,196,81,0.55)',  center: true },
    { id: 'rare',      label: 'נדירה', cost: 15, desc: 'נדיר – אפי',  tiers: ['rare','epic'],      color: 'var(--silver)',      glow: 'rgba(200,200,212,0.26)', border: 'rgba(200,200,212,0.4)'  },
  ];

  let focusedPack = null;

  $: hearts    = browser ? wallet.balance($user.id) : 0;
  $: freeLeft  = browser ? freePacks.remaining($user.id) : freePacks.FREE_PER_DAY;
  $: dailyDone = $dailyTasks.filter(/** @param {any} t */ t => $completions[completions.key(t, $user.id)]).length;
  $: dailyTotal= $dailyTasks.length;
  $: albumPct  = ($collectedCount / 100) * 100;
</script>

<svelte:head><title>בית — עשור של אהבה</title></svelte:head>

{#if focusedPack}
  <PackFocusOverlay pack={focusedPack} on:close={() => focusedPack = null} />
{/if}

<div class="page">

  <!-- ── Identity ─────────────────────────────────────────────── -->
  <a href="/anniversary" class="identity" aria-label="דף השנה">
    <h1 class="couple">
      <span class="n-gold">נתנאל</span>
      <span class="amp">&amp;</span>
      <span class="n-silver">אלמוג אסתר</span>
    </h1>
    <div class="id-meta">
      <span class="meta-item">
        <svg viewBox="0 0 24 24" fill="currentColor" width="11" height="11" aria-hidden="true">
          <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/>
        </svg>
        <strong>{hearts}</strong>
        <span>יתרה</span>
      </span>
      <span class="meta-dot" aria-hidden="true">·</span>
      <span class="meta-item meta-days">
        <strong>{days.toLocaleString('he-IL')}</strong>
        <span>ימים</span>
        <span class="years-badge">💍 {years}</span>
      </span>
    </div>
  </a>

  <!-- ── Pack stage ────────────────────────────────────────────── -->
  <section class="packs-stage" aria-label="חבילות">
    <div class="packs-grid">
      {#each PACK_TYPES as pk}
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

  <!-- ── Test-mode refill ─────────────────────────────────────── -->
  <div class="refill-row">
    <button class="btn btn-ghost btn-sm refill-btn"
      on:click={() => wallet.reset($user.id)}
      aria-label="מלא לבבות לבדיקה">
      ♻️ מלא לבבות לבדיקה
    </button>
  </div>

  <!-- ── Today's actions ───────────────────────────────────────── -->
  <section class="today-section" aria-labelledby="today-heading">
    <h2 class="today-heading" id="today-heading">
      <span aria-hidden="true">📅</span> הפעולות שלך להיום
    </h2>

    <div class="today-grid">

      <!-- Free packs card -->
      <div class="today-card surface">
        <div class="today-card-head">
          <span class="today-icon" aria-hidden="true">🎁</span>
          <span class="today-card-label">חבילות חינם</span>
        </div>
        <div class="today-big" aria-label="{freeLeft} מתוך {freePacks.FREE_PER_DAY} חבילות חינמיות">
          {freeLeft}<small>/{freePacks.FREE_PER_DAY}</small>
        </div>
        <div class="today-sub">נשארו להיום</div>
        <a href="/packs" class="btn btn-gold btn-sm btn-full today-btn"
           aria-label="פתח חבילה חינמית">פתח חבילה 🎁</a>
      </div>

      <!-- Daily tasks card -->
      <div class="today-card surface">
        <div class="today-card-head">
          <span class="today-icon" aria-hidden="true">🎯</span>
          <span class="today-card-label">משימות יומיות</span>
        </div>
        <div class="today-big" aria-label="{dailyDone} מתוך {dailyTotal} משימות הושלמו">
          <span class:tasks-all-done={dailyDone > 0 && dailyDone === dailyTotal}>{dailyDone}</span><small>/{dailyTotal || '–'}</small>
        </div>
        <div class="today-sub">הושלמו להיום</div>
        <a href="/tasks" class="btn btn-glass btn-sm btn-full today-btn"
           aria-label="ראה משימות">ראה משימות ≡</a>
      </div>

    </div>
  </section>

  <!-- ── Our Journey (album) ───────────────────────────────────── -->
  <a href="/album" class="journey surface" aria-label="האלבום שלנו, {Math.round(albumPct)}% התקדמות">
    <div class="journey-heart-wrap" aria-hidden="true">
      <span class="journey-heart">❤️</span>
    </div>
    <div class="journey-body">
      <span class="journey-title">המסע שלנו <span aria-hidden="true">♥</span></span>
      <span class="journey-sub">כל שנה, כל זיכרון, כל קלף</span>
    </div>
    <div class="journey-pct" aria-hidden="true">
      <span class="journey-pct-num">{Math.round(albumPct)}%</span>
      <span class="journey-pct-label">התקדמות</span>
    </div>
  </a>

</div>

<style>
  /* ── Page ───────────────────────────────────────────────────── */
  .page {
    padding-bottom: calc(var(--nav-bot-h) + var(--sp-6));
    display: flex;
    flex-direction: column;
    gap: var(--sp-5);
  }

  /* ── Identity ───────────────────────────────────────────────── */
  .identity {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--sp-1);
    text-align: center;
    text-decoration: none;
    padding: var(--sp-1) 0;
    border-radius: var(--r-xl);
    transition: background 0.2s ease;
    animation: fadeUp 0.45s var(--ease-out) 0.04s both;
  }
  .identity:hover   { background: rgba(245,196,81,0.03); }
  .identity:focus-visible { outline: 2px solid var(--gold-muted); outline-offset: 4px; }

  .couple {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.3em;
    flex-wrap: wrap;
    justify-content: center;
    font-family: 'Frank Ruhl Libre', serif;
    font-size: clamp(1.5rem, 5.5vw, 2.4rem);
    font-weight: 700;
    line-height: 1.2;
    text-wrap: balance;
  }
  .n-gold   { color: var(--gold); }
  .n-silver { color: var(--silver); }
  .amp      { color: var(--ink-dim); font-weight: 300; font-size: 0.58em; }

  .id-meta {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    flex-wrap: wrap;
    justify-content: center;
  }
  .meta-item {
    display: inline-flex;
    align-items: center;
    gap: 0.3em;
    font-size: var(--text-sm);
    color: var(--ink-dim);
  }
  .meta-item strong { color: var(--ink); font-weight: 700; font-variant-numeric: tabular-nums; }
  .meta-item svg    { color: var(--heart); flex-shrink: 0; }
  .meta-days strong { color: var(--ink); }
  .meta-dot { color: rgba(245,196,81,0.3); font-size: var(--text-xs); }
  .years-badge {
    font-size: var(--text-xs);
    color: var(--gold-dim);
    background: rgba(245,196,81,0.1);
    border: 1px solid rgba(245,196,81,0.18);
    border-radius: var(--r-pill);
    padding: 0.12em 0.55em;
    line-height: 1.5;
  }

  /* ── Pack stage ─────────────────────────────────────────────── */
  .packs-stage {
    animation: fadeUp 0.55s var(--ease-out) 0.1s both;
  }

  .packs-grid {
    display: grid;
    grid-template-columns: 1fr 1.22fr 1fr;
    gap: var(--sp-2);
    align-items: end;
    padding-top: 22px;
  }

  .pack-tile {
    position: relative;
    display: block;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
    transition: transform 0.28s var(--ease-out), filter 0.28s ease;
  }
  .pack-tile:hover {
    transform: translateY(-6px);
    filter: drop-shadow(0 18px 28px var(--glow));
  }
  .pack-tile:focus-visible { outline: 2px solid rgba(245,196,81,0.6); outline-offset: 4px; border-radius: 10px; }

  .pack-tile.center {
    transform: translateY(-22px);
    filter: drop-shadow(0 18px 32px var(--glow));
    z-index: 2;
  }
  .pack-tile.center:hover { transform: translateY(-30px); }

  .pack-frame {
    position: relative;
    width: 100%;
    aspect-ratio: 0.706;
    border-radius: 8px;
    overflow: hidden;
  }


  /* ── Test refill ────────────────────────────────────────────── */
  .refill-row {
    display: flex;
    justify-content: center;
  }
  .refill-btn {
    font-size: var(--text-xs);
    opacity: 0.55;
    border-style: dashed;
  }
  .refill-btn:hover { opacity: 1; }

  /* ── Today section ──────────────────────────────────────────── */
  .today-section {
    display: flex;
    flex-direction: column;
    gap: var(--sp-3);
    animation: fadeUp 0.5s var(--ease-out) 0.18s both;
  }

  .today-heading {
    margin: 0;
    font-size: var(--text-base);
    font-weight: 600;
    color: var(--ink-dim);
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    font-family: 'Heebo', system-ui, sans-serif;
  }

  .today-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--sp-3);
  }

  .today-card {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    padding: var(--sp-4);
    border-radius: var(--r-lg);
  }

  .today-card-head {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
  }
  .today-icon { font-size: 1.1rem; line-height: 1; }
  .today-card-label {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--ink-dim);
    line-height: 1.3;
  }

  .today-big {
    font-size: var(--text-4xl);
    font-weight: 700;
    color: var(--ink);
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
  .today-big small {
    font-size: 0.45em;
    color: var(--ink-dim);
    font-weight: 400;
  }
  .tasks-all-done { color: var(--success); }

  .today-sub {
    font-size: var(--text-xs);
    color: var(--ink-dim);
    margin-top: auto;
  }

  .today-btn { margin-top: var(--sp-1); }

  /* ── Journey tile ───────────────────────────────────────────── */
  .journey {
    display: flex;
    align-items: center;
    gap: var(--sp-4);
    padding: var(--sp-4) var(--sp-5);
    border-radius: var(--r-lg);
    text-decoration: none;
    color: var(--ink);
    animation: fadeUp 0.5s var(--ease-out) 0.25s both;
    transition: transform 0.22s var(--ease-out), border-color 0.22s ease;
  }
  .journey:hover {
    transform: translateY(-2px);
    border-color: rgba(232,77,107,0.28);
  }
  .journey:focus-visible { outline: 2px solid var(--heart); outline-offset: 3px; }

  .journey-heart-wrap {
    flex-shrink: 0;
    width: 52px; height: 52px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: rgba(232,77,107,0.12);
    border: 1px solid rgba(232,77,107,0.2);
    box-shadow: 0 0 20px rgba(232,77,107,0.18);
  }
  .journey-heart {
    font-size: 1.6rem;
    line-height: 1;
    filter: drop-shadow(0 0 6px rgba(232,77,107,0.55));
    animation: heartbeat 3s ease-in-out infinite;
  }

  .journey-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .journey-title {
    font-size: var(--text-base);
    font-weight: 700;
    font-family: 'Frank Ruhl Libre', serif;
    color: var(--ink);
    line-height: 1.2;
  }
  .journey-sub {
    font-size: var(--text-xs);
    color: var(--ink-dim);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .journey-pct {
    flex-shrink: 0;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }
  .journey-pct-num {
    font-size: var(--text-2xl);
    font-weight: 700;
    color: var(--gold);
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }
  .journey-pct-label {
    font-size: var(--text-xs);
    color: var(--ink-dim);
    white-space: nowrap;
  }

  /* ── Reduced motion ─────────────────────────────────────────── */
  @media (prefers-reduced-motion: reduce) {
    .identity, .packs-stage, .today-section, .journey { animation: none; }
    .journey-heart { animation: none; }
  }
</style>
