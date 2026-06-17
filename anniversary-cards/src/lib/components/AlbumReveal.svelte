<script>
  import { createEventDispatcher, onMount, onDestroy, tick } from 'svelte';
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import { collection } from '$lib/stores/collection.js';
  import AlbumSlot from './AlbumSlot.svelte';
  import CardFront from './CardFront.svelte';
  import { playFlip } from '$lib/sound.js';

  /** the NEW cards to land, in order (each carries cardNumber) */
  export let newCards = [];
  /** parallel array of source rects {left,top,width,height} from the summary grid */
  export let sourceRects = [];
  export let sound = true;

  const dispatch = createEventDispatcher();
  const TOTAL = 100;
  const ALL_SLOTS = Array.from({ length: TOTAL }, (_, i) => i + 1);

  const newCardNumbers = new Set(newCards.map((c) => c.cardNumber));
  let revealedSlots = new Set();
  let animationDone = false;
  let flying = null;        // card object currently in flight
  let from = null;          // source rect
  let to = null;            // target rect
  let rootEl;               // scroll container
  const t = tweened(0, { duration: 620, easing: cubicOut });

  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let timers = [];
  const wait = (ms) => new Promise((res) => timers.push(setTimeout(res, ms)));

  // Pure-translate flight (GPU-composited — no per-frame layout/repaint):
  // the clone is sized to the TARGET slot and stays at scale 1 the whole time,
  // so it never shrinks/grows — it just slides from the source position into the
  // slot, filling it at full size from takeoff to landing.
  $: flyStyle = (() => {
    if (!(flying && from && to)) return '';
    const tx = (from.left - to.left) * (1 - $t);
    const ty = (from.top - to.top) * (1 - $t);
    return (
      `left:${to.left}px; top:${to.top}px; width:${to.width}px; height:${to.height}px;` +
      `transform: translate(${tx}px, ${ty}px);`
    );
  })();

  onMount(async () => {
    await tick();
    for (let i = 0; i < newCards.length; i++) {
      const num = newCards[i].cardNumber;
      const slotEl = rootEl?.querySelector(`[data-slot="${num}"]`);

      if (slotEl) {
        slotEl.scrollIntoView({ block: 'center', behavior: prefersReduced ? 'auto' : 'smooth' });
        await wait(prefersReduced ? 0 : 420);

        const box = (slotEl.querySelector('.slot-card') ?? slotEl).getBoundingClientRect();
        to = { left: box.left, top: box.top, width: box.width, height: box.height };
        from = sourceRects[i] ?? to;
      }

      if (prefersReduced || !slotEl) {
        revealedSlots = new Set(revealedSlots).add(num);
        if (sound) playFlip();
        await wait(prefersReduced ? 220 : 0);
      } else {
        flying = $collection[String(num)] ?? newCards[i];
        await t.set(0, { duration: 0 });
        await tick();
        await t.set(1);
        revealedSlots = new Set(revealedSlots).add(num);
        await wait(60);
        flying = null;
        if (sound) playFlip();
        await wait(180);
      }
    }
    await wait(prefersReduced ? 300 : 400);
    animationDone = true;
  });

  onDestroy(() => timers.forEach(clearTimeout));
</script>

<div class="reveal" bind:this={rootEl}>
  <header class="reveal-head">
    <h2>נכנס לאלבום…</h2>
    <p>{revealedSlots.size} / {newCards.length} קלפים חדשים</p>
  </header>

  <div class="grid">
    {#each ALL_SLOTS as n}
      <AlbumSlot
        {n}
        card={$collection[String(n)] ?? null}
        interactive={false}
        hidden={newCardNumbers.has(n) && !revealedSlots.has(n)}
        justRevealed={revealedSlots.has(n) && newCardNumbers.has(n)}
      />
    {/each}
  </div>
</div>

{#if animationDone}
  <div class="continue-bar">
    <button class="btn-continue" dir="rtl" on:click={() => dispatch('done')}>המשך ←</button>
  </div>
{/if}

{#if flying}
  <div class="flying-card" style={flyStyle}>
    <CardFront
      effect={flying.effect}
      photo={flying.photo}
      title={flying.title}
      date={flying.date}
      description={flying.description}
      rarityTier={flying.rarityTier}
      isFlat={flying.isFlat}
      showFrame={flying.showFrame ?? false}
      frameColor={flying.frameColor ?? '#f5c451'}
    />
  </div>
{/if}

<style>
  .reveal {
    position: fixed;
    inset: 0;
    z-index: 9100;
    overflow-y: auto;
    background: var(--bg-0, #050505);
    padding: clamp(1rem, 3vw, 2rem);
    padding-top: calc(var(--nav-top-h, 0px) + clamp(1rem, 3vw, 2rem));
    padding-bottom: 3rem;
  }

  .reveal-head { text-align: center; margin: 0 auto 1.5rem; max-width: 1300px; }
  .reveal-head h2 {
    margin: 0;
    font-family: 'Frank Ruhl Libre', serif;
    font-size: clamp(1.4rem, 4vw, 2.1rem);
    background: linear-gradient(135deg, #c89a1a, #f5c451);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .reveal-head p { margin: 0.35rem 0 0; color: var(--ink-dim, #b9b2ab); font-size: 0.95rem; }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: clamp(0.6rem, 1.5vw, 1.25rem);
    max-width: 1300px;
    margin: 0 auto;
  }

  .flying-card {
    position: fixed;
    z-index: 9999;
    aspect-ratio: 0.718;
    transform-origin: top left;
    pointer-events: none;
    filter: drop-shadow(0 14px 32px rgba(0, 0, 0, 0.6))
      drop-shadow(0 0 18px rgba(245, 196, 81, 0.35));
    will-change: transform;
  }
  .flying-card :global(.card) { width: 100% !important; height: 100% !important; }
  /* The .flying-card wrapper owns the slide transform. The inner holo engine
     must stay at identity so its springs can't resize/recentre the clone. */
  .flying-card :global(.card__rotator) { pointer-events: none !important; }
  .flying-card :global(.card__translater),
  .flying-card :global(.card__rotator) { transform: none !important; }
  .flying-card :global(.card__shine),
  .flying-card :global(.card__glare),
  .flying-card :global(.card__back) { display: none !important; }

  @media (max-width: 480px) {
    .grid { grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 0.5rem; }
  }

  .continue-bar {
    position: fixed;
    bottom: calc(var(--nav-bottom-h, 60px) + 1rem);
    left: 50%;
    transform: translateX(-50%);
    z-index: 9200;
    animation: fadeUp 0.4s cubic-bezier(0.2, 0.9, 0.3, 1.3) both;
  }
  .btn-continue {
    font-family: 'Heebo', sans-serif;
    font-size: 1.05rem;
    font-weight: 700;
    padding: 0.7em 2.2em;
    border-radius: 999px;
    border: 1.5px solid rgba(245, 196, 81, 0.7);
    background: linear-gradient(135deg, #c89a1a, #f5c451);
    color: #080412;
    cursor: pointer;
    box-shadow: 0 4px 24px rgba(245, 196, 81, 0.35), 0 2px 8px rgba(0, 0, 0, 0.5);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    white-space: nowrap;
  }
  .btn-continue:hover { transform: translateY(-2px) scale(1.04); box-shadow: 0 8px 32px rgba(245, 196, 81, 0.5); }
  .btn-continue:active { transform: scale(0.97); }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateX(-50%) translateY(12px); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
</style>
