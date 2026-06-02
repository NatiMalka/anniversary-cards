<script>
  import { tasks, dailyTasks, specialTasks, secretTasks } from '$lib/stores/tasks.js';
  import { isAdmin } from '$lib/stores/user.js';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  onMount(() => { if (!$isAdmin) goto('/'); });

  // ── Form state ────────────────────────────────────────────────
  let form = { title: '', description: '', type: 'daily', reward: 5, rewardType: 'hearts', active: true };
  let editId = null;
  let saved = '';
  let showForm = false;

  const TYPES = [
    { value: 'daily',   label: '📅 יומית',    hint: 'מתחדשת כל בוקר' },
    { value: 'special', label: '⭐ מיוחדת',   hint: 'חד פעמית' },
    { value: 'secret',  label: '🔐 סודית',    hint: 'פרס: חבילה חינמית' },
  ];

  function newTask() {
    form  = { title: '', description: '', type: 'daily', reward: 5, rewardType: 'hearts', active: true };
    editId = null;
    showForm = true;
  }

  function editTask(task) {
    form   = { title: task.title, description: task.description || '', type: task.type,
               reward: task.reward, rewardType: task.rewardType, active: task.active };
    editId = task.id;
    showForm = true;
  }

  function saveTask() {
    if (!form.title.trim()) return;
    if (form.type === 'secret') form.rewardType = 'free_pack';
    if (editId) {
      tasks.updateTask(editId, form);
      saved = '✅ משימה עודכנה!';
    } else {
      tasks.addTask(form);
      saved = '✅ משימה נוצרה!';
    }
    showForm = false;
    editId   = null;
    setTimeout(() => (saved = ''), 3000);
  }

  function deleteTask(id) {
    if (!confirm('למחוק את המשימה?')) return;
    tasks.deleteTask(id);
  }

  function toggleActive(task) {
    tasks.updateTask(task.id, { active: !task.active });
  }

  $: allTasks = [...$dailyTasks, ...$specialTasks, ...$secretTasks,
                 ...$tasks.filter(t => !t.active)];

  const typeLabel = { daily:'יומית', special:'מיוחדת', secret:'סודית' };
  const typeColor = { daily:'var(--silver)', special:'var(--gold)', secret:'var(--heart)' };
</script>

<svelte:head><title>ניהול משימות — עשור של אהבה</title></svelte:head>

