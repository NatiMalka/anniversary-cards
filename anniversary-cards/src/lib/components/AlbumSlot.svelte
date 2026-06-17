<script>
  import { createEventDispatcher } from 'svelte';
  import CardFront from './CardFront.svelte';

  /** slot number 1–100 */
  export let n;
  /** collection entry or null */
  export let card = null;
  /** dim the empty placeholder (e.g. while a filter is active) */
  export let dim = false;
  /** interactive slots are clickable buttons that dispatch `open` */
  export let interactive = true;
  /** force the empty branch even when `card` is set (reveal: slot not landed yet) */
  export let hidden = false;
  /** show the "חדש" pill with a pop (reveal: just landed) */
  export let justRevealed = false;

  const dispatch = createEventDispatcher();
  $: filled = card && !hidden;
</script>

{#if filled}
  {#if interactive}
    <button class="slot slot--filled" data-slot={n} on:click={() => dispatch('open', card)}>
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
      {#if card.count > 1}
        <div class="slot-count">×{card.count}</div>
      {/if}
    </button>
  {:else}
    <div class="slot slot--filled slot--static" data-slot={n}>
      {#if justRevealed}
        <div class="new-badge-grid" dir="rtl">חדש</div>
      {/if}
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
      {#if card.count > 1}
        <div class="slot-count">×{card.count}</div>
      {/if}
    </div>
  {/if}
{:else}
  <div class="slot slot--empty" class:dim data-slot={n}>
    <span class="slot-num">{n}</span>
    <div class="empty-art"><div class="empty-diamond"></div></div>
  </div>
{/if}

<style>
  .slot { position: relative; aspect-ratio: 0.718; border-radius: 8px; overflow: visible; }
  .slot-num { position: absolute; top: 6px; right: 8px; z-index: 4; font-size: 0.65rem; font-weight: 700; color: rgba(255,255,255,0.55); letter-spacing: 0.04em; pointer-events: none; }

  .slot--empty { background: linear-gradient(145deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015)); border: 1px solid rgba(255,255,255,0.09); display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: default; transition: opacity 0.2s; }
  .slot--empty.dim { opacity: 0.3; }
  .empty-art { display: flex; align-items: center; justify-content: center; flex: 1; padding-bottom: 1rem; }
  .empty-diamond { width: 28%; aspect-ratio: 1; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); transform: rotate(45deg); border-radius: 3px; }

  .slot--filled { background: none; border: none; padding: 0; cursor: pointer; transition: transform 0.2s ease, filter 0.2s ease; }
  .slot--filled.slot--static { cursor: default; }
  .slot--filled:not(.slot--static):hover { transform: translateY(-4px) scale(1.03); filter: drop-shadow(0 8px 20px rgba(245,196,81,0.3)); z-index: 10; }
  .slot-card { width: 100%; height: 100%; pointer-events: none; }
  .slot--filled :global(.card) { pointer-events: none !important; }
  .slot-card :global(.card__shine), .slot-card :global(.card__glare) { display: none !important; }
  /* Thumbnails never flip — drop the (blue) back face so it can't z-fight the
     front during transforms (e.g. the album-reveal slide-in). */
  .slot-card :global(.card__back) { display: none !important; }
  /*
   * Thumbnails must NEVER animate. Card.svelte always renders an interactive
   * <button class="card__rotator"> (the AlbumSlot `interactive` prop is not
   * forwarded to Card), so a tap/scroll on a thumbnail can still fire the holo
   * springs — popover()/retreat() then resize and re-centre the card inside its
   * slot. We neutralise this at the source:
   *   1. pointer-events:none on the rotator so it can't be activated.
   *   2. transform:none on the transform layers so NO spring value (scale,
   *      translate, rotate — set inline by the engine) can ever take effect.
   * Overriding the transform directly is bulletproof: it beats the engine's
   * (non-important) `transform: …scale(var(--card-scale))` regardless of what
   * the inline CSS variables say.
   */
  .slot-card :global(.card__rotator) { pointer-events: none !important; }
  .slot-card :global(.card__translater),
  .slot-card :global(.card__rotator) { transform: none !important; }
  .slot-count { position: absolute; bottom: 6px; left: 6px; z-index: 5; font-size: 0.6rem; font-weight: 700; padding: 0.15em 0.45em; border-radius: 999px; background: rgba(0,0,0,0.55); color: var(--gold,#f5c451); pointer-events: none; }

  .new-badge-grid {
    position: absolute;
    top: -0.72rem;
    right: -0.38rem;
    z-index: 20;
    font-family: 'Heebo', sans-serif;
    font-size: 0.6rem;
    font-weight: 800;
    letter-spacing: 0.06em;
    white-space: nowrap;
    padding: 0.22em 0.6em;
    border-radius: 999px;
    background: linear-gradient(135deg, rgba(8,4,18,0.93), rgba(16,9,28,0.88));
    border: 1px solid rgba(245,196,81,0.6);
    color: #f5c451;
    box-shadow: 0 0 9px rgba(245,196,81,0.55), 0 2px 6px rgba(0,0,0,0.55);
    pointer-events: none;
    animation: newGridPop 0.44s cubic-bezier(0.2, 0.9, 0.3, 1.4) both;
  }
  @keyframes newGridPop {
    from { opacity: 0; transform: scale(0.3) translateY(-6px); }
    to   { opacity: 1; transform: scale(1)   translateY(0);    }
  }
  @media (prefers-reduced-motion: reduce) {
    .new-badge-grid { animation: none; opacity: 1; }
  }
</style>
