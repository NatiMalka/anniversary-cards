<script>
  import { onMount } from 'svelte';
  import { pool, loadPool, deletePool } from '$lib/stores/cardPool.js';
  import { EFFECTS, TIER_LABELS } from '$lib/effects.js';

  const TIER_COLORS = {
    common:    'var(--ink-dim)',
    rare:      'var(--silver)',
    epic:      'var(--silver)',
    legendary: 'var(--gold)'
  };

  let loading = true;
  let toast   = null;
  let busy    = {};

  onMount(async () => {
    await loadPool();
    loading = false;
  });

  function showToast(msg, type = 'success') {
    toast = { msg, type };
    setTimeout(() => (toast = null), 3000);
  }

  async function handleDelete(card) {
    if (!confirm(`למחוק קלף #${card.card_number} "${card.title}"?\nהקלף יימחק גם מכל האוספים.`)) return;
    busy = { ...busy, [card.id]: true };
    const ok = await deletePool(card.id);
    busy = { ...busy, [card.id]: false };
    if (ok) {
      showToast(`קלף #${card.card_number} נמחק ✓`);
    } else {
      showToast('שגיאה במחיקה', 'error');
    }
  }
</script>

<svelte:head><title>בריכת הקלפים — ניהול</title></svelte:head>

{#if toast}
  <div class="toast toast--{toast.type}" role="alert">{toast.msg}</div>
{/if}

<div class="page pool-page">
  <div class="page-header">
    <div class="header-start">
      <a href="/admin" class="back-link">← ניהול</a>
      <h1>
        בריכת הקלפים
        {#if !loading}
          <span class="count-badge">{$pool.length} / 100</span>
        {/if}
      </h1>
      <p class="header-sub">כל הקלפים שנוצרו — אלו שיופיעו בחבילות</p>
    </div>
    <a href="/admin/card-editor" class="btn btn-gold btn-sm new-card-btn">+ קלף חדש</a>
  </div>

  {#if loading}
    <p class="state-msg">טוען קלפים...</p>
  {:else if $pool.length === 0}
    <div class="empty-state">
      <span class="empty-icon">🎴</span>
      <p class="empty-title">הבריכה ריקה</p>
      <p class="empty-sub">צור קלף ראשון בעורך</p>
      <a href="/admin/card-editor" class="btn btn-gold">+ קלף חדש</a>
    </div>
  {:else}
    <div class="card-grid">
      {#each $pool as card (card.id)}
        {@const tierColor = TIER_COLORS[card.rarity_tier] ?? 'var(--ink-dim)'}
        {@const effectLabel = EFFECTS[card.effect]?.label ?? card.effect}
        <div class="card-tile surface">
          <a href="/admin/card-editor?card={card.card_number}" class="tile-thumb" aria-label="עריכת קלף #{card.card_number}">
            {#if card.photo_url}
              <img src={card.photo_url} alt={card.title} class="thumb-img" loading="lazy" />
            {:else}
              <div class="thumb-placeholder" aria-hidden="true">🖼</div>
            {/if}
            <span class="edit-overlay">עריכה</span>
          </a>

          <div class="tile-body">
            <div class="tile-top">
              <span class="card-num" style="color:{tierColor}">#{card.card_number}</span>
              {#if card.year}
                <span class="year-tag">{card.year}</span>
              {/if}
            </div>
            <p class="card-title">{card.title}</p>
            <div class="tile-chips">
              <span class="chip" style="color:{tierColor}; border-color:{tierColor}40">
                {TIER_LABELS[card.rarity_tier] ?? card.rarity_tier}
              </span>
              <span class="chip chip-effect">{effectLabel}</span>
            </div>
          </div>

          <div class="tile-actions">
            <a href="/admin/card-editor?card={card.card_number}" class="btn btn-ghost btn-sm">עריכה</a>
            <button
              class="btn btn-ghost btn-sm danger"
              disabled={busy[card.id]}
              on:click={() => handleDelete(card)}
            >
              {busy[card.id] ? '...' : 'מחק'}
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .pool-page { max-width: 1100px; }

  .page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--sp-4);
    margin-bottom: var(--sp-6);
    padding-bottom: var(--sp-4);
    border-bottom: 1px solid var(--glass-border);
    flex-wrap: wrap;
  }

  .header-start {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .header-sub {
    margin: 4px 0 0;
    font-size: var(--text-sm);
    color: var(--ink-dim);
  }

  .new-card-btn { flex-shrink: 0; }

  .header-start h1 {
    margin: 0;
    font-size: var(--text-2xl);
    display: flex;
    align-items: center;
    gap: var(--sp-3);
  }

  .back-link {
    font-size: var(--text-xs);
    color: var(--gold-dim);
    text-decoration: none;
  }
  .back-link:hover { color: var(--gold); }

  .count-badge {
    font-size: var(--text-sm);
    font-weight: 400;
    color: var(--ink-dim);
    background: var(--glass);
    border: 1px solid var(--glass-border);
    border-radius: var(--r-pill);
    padding: 0.15em 0.65em;
  }

  /* ── Grid ────────────────────────────────────────────────────── */
  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: var(--sp-4);
  }

  @media (max-width: 480px) {
    .card-grid {
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: var(--sp-3);
    }
  }

  /* ── Tile ─────────────────────────────────────────────────────── */
  .card-tile {
    border-radius: var(--r-xl);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: transform 0.22s var(--ease-out), border-color 0.22s ease;
  }
  .card-tile:hover {
    transform: translateY(-3px);
    border-color: var(--gold-muted);
  }

  /* Thumbnail */
  .tile-thumb {
    position: relative;
    display: block;
    width: 100%;
    aspect-ratio: 0.718;
    background: var(--bg-2);
    overflow: hidden;
    text-decoration: none;
    flex-shrink: 0;
  }

  .thumb-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.3s var(--ease-out);
  }
  .card-tile:hover .thumb-img { transform: scale(1.04); }

  .thumb-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.5rem;
    opacity: 0.25;
  }

  .edit-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.52);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--text-sm);
    font-weight: 700;
    color: #fff;
    opacity: 0;
    transition: opacity 0.18s ease;
  }
  .card-tile:hover .edit-overlay { opacity: 1; }

  /* Body */
  .tile-body {
    padding: var(--sp-3);
    display: flex;
    flex-direction: column;
    gap: var(--sp-1);
    flex: 1;
  }

  .tile-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-2);
  }

  .card-num {
    font-size: var(--text-xs);
    font-weight: 700;
  }

  .year-tag {
    font-size: var(--text-xs);
    color: var(--ink-faint);
    background: var(--glass);
    border: 1px solid var(--glass-border);
    border-radius: var(--r-pill);
    padding: 0.1em 0.45em;
  }

  .card-title {
    margin: 0;
    font-size: var(--text-sm);
    font-weight: 600;
    line-height: 1.3;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .tile-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: var(--sp-1);
  }

  .chip {
    font-size: 0.65rem;
    font-weight: 600;
    padding: 0.15em 0.55em;
    border-radius: var(--r-pill);
    border: 1px solid var(--glass-border);
    background: var(--glass);
    color: var(--ink-dim);
    white-space: nowrap;
  }

  .chip-effect {
    color: var(--ink-dim);
    border-color: var(--glass-border);
  }

  /* Actions */
  .tile-actions {
    display: flex;
    gap: var(--sp-2);
    padding: var(--sp-2) var(--sp-3) var(--sp-3);
  }

  .tile-actions .btn { flex: 1; text-align: center; text-decoration: none; }

  /* ── Empty state ─────────────────────────────────────────────── */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--sp-3);
    padding: var(--sp-12) var(--sp-4);
    text-align: center;
  }
  .empty-icon  { font-size: 3.5rem; opacity: 0.4; }
  .empty-title { margin: 0; font-size: var(--text-xl); font-weight: 700; }
  .empty-sub   { margin: 0; font-size: var(--text-sm); color: var(--ink-dim); }

  .state-msg {
    text-align: center;
    color: var(--ink-dim);
    padding: var(--sp-8) 0;
  }

  /* ── Danger button ───────────────────────────────────────────── */
  .danger { color: var(--danger) !important; border-color: rgba(248,113,113,0.3) !important; }
  .danger:hover { background: rgba(248,113,113,0.1) !important; }

  /* ── Toast ───────────────────────────────────────────────────── */
  .toast {
    position: fixed;
    bottom: calc(var(--nav-bot-h) + var(--sp-4));
    left: 50%;
    transform: translateX(-50%);
    z-index: var(--z-toast);
    padding: var(--sp-3) var(--sp-6);
    border-radius: var(--r-pill);
    font-weight: 600;
    font-size: var(--text-sm);
    white-space: nowrap;
    animation: fadeUp 0.25s var(--ease-spring);
    backdrop-filter: blur(8px);
  }
  .toast--success { background: rgba(74,222,128,0.2);  border: 1px solid rgba(74,222,128,0.4);  color: var(--success); }
  .toast--error   { background: rgba(248,113,113,0.2); border: 1px solid rgba(248,113,113,0.4); color: var(--danger); }
</style>
