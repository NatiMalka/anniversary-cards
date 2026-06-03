<script>
  import { PACK_ORDER, PACK_TYPES } from '$lib/packs.js';
  import { createEventDispatcher } from 'svelte';

  /** @type {'compact' | 'default'} */
  export let size = 'default';
  /** @type {string | undefined} */
  export let hint = undefined;

  const dispatch = createEventDispatcher();

  const SPRITE_POSITIONS = {
    regular: '0% 50%',
    rare: '50% 50%',
    legendary: '100% 50%'
  };

  const TILT_DELAYS = {
    regular: '-2.4s',
    rare: '-4.8s',
    legendary: '0s'
  };

  const PHASES = {
    regular: 1.7,
    rare: 3.4,
    legendary: 0
  };

  function packMotion(node, id) {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return {};

    let raf;
    const phase = PHASES[id] ?? 0;
    const speed = 0.00042;

    const tick = (time) => {
      const t = time * speed + phase;
      const x = 50 + Math.sin(t) * 46;
      const y = 50 + Math.cos(t * 0.92) * 44;
      const bgX = 50 + Math.sin(t * 0.74 + 0.8) * 18;
      const bgY = 50 + Math.cos(t * 0.68 + 0.4) * 18;
      const center = Math.min(1, Math.hypot(x - 50, y - 50) / 50);
      const floatY = Math.sin(t * 0.9) * -3.5;

      node.style.setProperty('--pointer-x', `${x.toFixed(2)}%`);
      node.style.setProperty('--pointer-y', `${y.toFixed(2)}%`);
      node.style.setProperty('--background-x', `${bgX.toFixed(2)}%`);
      node.style.setProperty('--background-y', `${bgY.toFixed(2)}%`);
      node.style.setProperty('--pointer-from-center', center.toFixed(3));
      node.style.setProperty('--pointer-from-top', (y / 100).toFixed(3));
      node.style.setProperty('--pointer-from-left', (x / 100).toFixed(3));
      node.style.setProperty('--card-opacity', (0.74 + center * 0.18).toFixed(3));
      node.style.transform = `translateY(${floatY.toFixed(2)}px)`;

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return {
      destroy() {
        cancelAnimationFrame(raf);
      }
    };
  }
</script>

<section class="pack-selector" class:compact={size === 'compact'} aria-label="חבילות">
  {#if hint}
    <p class="hint">{hint}</p>
  {/if}
  <div class="grid">
    {#each PACK_ORDER as id}
      {@const pk = PACK_TYPES[id]}
      <button
        type="button"
        class="tile"
        class:center={pk.center}
        style="--glow:{pk.glow}; --tilt-delay:{TILT_DELAYS[pk.id]};"
        aria-label="חבילה {pk.label}, {pk.cost} לבבות"
        on:click={() => dispatch('select', pk)}
      >
        <div
          class="frame card interactive"
          data-rarity="rare ultra"
          data-supertype="trainer"
          data-subtypes="supporter"
          data-trainer-gallery="false"
          data-set=""
          data-number=""
          style="--pack-position:{SPRITE_POSITIONS[pk.id]};"
          use:packMotion={pk.id}
        >
          <div class="card__translater">
            <div class="card__rotator">
              <div class="card__front">
                <span class="pack-art" aria-hidden="true"></span>
                <div class="card__shine"></div>
                <div class="card__glare"></div>
              </div>
            </div>
          </div>
        </div>
      </button>
    {/each}
  </div>
</section>

<style>
  .pack-selector {
    display: flex;
    flex-direction: column;
    gap: var(--sp-3);
  }

  .hint {
    margin: 0;
    text-align: center;
    font-size: var(--text-sm);
    color: var(--ink-dim);
  }

  .grid {
    width: 100%;
    max-width: 620px;
    margin-inline: auto;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: clamp(var(--sp-1), 2.5vw, var(--sp-5));
    align-items: end;
    padding-top: var(--sp-2);
  }

  .compact .grid {
    max-width: 540px;
    gap: var(--sp-1);
    padding-top: var(--sp-2);
  }

  .tile {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
    transition: transform 0.28s var(--ease-out);
  }

  .tile:hover {
    transform: translateY(-6px);
  }

  .tile:focus-visible {
    outline: 2px solid rgba(245, 196, 81, 0.6);
    outline-offset: 4px;
    border-radius: var(--r-sm);
  }

  .tile.center {
    margin-bottom: var(--sp-2);
    z-index: 2;
  }

  .tile.center:hover {
    transform: translateY(-8px);
  }

  .compact .tile.center {
    margin-bottom: 14px;
  }

  .compact .tile.center:hover {
    transform: translateY(-6px);
  }

  .frame {
    position: relative;
    width: 100%;
    aspect-ratio: 0.706;
    border-radius: var(--r-sm);
    overflow: hidden;
    background: var(--bg-1);
    box-shadow: 0 14px 28px -20px var(--glow);
    isolation: isolate;
    transform-origin: 50% 85%;
    --card-aspect: 0.706;
    --card-radius: var(--r-sm);
    --card-scale: 1;
    --card-opacity: 0.92;
    --pointer-x: 30%;
    --pointer-y: 18%;
    --background-x: 38%;
    --background-y: 36%;
    --pointer-from-center: 0.75;
    --pointer-from-top: 0.18;
    --pointer-from-left: 0.3;
    --translate-x: 0px;
    --translate-y: 0px;
    --rotate-x: 0deg;
    --rotate-y: 0deg;
  }

  .tile.center .frame {
    box-shadow: 0 18px 34px -18px var(--glow);
  }

  .pack-art {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    border-radius: inherit;
    background-image: url('/pack-images.png');
    background-repeat: no-repeat;
    background-size: 300% 100%;
    background-position: var(--pack-position);
    image-rendering: auto;
    transform: none;
    z-index: 0;
  }

  .frame :global(.card__translater),
  .frame :global(.card__rotator),
  .frame :global(.card__front) {
    width: 100%;
    height: 100%;
    aspect-ratio: var(--card-aspect);
    border-radius: inherit;
    pointer-events: none;
  }

  .frame :global(.card__rotator) {
    transform: rotateY(var(--rotate-x)) rotateX(var(--rotate-y));
  }

  .frame :global(.card__front),
  .frame :global(.card__front *) {
    overflow: hidden;
  }

  @media (max-width: 520px) {
    .pack-selector {
      gap: var(--sp-1);
    }

    .grid {
      max-width: 380px;
      gap: var(--sp-1);
      padding-top: 0;
    }

    .tile:hover,
    .tile.center:hover {
      transform: none;
    }

    .tile.center {
      margin-bottom: var(--sp-1);
    }

    .frame {
      border-radius: 6px;
      box-shadow: 0 10px 20px -18px var(--glow);
    }
  }

  @media (min-width: 640px) {
    .grid {
      padding-top: var(--sp-5);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .tile,
    .tile.center {
      transition: none;
    }
    .tile:hover,
    .tile.center:hover {
      transform: none;
    }

    .frame {
      transform: none !important;
    }
  }
</style>
