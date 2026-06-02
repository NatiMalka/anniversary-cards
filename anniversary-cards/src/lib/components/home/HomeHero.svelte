<script>
  import { CalendarHeart } from '@lucide/svelte';

  /** @type {number} */
  export let days;
  /** @type {number} */
  export let years;
</script>

<a href="/anniversary" class="hero" aria-label="דף השנה — {days.toLocaleString('he-IL')} ימים יחד">
  <p class="eyebrow">עשור של אהבה</p>
  <h1 class="couple">
    <span class="n-gold">נתנאל</span>
    <span class="amp">&amp;</span>
    <span class="n-silver">אלמוג אסתר</span>
  </h1>
  <div class="meta">
    <span class="meta-stat">
      <strong>{days.toLocaleString('he-IL')}</strong>
      <span>ימים יחד</span>
    </span>
    <span class="meta-divider" aria-hidden="true"></span>
    <span class="meta-badge">
      <CalendarHeart size={14} strokeWidth={2} aria-hidden="true" />
      <span>{years} שנים</span>
    </span>
  </div>
</a>

<style>
  .hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--sp-2);
    text-align: center;
    text-decoration: none;
    color: inherit;
    padding: var(--sp-2) var(--sp-3) var(--sp-4);
    border-radius: var(--r-xl);
    transition: background 0.2s ease;
    animation: fadeUp 0.45s var(--ease-out) 0.04s both;
  }

  .hero:hover {
    background: rgba(245, 196, 81, 0.04);
  }

  .hero:focus-visible {
    outline: 2px solid var(--gold-muted);
    outline-offset: 4px;
  }

  .eyebrow {
    margin: 0;
    font-size: var(--text-xs);
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--ink-dim);
  }

  .couple {
    margin: 0;
    display: flex;
    align-items: baseline;
    justify-content: center;
    flex-wrap: wrap;
    gap: 0.35em;
    font-family: 'Frank Ruhl Libre', serif;
    font-size: clamp(2rem, 7vw, 3rem);
    font-weight: 700;
    line-height: 1.15;
    text-wrap: balance;
  }

  .n-gold {
    color: var(--gold);
  }

  .n-silver {
    color: var(--silver);
  }

  .amp {
    color: var(--ink-dim);
    font-weight: 300;
    font-size: 0.5em;
  }

  .meta {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    flex-wrap: wrap;
    justify-content: center;
  }

  .meta-stat {
    display: flex;
    align-items: baseline;
    gap: 0.35em;
    font-size: var(--text-sm);
    color: var(--ink-dim);
  }

  .meta-stat strong {
    font-size: var(--text-lg);
    font-weight: 700;
    color: var(--ink);
    font-variant-numeric: tabular-nums;
  }

  .meta-divider {
    width: 1px;
    height: 1.25rem;
    background: rgba(245, 196, 81, 0.25);
  }

  .meta-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.35em;
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--gold-dim);
    background: rgba(245, 196, 81, 0.1);
    border: 1px solid rgba(245, 196, 81, 0.2);
    border-radius: var(--r-pill);
    padding: 0.3em 0.75em;
  }

  .meta-badge :global(svg) {
    color: var(--gold);
    flex-shrink: 0;
  }

  @media (max-width: 520px) {
    .hero {
      gap: var(--sp-1);
      padding: 0 var(--sp-2) var(--sp-2);
    }

    .eyebrow {
      font-size: 0.65rem;
      letter-spacing: 0.12em;
    }

    .couple {
      font-size: clamp(1.65rem, 7.5vw, 2.1rem);
      line-height: 1.05;
    }

    .meta {
      gap: var(--sp-2);
    }

    .meta-stat,
    .meta-badge {
      font-size: var(--text-xs);
    }

    .meta-stat strong {
      font-size: var(--text-sm);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .hero {
      animation: none;
    }
  }
</style>
