<script>
  import { BookHeart, ChevronLeft } from '@lucide/svelte';

  /** @type {number} */
  export let collected;
  /** @type {number} */
  export let pct;

  $: empty = collected === 0;
</script>

<a href="/album" class="album dashboard-card" aria-label="האלבום שלנו, {Math.round(pct)}% התקדמות">
  <div class="head">
    <span class="icon" aria-hidden="true">
      <BookHeart size={20} strokeWidth={2} />
    </span>
    <div class="copy">
      <span class="title">המסע שלנו</span>
      <span class="sub">
        {#if empty}
          עדיין אין קלפים — פתחי חבילה ראשונה
        {:else}
          {collected} מתוך 100 קלפים
        {/if}
      </span>
    </div>
    <span class="pct">{Math.round(pct)}%</span>
  </div>

  <div
    class="track"
    role="progressbar"
    aria-valuenow={Math.round(pct)}
    aria-valuemin="0"
    aria-valuemax="100"
    aria-label="התקדמות האלבום"
  >
    <div class="fill" style="width:{Math.min(100, pct)}%"></div>
  </div>

  <span class="link-hint">
    לאלבום
    <ChevronLeft size={14} strokeWidth={2.5} aria-hidden="true" />
  </span>
</a>

<style>
  .album {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
    padding: var(--sp-5);
    text-decoration: none;
    color: var(--ink);
    animation: fadeUp 0.5s var(--ease-out) 0.25s both;
    transition: transform 0.22s var(--ease-out), border-color 0.22s ease;
  }

  @media (max-width: 520px) {
    .album {
      gap: var(--sp-3);
      padding: var(--sp-3);
    }

    .head {
      align-items: center;
      gap: var(--sp-2);
    }

    .icon {
      width: 2.1rem;
      height: 2.1rem;
    }

    .title {
      font-size: var(--text-base);
    }

    .sub {
      font-size: var(--text-xs);
      line-height: 1.25;
    }

    .pct {
      font-size: var(--text-xl);
    }

    .track {
      height: 4px;
    }

    .link-hint {
      font-size: 0.68rem;
    }
  }

  .album:hover {
    transform: translateY(-2px);
    border-color: rgba(232, 77, 107, 0.28);
  }

  .album:focus-visible {
    outline: 2px solid var(--heart);
    outline-offset: 3px;
  }

  .head {
    display: flex;
    align-items: flex-start;
    gap: var(--sp-3);
  }

  .icon {
    display: grid;
    place-items: center;
    width: 2.75rem;
    height: 2.75rem;
    border-radius: 50%;
    flex-shrink: 0;
    background: rgba(232, 77, 107, 0.12);
    border: 1px solid rgba(232, 77, 107, 0.2);
    color: var(--heart);
  }

  .copy {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .title {
    font-family: 'Frank Ruhl Libre', serif;
    font-size: var(--text-lg);
    font-weight: 700;
    line-height: 1.2;
  }

  .sub {
    font-size: var(--text-sm);
    color: var(--ink-dim);
    line-height: 1.4;
  }

  .pct {
    font-size: var(--text-2xl);
    font-weight: 700;
    color: var(--gold);
    font-variant-numeric: tabular-nums;
    line-height: 1;
    flex-shrink: 0;
  }

  .track {
    height: 6px;
    border-radius: var(--r-pill);
    background: rgba(255, 255, 255, 0.06);
    overflow: hidden;
  }

  .fill {
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, var(--gold-dim), var(--gold), var(--gold-bright));
    box-shadow: 0 0 12px var(--gold-glow);
    transition: width 0.6s var(--ease-out);
  }

  .link-hint {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    align-self: flex-start;
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--gold-dim);
  }

  .album:hover .link-hint {
    color: var(--gold);
  }

  @media (prefers-reduced-motion: reduce) {
    .album {
      animation: none;
      transition: none;
    }
    .fill {
      transition: none;
    }
  }
</style>
