<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { user, isAdmin } from '$lib/stores/user.js';
  import { wallet, freePacks } from '$lib/stores/wallet.js';
  import { PACK_TYPES } from '$lib/packs.js';
  import { loadPool } from '$lib/stores/cardPool.js';
  import PackFocusOverlay from '$lib/components/PackFocusOverlay.svelte';
  import PackSelectorRow from '$lib/components/PackSelectorRow.svelte';
  import { RefreshCw } from '@lucide/svelte';

  const initType = $page.url.searchParams.get('type');
  let focusedPack = initType && PACK_TYPES[initType] ? PACK_TYPES[initType] : null;
  let sound = true;

  // Warm the card pool as soon as the packs page loads, so opening a pack is
  // instant (no blocking fetch on the "open" tap — this was the slow regression).
  onMount(() => { loadPool(); });

  $: free   = freePacks.remaining($user.id);
  $: hearts = wallet.balance($user.id);
</script>

<svelte:head><title>חבילות — עשור של אהבה</title></svelte:head>

{#if focusedPack}
  <PackFocusOverlay pack={focusedPack} {sound} on:close={() => focusedPack = null} />
{/if}

<div class="page">
  <header class="pack-header">
    <h1>חבילות</h1>
    <div class="header-pills">
      {#if free > 0}
        <span class="pill pill-free" aria-label="{free} חבילות חינמיות">{free} חינם</span>
      {/if}
      <span class="pill pill-hearts" aria-label="{hearts} לבבות">{hearts} ♥</span>
      {#if $isAdmin}
        <button class="pill pill-refill" on:click={() => wallet.reset($user.id)} aria-label="מלא לבבות לבדיקה">
          <RefreshCw size={12} strokeWidth={2} aria-hidden="true" />
        </button>
      {/if}
    </div>
  </header>

  <PackSelectorRow hint="בחרי חבילה לפתיחה" on:select={(e) => (focusedPack = e.detail)} />

  <label class="sound-row">
    <input type="checkbox" bind:checked={sound} />
    <span>צלילים</span>
  </label>
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
  }

  .pack-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    animation: fadeUp 0.45s var(--ease-out) 0.04s both;
  }

  .pack-header h1 {
    font-size: var(--text-2xl);
    font-family: 'Frank Ruhl Libre', serif;
    margin: 0;
  }

  .header-pills {
    display: flex;
    gap: var(--sp-2);
    align-items: center;
  }

  .pill {
    display: inline-flex;
    align-items: center;
    gap: 0.3em;
    font-size: var(--text-xs);
    font-weight: 600;
    padding: 0.28em 0.8em;
    border-radius: var(--r-pill);
    border: 1px solid transparent;
    line-height: 1.4;
  }

  .pill-free {
    background: rgba(245, 196, 81, 0.1);
    border-color: rgba(245, 196, 81, 0.2);
    color: var(--gold);
  }

  .pill-hearts {
    background: rgba(232, 77, 107, 0.1);
    border-color: rgba(232, 77, 107, 0.2);
    color: var(--heart);
  }

  .pill-refill {
    background: none;
    border-style: dashed;
    border-color: rgba(255, 255, 255, 0.15);
    color: var(--ink-dim);
    cursor: pointer;
    opacity: 0.55;
    padding: 0.35em 0.55em;
  }

  .pill-refill:hover {
    opacity: 1;
    color: var(--ink);
  }

  .sound-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--sp-2);
    font-size: var(--text-sm);
    color: var(--ink-dim);
    cursor: pointer;
  }

  .sound-row input {
    cursor: pointer;
    accent-color: var(--gold);
  }

  @media (prefers-reduced-motion: reduce) {
    .pack-header {
      animation: none;
    }
  }
</style>