<div class="page">
  <div class="section-head">
    <div>
      <a href="/admin" class="back-link">← חזרה לניהול</a>
      <h1>ניהול משימות</h1>
    </div>
    <button class="btn btn-gold" on:click={newTask}>+ משימה חדשה</button>
  </div>

  {#if saved}<p class="saved-msg">{saved}</p>{/if}

  <!-- ── Create / Edit form ──────────────────────────────────── -->
  {#if showForm}
    <div class="form-card surface-gold">
      <h2 class="form-title">{editId ? '✏️ עריכת משימה' : '✨ משימה חדשה'}</h2>

      <div class="form-grid">
        <div class="input-wrap" style="grid-column:1/-1">
          <label class="input-label" for="f-title">כותרת המשימה *</label>
          <input id="f-title" class="input" bind:value={form.title}
                 placeholder="למשל: לקחתי את הילד לגן בזמן" required />
        </div>

        <div class="input-wrap" style="grid-column:1/-1">
          <label class="input-label" for="f-desc">תיאור (אופציונלי)</label>
          <textarea id="f-desc" class="input" rows="2" bind:value={form.description}
                    placeholder="הסבר קצר על המשימה..."></textarea>
        </div>

        <div class="input-wrap">
          <label class="input-label">סוג משימה</label>
          <div class="type-picker">
            {#each TYPES as t}
              <button
                type="button"
                class="type-btn"
                class:active={form.type === t.value}
                on:click={() => { form.type = t.value; if (t.value === 'secret') form.rewardType = 'free_pack'; else form.rewardType = 'hearts'; }}
              >
                {t.label}
                <span class="type-hint">{t.hint}</span>
              </button>
            {/each}
          </div>
        </div>

        <div class="input-wrap">
          <label class="input-label">פרס</label>
          {#if form.type === 'secret'}
            <div class="reward-display">
              <span class="reward-pack-badge">🎁 חבילה חינמית</span>
              <p class="reward-note">משימות סודיות תמיד מתגמלות בחבילה חינמית</p>
            </div>
          {:else}
            <div class="reward-row">
              <input type="number" class="input" style="width:100px"
                     min="1" max="50" bind:value={form.reward} />
              <span class="reward-unit hearts-chip">
                <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/></svg>
                לבבות
              </span>
            </div>
          {/if}
        </div>

        <div class="input-wrap">
          <label class="input-label">סטטוס</label>
          <label class="toggle-label">
            <input type="checkbox" bind:checked={form.active} />
            <span>{form.active ? 'פעיל' : 'מושבת'}</span>
          </label>
        </div>
      </div>

      <div class="form-actions">
        <button class="btn btn-gold" on:click={saveTask}>שמור משימה</button>
        <button class="btn btn-ghost" on:click={() => { showForm = false; editId = null; }}>ביטול</button>
      </div>
    </div>
  {/if}

  <!-- ── Task list ───────────────────────────────────────────── -->
  <div class="task-table surface">
    {#if allTasks.length === 0}
      <p class="empty-msg">אין משימות עדיין. צור את הראשונה!</p>
    {:else}
      {#each allTasks as task}
        <div class="task-row" class:inactive={!task.active}>
          <div class="task-row-info">
            <span class="task-type-pill" style="background:color-mix(in srgb,{typeColor[task.type]} 20%,transparent); color:{typeColor[task.type]};">
              {typeLabel[task.type]}
            </span>
            <span class="task-row-title">{task.title}</span>
          </div>
          <div class="task-row-meta">
            {#if task.rewardType === 'free_pack'}
              <span class="reward-pack-sm">🎁</span>
            {:else}
              <span class="hearts-chip">♥ {task.reward}</span>
            {/if}
            <button class="btn btn-ghost btn-sm" on:click={() => toggleActive(task)}>
              {task.active ? 'השבת' : 'הפעל'}
            </button>
            <button class="btn btn-glass btn-sm" on:click={() => editTask(task)}>ערוך</button>
            <button class="btn btn-ghost btn-sm danger" on:click={() => deleteTask(task.id)}>מחק</button>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
  h1 { margin: var(--sp-2) 0 var(--sp-6); }
  .back-link { font-size: var(--text-sm); color: var(--gold-dim); text-decoration: none; }
  .back-link:hover { color: var(--gold); }
  .saved-msg { color: var(--success); font-size: var(--text-sm); margin-bottom: var(--sp-4); }

  /* form */
  .form-card {
    padding: var(--sp-6);
    border-radius: var(--r-xl);
    margin-bottom: var(--sp-6);
    animation: fadeUp 0.3s var(--ease-out);
  }
  .form-title { margin: 0 0 var(--sp-5); font-size: var(--text-xl); }
  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--sp-4);
    margin-bottom: var(--sp-5);
  }
  @media(max-width:600px){ .form-grid { grid-template-columns:1fr; } }

  .type-picker { display: flex; flex-direction: column; gap: var(--sp-2); }
  .type-btn {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    padding: var(--sp-3);
    border-radius: var(--r-md);
    border: 1px solid var(--glass-border);
    background: var(--glass);
    color: var(--ink-dim);
    cursor: pointer;
    font: inherit;
    transition: all 0.15s ease;
    text-align: right;
  }
  .type-btn:hover  { border-color: var(--gold-muted); color: var(--ink); }
  .type-btn.active { border-color: var(--gold); background: var(--glass-gold); color: var(--ink); }
  .type-hint { font-size: var(--text-xs); color: var(--ink-dim); margin-right: auto; }

  .reward-row { display: flex; align-items: center; gap: var(--sp-3); }
  .reward-display { padding: var(--sp-3); }
  .reward-pack-badge { font-size: var(--text-lg); }
  .reward-note { margin: var(--sp-1) 0 0; font-size: var(--text-xs); color: var(--ink-dim); }

  .toggle-label { display: flex; align-items: center; gap: var(--sp-2); cursor: pointer; font-size: var(--text-sm); }

  .form-actions { display: flex; gap: var(--sp-3); }

  /* table */
  .task-table {
    border-radius: var(--r-xl);
    overflow: hidden;
  }
  .empty-msg { padding: var(--sp-6); text-align: center; color: var(--ink-dim); margin: 0; }
  .task-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-4);
    padding: var(--sp-4) var(--sp-5);
    border-bottom: 1px solid var(--glass-border);
    flex-wrap: wrap;
  }
  .task-row:last-child { border-bottom: none; }
  .task-row.inactive { opacity: 0.45; }
  .task-row-info { display: flex; align-items: center; gap: var(--sp-3); flex: 1; min-width: 0; }
  .task-type-pill {
    flex-shrink: 0;
    font-size: var(--text-xs);
    font-weight: 700;
    padding: 0.2em 0.6em;
    border-radius: var(--r-pill);
  }
  .task-row-title { font-size: var(--text-sm); font-weight: 600; }
  .task-row-meta  { display: flex; align-items: center; gap: var(--sp-2); flex-shrink: 0; }
  .reward-pack-sm { font-size: 1.1rem; }
  .danger { color: var(--danger) !important; border-color: rgba(248,113,113,0.3) !important; }
  .danger:hover { background: rgba(248,113,113,0.1) !important; }
</style>
