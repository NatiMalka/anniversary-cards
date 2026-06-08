<script>
  import { onMount } from 'svelte';
  import { user } from '$lib/stores/user.js';
  import { loadCollection, collection, collectedCount, collectionYears } from '$lib/stores/collection.js';
  import CardFront from '$lib/components/CardFront.svelte';
  import { TIER_LABELS } from '$lib/effects.js';

  const TOTAL    = 100;
  const ALL_SLOTS = Array.from({ length: TOTAL }, (_, i) => i + 1);
  const tiers    = ['all', 'legendary', 'rare', 'common'];
  const tierLabels = { all: 'הכל', ...TIER_LABELS };

  let activeYear = 'all';
  let activeTier = 'all';
  let modalCard  = null;
  let loading    = true;

  onMount(async () => {
    if ($user.id) await loadCollection($user.id);
    loading = false;
  });

  function slotCard(n, col) {
    const c = col[String(n)];
    if (!c) return null;
    if (activeTier !== 'all' && c.rarityTier !== activeTier) return null;
    if (activeYear !== 'all' && String(c.year) !== String(activeYear)) return null;
    return c;
  }

  function openModal(card) { modalCard = card; }
  function closeModal(e)   { if (e.target === e.currentTarget) modalCard = null; }

  async function clearCollection() {
    if (!confirm('למחוק את כל הקלפים באלבום?')) return;
    await collection.reset($user.id);
  }

  const tierColors = {
    common:    '#64748b',
    rare:      'linear-gradient(135deg,#2563eb,#06b6d4)',
    epic:      'linear-gradient(135deg,#8a8a9a,#c8c8d4)',
    legendary: 'linear-gradient(135deg,#f59e0b,#ef4444)'
  };
</script>

<svelte:head><title>האלבום — קלפי האהבה</title></svelte:head>

<svelte:window on:keydown={(e) => e.key === 'Escape' && (modalCard = null)} />

