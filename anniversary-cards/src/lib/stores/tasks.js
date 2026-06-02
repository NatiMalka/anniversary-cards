/**
 * Tasks store — localStorage-backed for the POC.
 * Three task types: daily | special | secret
 * secret tasks reward a FREE PACK (not hearts) on completion.
 * In Phase B this will sync to Supabase tasks + task_completions tables.
 */
import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

const TASKS_KEY       = 'ann_tasks_v1';
const COMPLETIONS_KEY = 'ann_task_completions_v1';

// ── Israel date key ───────────────────────────────────────────
function israelDateKey() {
  const now    = new Date();
  const israel = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  return israel.toISOString().split('T')[0];
}

// ── Seed tasks (shown until admin creates their own) ──────────
const SEED_TASKS = [
  { id: 'seed-1', type: 'daily',   title: 'לקחתי את הילד לגן בזמן',   description: '', reward: 5, rewardType: 'hearts', active: true, createdAt: 0 },
  { id: 'seed-2', type: 'daily',   title: 'אמרתי "אני אוהב אותך" היום', description: '', reward: 3, rewardType: 'hearts', active: true, createdAt: 0 },
  { id: 'seed-3', type: 'special', title: 'יצאנו לדייט שניים',           description: 'ערב זוגי ללא ילדים 💑', reward: 20, rewardType: 'hearts', active: true, createdAt: 0 },
  { id: 'seed-4', type: 'secret',  title: '???',                          description: '', reward: 0, rewardType: 'free_pack', active: true, createdAt: 0 }
];

// ── Load / save ───────────────────────────────────────────────
function loadTasks() {
  if (!browser) return SEED_TASKS;
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    return raw ? JSON.parse(raw) : SEED_TASKS;
  } catch { return SEED_TASKS; }
}

function loadCompletions() {
  if (!browser) return {};
  try { return JSON.parse(localStorage.getItem(COMPLETIONS_KEY)) || {}; }
  catch { return {}; }
}

const tasksStore       = writable(loadTasks());
const completionsStore = writable(loadCompletions());

function saveTasks(v)       { if (browser) localStorage.setItem(TASKS_KEY, JSON.stringify(v)); }
function saveCompletions(v) { if (browser) localStorage.setItem(COMPLETIONS_KEY, JSON.stringify(v)); }

// ── Completion key ────────────────────────────────────────────
// daily tasks: keyed by taskId + userId + date (resets daily)
// special/secret: keyed by taskId + userId (one-time)
function completionKey(task, userId) {
  if (task.type === 'daily') return `${task.id}:${userId}:${israelDateKey()}`;
  return `${task.id}:${userId}`;
}

// ── Public API ────────────────────────────────────────────────
export const tasks = {
  subscribe: tasksStore.subscribe,

  addTask(taskData) {
    const task = {
      ...taskData,
      id: `task-${Date.now()}`,
      createdAt: Date.now()
    };
    tasksStore.update(t => {
      const next = [...t, task];
      saveTasks(next);
      return next;
    });
    return task.id;
  },

  updateTask(id, patch) {
    tasksStore.update(t => {
      const next = t.map(x => x.id === id ? { ...x, ...patch } : x);
      saveTasks(next);
      return next;
    });
  },

  deleteTask(id) {
    tasksStore.update(t => {
      const next = t.filter(x => x.id !== id);
      saveTasks(next);
      return next;
    });
  },

  /** Check if a user has completed a task */
  isCompleted(task, userId, completions) {
    return !!completions[completionKey(task, userId)];
  },

  /** Mark a task as completed; returns the reward info */
  complete(task, userId) {
    const key = completionKey(task, userId);
    let alreadyDone = false;
    completionsStore.update(c => {
      if (c[key]) { alreadyDone = true; return c; }
      const next = { ...c, [key]: { completedAt: Date.now(), reward: task.reward, rewardType: task.rewardType } };
      saveCompletions(next);
      return next;
    });
    if (alreadyDone) return null;
    return { reward: task.reward, rewardType: task.rewardType };
  }
};

export const completions = {
  subscribe: completionsStore.subscribe,
  key: completionKey
};

// ── Derived views ─────────────────────────────────────────────
export const dailyTasks   = derived(tasksStore, $t => $t.filter(t => t.type === 'daily'   && t.active));
export const specialTasks = derived(tasksStore, $t => $t.filter(t => t.type === 'special' && t.active));
export const secretTasks  = derived(tasksStore, $t => $t.filter(t => t.type === 'secret'  && t.active));
