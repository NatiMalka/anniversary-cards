<script>
  import '../app.css';
  import { page } from '$app/stores';
  import { user, isAdmin } from '$lib/stores/user.js';
  import { wallet, freePacks, initWallet } from '$lib/stores/wallet.js';
  import { browser } from '$app/environment';
  import { Gift, Heart, UserRound } from '@lucide/svelte';

  // Sync wallet store from server data on every navigation
  $: if (browser && $page.data.wallet) initWallet($page.data.wallet);

  $: hearts   = browser ? wallet.balance($user.id) : 0;
  $: freeLeft = browser ? freePacks.remaining($user.id) : freePacks.FREE_PER_DAY;

  const baseNav = [
    { href: '/',      label: 'בית',    icon: 'home'  },
    { href: '/packs', label: 'חבילות', icon: 'pack'  },
    { href: '/album', label: 'אלבום',  icon: 'album' },
    { href: '/tasks', label: 'משימות', icon: 'tasks' },
  ];
  const adminNav = { href: '/admin', label: 'ניהול', icon: 'admin' };

  $: navItems = $isAdmin ? [...baseNav, adminNav] : baseNav;
  $: path = $page.url.pathname;
  $: isLogin = path === '/login';
</script>

<!-- ── Top bar ──────────────────────────────────────────────── -->
{#if !isLogin}
<header class="top-bar">
  <a class="brand" href="/">
    <span class="brand-decade">עשור</span>
    <span class="brand-of">של</span>
    <span class="brand-love">אהבה</span>
  </a>

  <!-- Desktop primary nav (mobile uses the bottom tab bar) -->
  <nav class="top-nav" aria-label="ניווט ראשי">
    {#each navItems as item}
      <a
        class="top-nav-link"
        class:active={path === item.href || (item.href !== '/' && path.startsWith(item.href))}
        href={item.href}
      >{item.label}</a>
    {/each}
  </nav>

  <div class="top-right">
    <div class="wallet-display">
      {#if freeLeft > 0}
        <span class="free-badge" title="{freeLeft} חבילות חינמיות">
          <Gift size={14} strokeWidth={2.2} aria-hidden="true" />
          <span>{freeLeft}</span>
        </span>
      {/if}
      <span class="hearts-display">
        <Heart size={14} strokeWidth={2.4} fill="currentColor" aria-hidden="true" />
        <span>{hearts}</span>
      </span>
    </div>

    <!-- User avatar + logout -->
    <form method="POST" action="/auth/logout" class="logout-form">
      <button type="submit" class="avatar-btn" title="התנתק">
        <span class="avatar-icon" aria-hidden="true">
          <UserRound size={14} strokeWidth={2.2} />
        </span>
        <span class="avatar-name">{$user.name.split(' ')[0]}</span>
      </button>
    </form>
  </div>
</header>
{/if}

<!-- ── Main content ─────────────────────────────────────────── -->
<main class:login-main={isLogin}>
  <slot />
</main>

<!-- ── Bottom tab bar ───────────────────────────────────────── -->
{#if !isLogin}
<nav class="bottom-nav" aria-label="ניווט ראשי">
  {#each navItems as item}
    <a
      class="nav-tab"
      class:active={path === item.href || (item.href !== '/' && path.startsWith(item.href))}
      href={item.href}
      aria-label={item.label}
    >
      <span class="tab-icon" aria-hidden="true">
        {#if item.icon === 'home'}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        {:else if item.icon === 'pack'}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>
        {:else if item.icon === 'album'}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
        {:else if item.icon === 'tasks'}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
        {:else if item.icon === 'admin'}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2"/></svg>
        {/if}
      </span>
      <span class="tab-label">{item.label}</span>
      {#if item.href === '/tasks'}<span class="tab-dot" aria-hidden="true"></span>{/if}
    </a>
  {/each}
</nav>
{/if}

<style>
  main.login-main {
    min-height: 100dvh;
    padding: 0;
  }

  /* ── Top bar ───────────────────────────────────────────────── */
  .top-bar {
    position: fixed;
    top: 0; left: 0; right: 0;
    height: var(--nav-top-h);
    z-index: var(--z-nav);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--sp-4);
    background: rgba(5, 5, 5, 0.78);
    border-bottom: 1px solid rgba(245,196,81,0.1);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
  }

  .brand {
    display: flex;
    align-items: baseline;
    gap: 0.3rem;
    text-decoration: none;
    font-family: 'Frank Ruhl Libre', serif;
    font-size: var(--text-xl);
    font-weight: 700;
    letter-spacing: -0.01em;
  }
  .brand-decade { color: var(--gold); }
  .brand-of     { color: var(--ink-dim); font-weight: 400; font-size: var(--text-sm); }
  .brand-love   { color: var(--silver); }

  /* ── Desktop primary nav ───────────────────────────────────── */
  .top-nav {
    display: none; /* shown on desktop only; mobile uses the bottom tab bar */
  }

  @media (min-width: 768px) {
    .top-nav {
      display: flex;
      align-items: center;
      gap: var(--sp-1);
    }
  }

  .top-nav-link {
    position: relative;
    padding: 0.45em 0.95em;
    border-radius: var(--r-pill);
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--ink-dim);
    text-decoration: none;
    white-space: nowrap;
    transition: color 0.18s ease, background 0.18s ease;
  }
  .top-nav-link:hover {
    color: var(--ink);
    background: var(--glass);
  }
  .top-nav-link.active {
    color: var(--gold);
    background: rgba(245, 196, 81, 0.12);
  }

  .top-right {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
  }

  .wallet-display {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
  }

  .free-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.3em;
    font-size: var(--text-xs);
    font-weight: 700;
    min-height: 2rem;
    padding: 0.25em 0.7em;
    background: rgba(245,196,81,0.15);
    border: 1px solid rgba(245,196,81,0.25);
    border-radius: var(--r-pill);
    color: var(--gold);
    cursor: default;
  }

  .hearts-display {
    display: flex;
    align-items: center;
    gap: 0.3em;
    min-height: 2rem;
    font-size: var(--text-xs);
    font-weight: 700;
    color: var(--heart);
    background: rgba(232,77,107,0.12);
    border: 1px solid rgba(232,77,107,0.25);
    border-radius: var(--r-pill);
    padding: 0.25em 0.7em;
  }

  .logout-form { margin: 0; padding: 0; }

  .avatar-btn {
    display: flex;
    align-items: center;
    gap: 0.35em;
    background: var(--glass);
    border: 1px solid var(--glass-border);
    border-radius: var(--r-pill);
    min-height: 2rem;
    padding: 0.25em 0.7em;
    cursor: pointer;
    color: var(--ink);
    transition: all 0.18s ease;
  }
  .avatar-btn:hover { border-color: rgba(248,113,113,0.5); color: var(--ink-dim); }
  .avatar-icon {
    display: grid;
    place-items: center;
    color: var(--gold);
  }
  .avatar-name { font-size: var(--text-xs); font-weight: 600; color: var(--ink-dim); }

  @media (max-width: 520px) {
    .top-bar {
      padding: 0 var(--sp-3);
    }

    .brand {
      font-size: var(--text-lg);
      gap: 0.22rem;
    }

    .brand-of {
      font-size: var(--text-xs);
    }

    .top-right,
    .wallet-display {
      gap: var(--sp-1);
    }

    .free-badge,
    .hearts-display,
    .avatar-btn {
      min-height: 1.8rem;
      padding: 0.18em 0.55em;
    }

    .avatar-name {
      max-width: 3.8rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  /* ── Bottom nav ────────────────────────────────────────────── */
  .bottom-nav {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    height: var(--nav-bot-h);
    z-index: var(--z-nav);
    display: flex;
    align-items: flex-start;
    justify-content: space-around;
    padding: var(--sp-2) var(--sp-2) env(safe-area-inset-bottom, var(--sp-2));
    background: rgba(5, 3, 16, 0.78);
    border-top: 1px solid rgba(245,196,81,0.1);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }

  @media (min-width: 768px) {
    .bottom-nav {
      display: none;
    }
  }

  .nav-tab {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    flex: 1;
    min-width: 44px;
    min-height: 44px;
    padding: var(--sp-1) 0;
    text-decoration: none;
    color: var(--ink-dim);
    border-radius: var(--r-sm);
    transition: color 0.18s ease;
  }
  .nav-tab:hover { color: var(--ink); }
  .nav-tab.active { color: var(--gold); }
  .nav-tab.active .tab-icon { background: rgba(245,196,81,0.12); }

  .tab-icon {
    width: 44px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--r-sm);
    transition: background 0.18s ease;
  }
  .tab-icon svg { width: 22px; height: 22px; }

  .tab-label {
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 0.02em;
  }

  .tab-dot {
    position: absolute;
    top: 4px;
    right: calc(50% - 18px);
    width: 6px;
    height: 6px;
    background: var(--heart);
    border-radius: 50%;
    border: 1px solid var(--bg-0);
  }
</style>
