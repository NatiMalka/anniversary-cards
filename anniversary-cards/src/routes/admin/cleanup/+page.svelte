<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase.js';

  let profiles = [];
  let cards    = [];
  let toast    = null;
  let busy     = {};

  onMount(async () => {
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from('profiles').select('id, name, avatar, role').order('role'),
      supabase.from('cards').select('id, card_number, title, rarity_tier').order('card_number')
    ]);
    if (p) profiles = p;
    if (c) cards    = c;
  });

  function showToast(msg, type = 'success') {
    toast = { msg, type };
    setTimeout(() => (toast = null), 3000);
  }

  function setBusy(key, val) { busy = { ...busy, [key]: val }; }

  async function resetWallet(userId, name) {
    if (!confirm(`איפוס ארנק של ${name} ל-50 ♥?`)) return;
    setBusy(`wallet-${userId}`, true);
    const { error } = await supabase.from('wallets')
      .update({ hearts_balance: 50, free_packs_used_today: 0, free_packs_reset_date: null })
      .eq('user_id', userId);
    setBusy(`wallet-${userId}`, false);
    error ? showToast('שגיאה', 'error') : showToast(`ארנק ${name} אופס ✓`);
  }

  async function clearCollection(userId, name) {
    if (!confirm(`למחוק את כל קלפי ${name} מהאלבום?`)) return;
    setBusy(`col-${userId}`, true);
    const { error } = await supabase.from('user_collection').delete().eq('user_id', userId);
    setBusy(`col-${userId}`, false);
    error ? showToast('שגיאה', 'error') : showToast(`אוסף ${name} נמחק ✓`);
  }

  async function clearCompletions(userId, name) {
    if (!confirm(`למחוק את כל השלמות המשימות של ${name}?`)) return;
    setBusy(`comp-${userId}`, true);
    const { error } = await supabase.from('task_completions').delete().eq('user_id', userId);
    setBusy(`comp-${userId}`, false);
    error ? showToast('שגיאה', 'error') : showToast(`השלמות ${name} נמחקו ✓`);
  }

  async function fullReset(userId, name) {
    if (!confirm(`איפוס מלא של ${name}?\nארנק + אוסף + השלמות משימות — לא ניתן לשחזר.`)) return;
    setBusy(`full-${userId}`, true);
    await Promise.all([
      supabase.from('wallets').update({ hearts_balance: 50, free_packs_used_today: 0, free_packs_reset_date: null }).eq('user_id', userId),
      supabase.from('user_collection').delete().eq('user_id', userId),
      supabase.from('task_completions').delete().eq('user_id', userId)
    ]);
    setBusy(`full-${userId}`, false);
    showToast(`${name} אופס לגמרי ✓`);
  }

  async function deleteCard(card) {
    if (!confirm(`למחוק קלף #${card.card_number} "${card.title}"?\nיימחק גם מכל האוספים.`)) return;
    setBusy(`card-${card.id}`, true);
    const { error } = await supabase.from('cards').delete().eq('id', card.id);
    setBusy(`card-${card.id}`, false);
    if (!error) {
      cards = cards.filter(c => c.id !== card.id);
      showToast(`קלף #${card.card_number} נמחק ✓`);
    } else {
      showToast('שגיאה', 'error');
    }
  }

  const TIER_COLORS = { common: 'var(--ink-dim)', rare: 'var(--silver)', epic: 'var(--silver)', legendary: 'var(--gold)' };
</script>

<svelte:head><title>ניקוי נתונים — ניהול</title></svelte:head>

