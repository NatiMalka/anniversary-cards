import { writable, derived, get } from 'svelte/store';
import { supabase } from '$lib/supabase.js';
import { browser } from '$app/environment';

function israelDateKey() {
  const now    = new Date();
  const israel = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  return israel.toISOString().split('T')[0];
}

function completionKey(task, userId) {
  return task.type === 'daily'
    ? `${task.id}:${userId}:${israelDateKey()}`
    : `${task.id}:${userId}:once`;
}

function normalize(t) {
  return {
    id:          t.id,
    title:       t.title,
    description: t.description ?? '',
    type:        t.type,
    reward:      t.reward,
    rewardType:  t.reward_type,
    active:      t.active,
    createdAt:   t.created_at
  };
}

const tasksStore       = writable([]);
const completionsStore = writable({});

export async function loadTasks() {
  if (!browser) return;
  const { data, error } = await supabase.from('tasks').select('*').order('created_at');
  if (!error && data) tasksStore.set(data.map(normalize));
}

export async function loadCompletions(userId) {
  if (!browser || !userId) return;
  const today = israelDateKey();
  const { data, error } = await supabase
    .from('task_completions')
    .select('*')
    .eq('user_id', userId)
    .or(`period_key.eq.${today},period_key.eq.once`);
  if (!error && data) {
    const map = {};
    for (const c of data) {
      map[`${c.task_id}:${c.user_id}:${c.period_key}`] = c;
    }
    completionsStore.set(map);
  }
}

export const tasks = {
  subscribe: tasksStore.subscribe,

  async addTask(taskData) {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title:       taskData.title,
        description: taskData.description ?? '',
        type:        taskData.type,
        reward:      taskData.reward,
        reward_type: taskData.rewardType,
        active:      taskData.active
      })
      .select()
      .single();
    if (!error && data) {
      tasksStore.update((t) => [...t, normalize(data)]);
      return data.id;
    }
    return null;
  },

  async updateTask(id, patch) {
    const update = {};
    if (patch.title       !== undefined) update.title       = patch.title;
    if (patch.description !== undefined) update.description = patch.description;
    if (patch.type        !== undefined) update.type        = patch.type;
    if (patch.reward      !== undefined) update.reward      = patch.reward;
    if (patch.rewardType  !== undefined) update.reward_type = patch.rewardType;
    if (patch.active      !== undefined) update.active      = patch.active;
    const { error } = await supabase.from('tasks').update(update).eq('id', id);
    if (!error) tasksStore.update((t) => t.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  },

  async deleteTask(id) {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (!error) tasksStore.update((t) => t.filter((x) => x.id !== id));
  },

  isCompleted(task, userId) {
    return !!get(completionsStore)[completionKey(task, userId)];
  },

  async complete(task, userId) {
    const key = completionKey(task, userId);
    if (get(completionsStore)[key]) return null;
    const periodKey = task.type === 'daily' ? israelDateKey() : 'once';
    const { data, error } = await supabase
      .from('task_completions')
      .insert({
        task_id:     task.id,
        user_id:     userId,
        period_key:  periodKey,
        reward:      task.reward,
        reward_type: task.rewardType
      })
      .select()
      .single();
    if (!error && data) {
      completionsStore.update((c) => ({ ...c, [key]: data }));
      return { reward: task.reward, rewardType: task.rewardType };
    }
    return null;
  }
};

export const completions = {
  subscribe: completionsStore.subscribe,
  key: completionKey
};

export const dailyTasks   = derived(tasksStore, ($t) => $t.filter((t) => t.type === 'daily'   && t.active));
export const specialTasks = derived(tasksStore, ($t) => $t.filter((t) => t.type === 'special' && t.active));
export const secretTasks  = derived(tasksStore, ($t) => $t.filter((t) => t.type === 'secret'  && t.active));