<main>
  <header class="album-head">
    <div class="head-text">
      <h1>האלבום</h1>
      <p class="counter">
        <span class="num">{$collectedCount}</span> / {TOTAL} קלפים נאספו
      </p>
    </div>
    <button class="btn btn-ghost btn-sm clear-btn" on:click={clearCollection} title="נקה אלבום">
      🗑 נקה
    </button>

    <div class="progress-wrap">
      <div class="progress-bar" style="width:{($collectedCount / TOTAL) * 100}%"></div>
    </div>
  </header>

  {#if loading}
    <p class="loading-msg">טוען אלבום...</p>
  {:else}
    <div class="filters">
      <div class="tab-group">
        <button class="tab" class:active={activeYear === 'all'} on:click={() => (activeYear = 'all')}>כל השנים</button>
        {#each $collectionYears as y}
          <button class="tab" class:active={activeYear === String(y)} on:click={() => (activeYear = String(y))}>{y}</button>
        {/each}
      </div>

      <div class="tier-group">
        {#each tiers as t}
          <button
            class="tier-chip"
            class:active={activeTier === t}
            style={activeTier === t && t !== 'all' ? `background:${tierColors[t]}; border-color:transparent;` : ''}
            on:click={() => (activeTier = t)}
          >{tierLabels[t]}</button>
        {/each}
      </div>
    </div>

    <div class="grid">
      {#each ALL_SLOTS as n}
        {@const card = slotCard(n, $collection)}
        {#if card}
          <button class="slot slot--filled" on:click={() => openModal(card)}>
            <div class="slot-num">{n}</div>
            <div class="slot-card">
              <CardFront
                effect={card.effect}
                photo={card.photo}
                title={card.title}
                date={card.date}
                description={card.description}
                rarityTier={card.rarityTier}
                isFlat={card.isFlat}
                showFrame={card.showFrame ?? false}
                frameColor={card.frameColor ?? '#f5c451'}
              />
            </div>
            <div class="slot-badge" style="background:{tierColors[card.rarityTier] || '#475569'}">
              {TIER_LABELS[card.rarityTier] || card.rarityTier}
            </div>
            {#if card.count > 1}
              <div class="slot-count">×{card.count}</div>
            {/if}
          </button>
        {:else}
          <div class="slot slot--empty" class:dim={activeTier !== 'all' || activeYear !== 'all'}>
            <span class="slot-num">{n}</span>
            <div class="empty-art"><div class="empty-diamond"></div></div>
          </div>
        {/if}
      {/each}
    </div>
  {/if}
</main>

{#if modalCard}
  <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
  <div class="modal-backdrop" on:click={closeModal}>
    <div class="modal-inner">
      <button class="modal-close" on:click={() => (modalCard = null)}>✕</button>
      <div class="modal-card">
        <CardFront
          effect={modalCard.effect}
          photo={modalCard.photo}
          title={modalCard.title}
          date={modalCard.date}
          description={modalCard.description}
          rarityTier={modalCard.rarityTier}
          isFlat={modalCard.isFlat}
          showFrame={modalCard.showFrame ?? false}
          frameColor={modalCard.frameColor ?? '#f5c451'}
          showcase={true}
        />
      </div>
      <div class="modal-meta" dir="rtl">
        {#if modalCard.title}<p class="modal-title">{modalCard.title}</p>{/if}
        {#if modalCard.description}<p class="modal-desc">{modalCard.description}</p>{/if}
        <div class="modal-tags">
          <span class="tag">#{modalCard.cardNumber}</span>
          {#if modalCard.year}<span class="tag">{modalCard.year}</span>{/if}
          <span class="tag tag--rarity" style="background:{tierColors[modalCard.rarityTier]}">{TIER_LABELS[modalCard.rarityTier]}</span>
          {#if modalCard.count > 1}<span class="tag">×{modalCard.count} עותקים</span>{/if}
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  main { max-width: 1300px; margin: 0 auto; padding: clamp(1rem, 3vw, 2rem); }
  .loading-msg { text-align: center; color: var(--ink-dim); padding: var(--sp-8) 0; }

  .album-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
  .clear-btn { flex-shrink: 0; align-self: flex-start; }
  .head-text { display: flex; align-items: baseline; gap: 1rem; flex-wrap: wrap; margin-bottom: 0.75rem; }
  .album-head h1 { font-size: clamp(1.6rem, 4vw, 2.4rem); margin: 0; }
  .counter { margin: 0; color: var(--ink-dim); font-size: 1rem; }
  .counter .num { font-size: 1.5rem; font-weight: 900; color: var(--gold, #f5c451); }
  .progress-wrap { height: 5px; background: rgba(255,255,255,0.08); border-radius: 999px; overflow: hidden; }
  .progress-bar { height: 100%; background: linear-gradient(90deg, #c89a1a, #f5c451); border-radius: 999px; transition: width 0.6s ease; }

  .filters { display: flex; flex-wrap: wrap; gap: 0.75rem 1.5rem; align-items: center; margin-bottom: 1.5rem; }
  .tab-group, .tier-group { display: flex; gap: 0.4rem; flex-wrap: wrap; }
  .tab { padding: 0.35rem 0.9rem; border-radius: 999px; border: 1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.05); color: var(--ink-dim); font: inherit; font-size: 0.85rem; cursor: pointer; transition: all 0.15s ease; }
  .tab.active { background: linear-gradient(135deg,#c89a1a,#f5c451); border-color: transparent; color: #fff; font-weight: 700; }
  .tier-chip { padding: 0.3rem 0.75rem; border-radius: 999px; border: 1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.05); color: var(--ink-dim); font: inherit; font-size: 0.8rem; cursor: pointer; transition: all 0.15s ease; }
  .tier-chip.active { color: #fff; font-weight: 700; }

  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: clamp(0.6rem, 1.5vw, 1.25rem); }

  .slot { position: relative; aspect-ratio: 0.718; border-radius: 8px; overflow: visible; }
  .slot-num { position: absolute; top: 6px; right: 8px; z-index: 4; font-size: 0.65rem; font-weight: 700; color: rgba(255,255,255,0.55); letter-spacing: 0.04em; pointer-events: none; }

  .slot--empty { background: linear-gradient(145deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015)); border: 1px solid rgba(255,255,255,0.09); display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: default; transition: opacity 0.2s; }
  .slot--empty.dim { opacity: 0.3; }
  .empty-art { display: flex; align-items: center; justify-content: center; flex: 1; padding-bottom: 1rem; }
  .empty-diamond { width: 28%; aspect-ratio: 1; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); transform: rotate(45deg); border-radius: 3px; }

  .slot--filled { background: none; border: none; padding: 0; cursor: pointer; transition: transform 0.2s ease, filter 0.2s ease; }
  .slot--filled:hover { transform: translateY(-4px) scale(1.03); filter: drop-shadow(0 8px 20px rgba(245,196,81,0.3)); z-index: 10; }
  .slot-card { width: 100%; height: 100%; pointer-events: none; }
  .slot--filled :global(.card) { pointer-events: none !important; }
  .slot-card :global(.card__shine), .slot-card :global(.card__glare) { display: none !important; }
  .slot-card :global(.card:not(.interactive):hover) { --card-opacity: 0 !important; --card-scale: 1 !important; --translate-y: 0px !important; }
  .slot-badge { position: absolute; top: 6px; left: 6px; z-index: 5; font-size: 0.55rem; font-weight: 700; padding: 0.2em 0.55em; border-radius: 999px; color: #fff; pointer-events: none; text-shadow: 0 1px 2px rgba(0,0,0,0.5); }
  .slot-count { position: absolute; bottom: 6px; left: 6px; z-index: 5; font-size: 0.6rem; font-weight: 700; padding: 0.15em 0.45em; border-radius: 999px; background: rgba(0,0,0,0.55); color: var(--gold,#f5c451); pointer-events: none; }

  .modal-backdrop { position: fixed; inset: 0; z-index: 9000; background: rgba(10,4,22,0.82); backdrop-filter: blur(6px); display: grid; place-items: center; padding: 1rem; }
  .modal-inner { position: relative; display: flex; flex-direction: column; align-items: center; gap: 1.25rem; max-width: 480px; width: 100%; animation: popIn 0.35s cubic-bezier(0.2,0.9,0.3,1.2); }
  .modal-close { position: absolute; top: -0.5rem; left: -0.5rem; z-index: 10; width: 2rem; height: 2rem; border-radius: 50%; border: 1px solid rgba(255,255,255,0.2); background: rgba(30,14,50,0.9); color: var(--ink-dim); font-size: 0.85rem; cursor: pointer; display: grid; place-items: center; }
  .modal-card { width: min(360px, 88vw); }
  .modal-meta { text-align: center; }
  .modal-title { margin: 0 0 0.3rem; font-family: 'Frank Ruhl Libre', serif; font-size: 1.3rem; font-weight: 700; }
  .modal-desc  { margin: 0 0 0.75rem; color: var(--ink-dim); font-size: 0.95rem; line-height: 1.5; }
  .modal-tags  { display: flex; gap: 0.4rem; flex-wrap: wrap; justify-content: center; }
  .tag { padding: 0.25em 0.7em; border-radius: 999px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.14); font-size: 0.8rem; color: var(--ink-dim); }
  .tag--rarity { color: #fff; font-weight: 700; border-color: transparent; }

  @keyframes popIn { from { opacity: 0; transform: scale(0.85) translateY(16px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  @media (max-width: 480px) { .grid { grid-template-columns: repeat(auto-fill,minmax(90px,1fr)); gap: 0.5rem; } }
</style>