{#if toast}
  <div class="toast toast--{toast.type}" role="alert">{toast.msg}</div>
{/if}

<div class="page">
  <div class="section-head">
    <div>
      <a href="/admin" class="back-link">← חזרה לניהול</a>
      <h1>ניקוי נתונים</h1>
    </div>
  </div>

  <!-- ── Per-user actions ──────────────────────────────────────── -->
  <section class="section surface">
    <h2 class="sec-h">משתמשים</h2>
    {#each profiles as p}
      <div class="user-row">
        <div class="user-info">
          <span class="user-avatar">{p.avatar}</span>
          <span class="user-name">{p.name}</span>
          {#if p.role === 'admin'}
            <span class="role-badge">אדמין</span>
          {/if}
        </div>
        <div class="action-row">
          <button class="btn btn-ghost btn-sm" disabled={busy[`wallet-${p.id}`]}
                  on:click={() => resetWallet(p.id, p.name)}>
            {busy[`wallet-${p.id}`] ? '...' : '♥ איפוס ארנק'}
          </button>
          <button class="btn btn-ghost btn-sm" disabled={busy[`col-${p.id}`]}
                  on:click={() => clearCollection(p.id, p.name)}>
            {busy[`col-${p.id}`] ? '...' : '📚 נקה אוסף'}
          </button>
          <button class="btn btn-ghost btn-sm" disabled={busy[`comp-${p.id}`]}
                  on:click={() => clearCompletions(p.id, p.name)}>
            {busy[`comp-${p.id}`] ? '...' : '✅ נקה השלמות'}
          </button>
          <button class="btn btn-ghost btn-sm danger" disabled={busy[`full-${p.id}`]}
                  on:click={() => fullReset(p.id, p.name)}>
            {busy[`full-${p.id}`] ? '...' : '🔥 איפוס מלא'}
          </button>
        </div>
      </div>
    {/each}
  </section>

  <!-- ── Card pool ─────────────────────────────────────────────── -->
  <section class="section surface">
    <h2 class="sec-h">קלפים בבריכה ({cards.length})</h2>
    {#if cards.length === 0}
      <p class="empty">אין קלפים בבריכה עדיין.</p>
    {:else}
      <div class="card-list">
        {#each cards as card}
          <div class="card-row">
            <span class="card-num" style="color:{TIER_COLORS[card.rarity_tier] ?? 'var(--ink-dim)'}">
              #{card.card_number}
            </span>
            <span class="card-title">{card.title}</span>
            <button class="btn btn-ghost btn-sm danger" disabled={busy[`card-${card.id}`]}
                    on:click={() => deleteCard(card)}>
              {busy[`card-${card.id}`] ? '...' : 'מחק'}
            </button>
          </div>
        {/each}
      </div>
    {/if}
  </section>
</div>

<style>
  h1 { margin: var(--sp-2) 0 var(--sp-6); }
  .back-link { font-size: var(--text-sm); color: var(--gold-dim); text-decoration: none; }
  .back-link:hover { color: var(--gold); }

  .section {
    border-radius: var(--r-xl);
    overflow: hidden;
    margin-bottom: var(--sp-6);
  }

  .sec-h {
    margin: 0;
    padding: var(--sp-4) var(--sp-5);
    font-size: var(--text-sm);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--ink-dim);
    border-bottom: 1px solid var(--glass-border);
  }

  .user-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-4);
    padding: var(--sp-4) var(--sp-5);
    border-bottom: 1px solid var(--glass-border);
    flex-wrap: wrap;
  }
  .user-row:last-child { border-bottom: none; }

  .user-info {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
  }
  .user-avatar { font-size: 1.5rem; }
  .user-name   { font-weight: 600; font-size: var(--text-base); }
  .role-badge  {
    font-size: var(--text-xs);
    font-weight: 700;
    padding: 0.15em 0.5em;
    border-radius: var(--r-pill);
    background: rgba(245,196,81,0.15);
    border: 1px solid rgba(245,196,81,0.25);
    color: var(--gold);
  }

  .action-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }

  .card-list { display: flex; flex-direction: column; }
  .card-row {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    padding: var(--sp-3) var(--sp-5);
    border-bottom: 1px solid var(--glass-border);
  }
  .card-row:last-child { border-bottom: none; }
  .card-num   { font-size: var(--text-sm); font-weight: 700; min-width: 2.5rem; flex-shrink: 0; }
  .card-title { flex: 1; font-size: var(--text-sm); }

  .empty { padding: var(--sp-6); text-align: center; color: var(--ink-dim); margin: 0; }

  .danger { color: var(--danger) !important; border-color: rgba(248,113,113,0.3) !important; }
  .danger:hover { background: rgba(248,113,113,0.1) !important; }

  .toast {
    position: fixed;
    bottom: calc(var(--nav-bot-h) + var(--sp-4));
    left: 50%;
    transform: translateX(-50%);
    z-index: var(--z-toast);
    padding: var(--sp-3) var(--sp-6);
    border-radius: var(--r-pill);
    font-weight: 600;
    font-size: var(--text-sm);
    white-space: nowrap;
    animation: fadeUp 0.25s var(--ease-spring);
    backdrop-filter: blur(8px);
  }
  .toast--success { background: rgba(74,222,128,0.2);  border: 1px solid rgba(74,222,128,0.4);  color: var(--success); }
  .toast--error   { background: rgba(248,113,113,0.2); border: 1px solid rgba(248,113,113,0.4); color: var(--danger); }
</style>
