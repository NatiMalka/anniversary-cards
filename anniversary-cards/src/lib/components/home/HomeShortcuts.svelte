<script>
  import { Sparkles, ListChecks, BookOpen, Settings } from '@lucide/svelte';
  import { isAdmin } from '$lib/stores/user.js';

  const links = [
    { href: '/anniversary', label: 'יום נישואין', icon: Sparkles },
    { href: '/tasks', label: 'משימות', icon: ListChecks },
    { href: '/album', label: 'אלבום', icon: BookOpen }
  ];
</script>

<nav class="shortcuts" aria-label="קיצורי דרך">
  {#each links as item}
    <a class="shortcut dashboard-card" href={item.href}>
      <span class="shortcut-icon" aria-hidden="true">
        <svelte:component this={item.icon} size={20} strokeWidth={2} />
      </span>
      <span class="shortcut-label">{item.label}</span>
    </a>
  {/each}
  {#if $isAdmin}
    <a class="shortcut dashboard-card admin" href="/admin">
      <span class="shortcut-icon" aria-hidden="true">
        <Settings size={20} strokeWidth={2} />
      </span>
      <span class="shortcut-label">ניהול</span>
    </a>
  {/if}
</nav>

<style>
  .shortcuts {
    display: none;
    grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr));
    gap: var(--sp-3);
    animation: fadeUp 0.5s var(--ease-out) 0.32s both;
  }

  @media (min-width: 640px) {
    .shortcuts {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(7.5rem, 1fr));
    }
  }

  .shortcut {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--sp-2);
    padding: var(--sp-4) var(--sp-3);
    min-height: 5.5rem;
    text-decoration: none;
    color: var(--ink);
    transition: transform 0.2s var(--ease-out), border-color 0.2s ease;
  }

  .shortcut:hover {
    transform: translateY(-2px);
    border-color: rgba(245, 196, 81, 0.28);
  }

  .shortcut:focus-visible {
    outline: 2px solid var(--gold-muted);
    outline-offset: 2px;
  }

  .shortcut-icon {
    display: grid;
    place-items: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: var(--r-md);
    background: rgba(255, 255, 255, 0.04);
    color: var(--silver);
  }

  .shortcut:hover .shortcut-icon {
    color: var(--gold);
    background: rgba(245, 196, 81, 0.1);
  }

  .admin .shortcut-icon {
    color: var(--gold-dim);
  }

  .shortcut-label {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--ink-dim);
    text-align: center;
  }

  .shortcut:hover .shortcut-label {
    color: var(--ink);
  }

  @media (prefers-reduced-motion: reduce) {
    .shortcuts {
      animation: none;
    }
    .shortcut {
      transition: none;
    }
  }
</style>
