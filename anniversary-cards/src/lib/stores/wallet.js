import { writable, get } from 'svelte/store';
import { supabase } from '$lib/supabase.js';

const FREE_PACKS_PER_DAY = 2;
const PACK_COSTS = { regular: 10, rare: 15, legendary: 20 };

function israelDateKey() {
  const now    = new Date();
  const israel = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  return israel.toISOString().split('T')[0];
}

const walletStore = writable({ hearts_balance: 0, free_packs_used_today: 0, free_packs_reset_date: null });

/** Called from +layout.svelte on every page load with fresh server data. */
export function initWallet(data) {
  if (data) walletStore.set(data);
}

export const wallet = {
  subscribe: walletStore.subscribe,

  balance(_userId) {
    return get(walletStore).hearts_balance ?? 0;
  },

  async credit(userId, amount) {
    const next = (get(walletStore).hearts_balance ?? 0) + amount;
    const { error } = await supabase
      .from('wallets')
      .update({ hearts_balance: next, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    if (!error) walletStore.update((w) => ({ ...w, hearts_balance: next }));
  },

  async debit(userId, amount) {
    const current = get(walletStore).hearts_balance ?? 0;
    if (current < amount) return false;
    const next = current - amount;
    const { error } = await supabase
      .from('wallets')
      .update({ hearts_balance: next, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    if (!error) walletStore.update((w) => ({ ...w, hearts_balance: next }));
    return !error;
  },

  async reset(userId) {
    const { error } = await supabase
      .from('wallets')
      .update({ hearts_balance: 200, free_packs_used_today: 0, free_packs_reset_date: null, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    if (!error) walletStore.set({ hearts_balance: 200, free_packs_used_today: 0, free_packs_reset_date: null });
  }
};

export const freePacks = {
  subscribe: walletStore.subscribe,

  remaining(_userId) {
    const data  = get(walletStore);
    const today = israelDateKey();
    const used  = data.free_packs_reset_date === today ? (data.free_packs_used_today ?? 0) : 0;
    return Math.max(0, FREE_PACKS_PER_DAY - used);
  },

  async use(userId) {
    const data  = get(walletStore);
    const today = israelDateKey();
    const used  = data.free_packs_reset_date === today ? (data.free_packs_used_today ?? 0) : 0;
    if (used >= FREE_PACKS_PER_DAY) return false;
    const { error } = await supabase
      .from('wallets')
      .update({ free_packs_used_today: used + 1, free_packs_reset_date: today, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    if (!error) walletStore.update((w) => ({ ...w, free_packs_used_today: used + 1, free_packs_reset_date: today }));
    return !error;
  },

  FREE_PER_DAY: FREE_PACKS_PER_DAY,
  COSTS: PACK_COSTS
};

export const balances = walletStore;
