<script>
  import { CalendarDays, Gift, CheckCircle2 } from '@lucide/svelte';
  import { freePacks } from '$lib/stores/wallet.js';

  /** @type {number} */
  export let freeLeft;
  /** @type {number} */
  export let dailyDone;
  /** @type {number} */
  export let dailyTotal;
</script>

<section class="today" aria-labelledby="today-heading">
  <h2 class="heading" id="today-heading">
    <CalendarDays size={16} strokeWidth={2} aria-hidden="true" />
    הפעולות שלך להיום
  </h2>

  <div class="grid">
    <article class="stat-card dashboard-card">
      <div class="card-head">
        <span class="icon icon-gold" aria-hidden="true">
          <Gift size={18} strokeWidth={2} />
        </span>
        <span class="card-label">חבילות חינם</span>
      </div>
      <p class="value" aria-label="{freeLeft} מתוך {freePacks.FREE_PER_DAY} חבילות חינמיות">
        {freeLeft}<small>/{freePacks.FREE_PER_DAY}</small>
      </p>
      <p class="sub">נשארו להיום</p>
      <a href="/packs" class="btn btn-gold btn-sm btn-full action">פתח חבילה</a>
    </article>

    <article class="stat-card dashboard-card">
      <div class="card-head">
        <span class="icon icon-silver" aria-hidden="true">
          <CheckCircle2 size={18} strokeWidth={2} />
        </span>
        <span class="card-label">משימות יומיות</span>
      </div>
      <p class="value" aria-label="{dailyDone} מתוך {dailyTotal} משימות הושלמו">
        <span class:done={dailyDone > 0 && dailyDone === dailyTotal}>{dailyDone}</span><small>/{dailyTotal || '–'}</small>
      </p>
      <p class="sub">הושלמו להיום</p>
      <a href="/tasks" class="btn btn-glass btn-sm btn-full action">ראה משימות</a>
    </article>
  </div>
</section>

<style>
  .today {
    display: flex;
    flex-direction: column;
    gap: var(--sp-3);
    animation: fadeUp 0.5s var(--ease-out) 0.18s both;
  }

  .heading {
    margin: 0;
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    font-family: 'Heebo', system-ui, sans-serif;
    font-size: var(--text-xs);
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--ink-dim);
  }

  .heading :global(svg) {
    color: var(--gold-dim);
    flex-shrink: 0;
  }

  .grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--sp-3);
  }

  @media (min-width: 480px) {
    .grid {
      grid-template-columns: 1fr 1fr;
    }
  }

  .stat-card {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    padding: var(--sp-4);
    min-height: 100%;
  }

  @media (max-width: 520px) {
    .today {
      gap: var(--sp-2);
    }

    .heading {
      font-size: 0.68rem;
    }

    .grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--sp-2);
    }

    .stat-card {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: var(--sp-2);
      padding: var(--sp-3);
      min-height: 9rem;
    }

    .card-head {
      justify-content: space-between;
      gap: var(--sp-1);
    }

    .icon {
      width: 1.75rem;
      height: 1.75rem;
    }

    .card-label {
      font-size: var(--text-xs);
      line-height: 1.25;
    }

    .value {
      font-size: var(--text-3xl);
      text-align: right;
    }

    .sub {
      margin-top: 0;
    }

    .action {
      width: 100%;
      min-width: 0;
      margin-top: 0;
      padding-inline: var(--sp-3);
    }
  }

  .card-head {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
  }

  .icon {
    display: grid;
    place-items: center;
    width: 2rem;
    height: 2rem;
    border-radius: var(--r-sm);
    flex-shrink: 0;
  }

  .icon-gold {
    background: rgba(245, 196, 81, 0.12);
    color: var(--gold);
  }

  .icon-silver {
    background: rgba(200, 200, 212, 0.1);
    color: var(--silver);
  }

  .card-label {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--ink-mid);
  }

  .value {
    margin: 0;
    font-size: var(--text-4xl);
    font-weight: 700;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    color: var(--ink);
  }

  .value small {
    font-size: 0.45em;
    font-weight: 400;
    color: var(--ink-dim);
  }

  .value .done {
    color: var(--success);
  }

  .sub {
    margin: 0;
    font-size: var(--text-xs);
    color: var(--ink-dim);
    margin-top: auto;
  }

  .action {
    margin-top: var(--sp-1);
  }

  @media (prefers-reduced-motion: reduce) {
    .today {
      animation: none;
    }
  }
</style>
