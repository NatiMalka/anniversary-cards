<script>
  import { browser } from '$app/environment';
  import { user, isAdmin } from '$lib/stores/user.js';
  import { wallet, freePacks } from '$lib/stores/wallet.js';
  import { collectedCount } from '$lib/stores/collection.js';
  import { dailyTasks, completions } from '$lib/stores/tasks.js';
  import { anniversaryStats } from '$lib/packs.js';
  import PackFocusOverlay from '$lib/components/PackFocusOverlay.svelte';
  import PackSelectorRow from '$lib/components/PackSelectorRow.svelte';
  import HomeHero from '$lib/components/home/HomeHero.svelte';
  import HomeTodaySection from '$lib/components/home/HomeTodaySection.svelte';
  import HomeAlbumProgress from '$lib/components/home/HomeAlbumProgress.svelte';
  import HomeShortcuts from '$lib/components/home/HomeShortcuts.svelte';
  import { RefreshCw } from '@lucide/svelte';

  const { years, days } = anniversaryStats();

  let focusedPack = null;

  $: freeLeft   = browser ? freePacks.remaining($user.id) : freePacks.FREE_PER_DAY;
  $: dailyDone  = $dailyTasks.filter(/** @param {any} t */ t => $completions[completions.key(t, $user.id)]).length;
  $: dailyTotal = $dailyTasks.length;
  $: albumPct   = ($collectedCount / 100) * 100;
</script>

<svelte:head><title>בית — עשור של אהבה</title></svelte:head>

{#if focusedPack}
  <PackFocusOverlay pack={focusedPack} on:close={() => focusedPack = null} />
{/if}

<div class="page home">
  <HomeHero {days} {years} />

  <div class="dashboard">
    <section class="packs-panel" aria-label="חבילות">
      <PackSelectorRow hint={undefined} on:select={(e) => (focusedPack = e.detail)} />

      {#if $isAdmin}
        <div class="admin-tools">
          <button
            type="button"
            class="btn btn-ghost btn-sm refill-btn"
            on:click={() => wallet.reset($user.id)}
            aria-label="מלא לבבות לבדיקה"
          >
            <RefreshCw size={14} strokeWidth={2} aria-hidden="true" />
            מלא לבבות לבדיקה
          </button>
        </div>
      {/if}
    </section>

    <HomeTodaySection {freeLeft} {dailyDone} {dailyTotal} />
  </div>

  <HomeAlbumProgress collected={$collectedCount} pct={albumPct} />

  <HomeShortcuts />
</div>

<style>
  .home {
    display: flex;
    flex-direction: column;
    gap: var(--sp-3);
  }

  .dashboard {
    width: 100%;
    max-width: 820px;
    margin-inline: auto;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sp-3);
  }

  .packs-panel {
    display: flex;
    flex-direction: column;
    gap: var(--sp-3);
    padding: var(--sp-4);
    border: 1px solid rgba(245, 196, 81, 0.12);
    border-radius: var(--r-xl);
    background:
      radial-gradient(ellipse 60% 50% at 50% 0%, rgba(245, 196, 81, 0.09), transparent 62%),
      rgba(255, 255, 255, 0.025);
    animation: fadeUp 0.55s var(--ease-out) 0.1s both;
  }

  @media (max-width: 520px) {
    .packs-panel {
      gap: var(--sp-2);
      padding: var(--sp-3);
      margin-inline: calc(-1 * var(--sp-1));
      border-radius: var(--r-lg);
    }
  }

  .admin-tools {
    display: flex;
    justify-content: center;
  }

  .refill-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-2);
    font-size: var(--text-xs);
    opacity: 0.65;
    border-style: dashed;
  }

  .refill-btn:hover {
    opacity: 1;
  }

  @media (min-width: 640px) {
    .home,
    .dashboard {
      gap: var(--sp-6);
    }

    .packs-panel {
      gap: var(--sp-4);
      padding: var(--sp-5);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .packs-panel {
      animation: none;
    }
  }
</style>
