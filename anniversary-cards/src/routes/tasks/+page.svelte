<script>
  import { onMount } from 'svelte';
  import { user } from '$lib/stores/user.js';
  import { wallet } from '$lib/stores/wallet.js';
  import { loadTasks, loadCompletions, tasks, completions, dailyTasks, specialTasks, secretTasks } from '$lib/stores/tasks.js';

  let toast = null;
  let toastTimer;
  let loading = true;

  onMount(async () => {
    await loadTasks();
    if ($user.id) await loadCompletions($user.id);
    loading = false;
  });

  function showToast(msg, type = 'success') {
    clearTimeout(toastTimer);
    toast = { msg, type };
    toastTimer = setTimeout(() => (toast = null), 3500);
  }

  async function claim(task) {
    const result = await tasks.complete(task, $user.id);
    if (!result) { showToast('כבר השלמת משימה זו!', 'info'); return; }

    if (result.rewardType === 'free_pack') {
      showToast('🎁 קיבלת חבילה חינמית! פתח אותה בעמוד החבילות', 'gold');
    } else {
      wallet.credit($user.id, result.reward);
      showToast(`+${result.reward} ♥ נוספו לארנק שלך!`, 'heart');
    }
  }

  function isCompleted(task) {
    return !!$completions[completions.key(task, $user.id)];
  }

  $: SECTIONS = [
    { label: 'משימות יומיות',  icon: '📅', list: $dailyTasks,   accent: 'var(--silver)', desc: 'מתחדשות כל בוקר' },
    { label: 'משימות מיוחדות', icon: '⭐', list: $specialTasks, accent: 'var(--gold)',   desc: 'חד פעמיות' },
    { label: 'משימות סודיות',  icon: '🔐', list: $secretTasks,  accent: 'var(--heart)',  desc: 'פרס: חבילה חינמית' },
  ];
</script>

<svelte:head><title>משימות — עשור של אהבה</title></svelte:head>

{#if toast}
  <div class="toast toast--{toast.type}" role="alert" aria-live="polite">{toast.msg}</div>
{/if}

<div class="page">
  <header class="page-hero">
    <h1>משימות</h1>
    <p>השלימו משימות, הרוויחו ♥ לבבות, ופתחו חבילות קלפים יחד.</p>
  </header>

  {#if loading}
    <p class="loading-msg">טוען משימות...</p>
  {:else}
    {#each SECTIONS as sec}
      <section class="task-section">
        <div class="section-head">
          <h2><span class="sec-icon">{sec.icon}</span>{sec.label}</h2>
          <span class="sec-desc">{sec.desc}</span>
        </div>

        {#if sec.list.length === 0}
          <div class="empty-state surface"><p>אין משימות כרגע</p></div>
        {:else}
          <div class="task-list">
            {#each sec.list as task}
              {@const done = isCompleted(task)}
              <div class="task-card surface" class:done style="--accent:{sec.accent}">
                {#if task.type === 'secret' && !done}
                  <div class="task-secret-veil">
                    <span class="secret-icon">🔐</span>
                    <p>משימה סודית</p>
                    <p class="secret-hint">השלם כדי לחשוף ולקבל חבילה חינמית!</p>
                    <button class="btn btn-heart btn-sm" on:click={() => claim(task)}>
                      השלמתי! גלה אותי
                    </button>
                  </div>
                {:else}
                  <div class="task-main">
                    <div class="task-check" class:checked={done} aria-hidden="true">
                      {#if done}✓{/if}
                    </div>
                    <div class="task-body">
                      <p class="task-title">{task.title}</p>
                      {#if task.description}<p class="task-desc">{task.description}</p>{/if}
                    </div>
                    <div class="task-reward">
                      {#if task.rewardType === 'free_pack'}
                        <span class="reward-pack">🎁 חינם</span>
                      {:else}
                        <span class="reward-hearts hearts-chip">
                          <svg viewBox="0 0 24 24" fill="currentColor" width="11" height="11"><path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/></svg>
                          {task.reward}
                        </span>
                      {/if}
                    </div>
                  </div>
                  {#if !done}
                    <button class="btn btn-glass btn-sm task-btn" on:click={() => claim(task)}>
                      סמן כהושלם
                    </button>
                  {/if}
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </section>
    {/each}
  {/if}
</div>

<style>
  .loading-msg { text-align: center; color: var(--ink-dim); padding: var(--sp-8) 0; }
  .page-hero { margin-bottom: var(--sp-8); }
  .page-hero h1 { font-size: var(--text-4xl); }
  .page-hero p  { color: var(--ink-dim); margin: 0; }

  .task-section { margin-bottom: var(--sp-8); }
  .sec-icon { margin-left: var(--sp-2); }
  .sec-desc { font-size: var(--text-xs); color: var(--ink-dim); }

  .task-list { display: flex; flex-direction: column; gap: var(--sp-3); }

  .task-card {
    border-radius: var(--r-lg);
    padding: var(--sp-4);
    border-left: 3px solid var(--accent);
    transition: opacity 0.3s ease, transform 0.2s ease;
    animation: fadeUp 0.35s var(--ease-out) both;
  }
  .task-card:hover { transform: translateX(-2px); }
  .task-card.done { opacity: 0.5; border-left-color: transparent; }

  .task-main { display: flex; align-items: flex-start; gap: var(--sp-3); }

  .task-check {
    width: 22px; height: 22px;
    flex-shrink: 0;
    border-radius: 50%;
    border: 2px solid var(--glass-border);
    display: grid;
    place-items: center;
    font-size: 0.7rem;
    color: var(--success);
    margin-top: 2px;
    transition: all 0.2s ease;
  }
  .task-check.checked { background: rgba(74,222,128,0.2); border-color: var(--success); }

  .task-body { flex: 1; }
  .task-title { margin: 0; font-weight: 600; font-size: var(--text-sm); }
  .task-desc  { margin: 4px 0 0; font-size: var(--text-xs); color: var(--ink-dim); }
  .task-reward { flex-shrink: 0; }
  .reward-pack { font-size: var(--text-sm); }
  .task-btn { margin-top: var(--sp-3); }

  .task-secret-veil {
    text-align: center;
    padding: var(--sp-4);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--sp-2);
  }
  .secret-icon { font-size: 2rem; }
  .task-secret-veil p { margin: 0; font-size: var(--text-sm); }
  .secret-hint { color: var(--ink-dim); font-size: var(--text-xs); }

  .empty-state { padding: var(--sp-6); text-align: center; color: var(--ink-dim); border-radius: var(--r-lg); }
  .empty-state p { margin: 0; }

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
  .toast--heart   { background: rgba(232,77,107,0.2);  border: 1px solid rgba(232,77,107,0.4);  color: var(--heart); }
  .toast--gold    { background: rgba(245,196,81,0.2);  border: 1px solid rgba(245,196,81,0.4);  color: var(--gold); }
  .toast--info    { background: rgba(200,200,212,0.15); border: 1px solid rgba(200,200,212,0.3); color: var(--silver); }
</style>
