/**
 * Hearts wallet + daily free packs store.
 * Israel timezone (UTC+3) midnight reset for free packs.
 * In Phase B this will sync to Supabase wallets table.
 */
import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';

const WALLET_KEY   = 'ann_wallet_v1';
const PACKS_KEY    = 'ann_free_packs_v1';

const FREE_PACKS_PER_DAY = 2;
const PACK_COSTS = { regular: 10, rare: 15, legendary: 20 };

// ── Israel date key (YYYY-MM-DD in UTC+3) ────────────────────
function israelDateKey() {
  const now = new Date();
  const israel = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  return israel.toISOString().split('T')[0];
}

// ── Load ──────────────────────────────────────────────────────
function loadWallet() {
  if (!browser) return { netanel: 50, almog: 50 };
  try { return JSON.parse(localStorage.getItem(WALLET_KEY)) || { netanel: 50, almog: 50 }; }
  catch { return { netanel: 50, almog: 50 }; }
}

function loadFreePacks() {
  if (!browser) return {};
  try { return JSON.parse(localStorage.getItem(PACKS_KEY)) || {}; }
  catch { return {}; }
}

// ── Stores ───────────────────────────────────────────────────
const walletStore  = writable(loadWallet());
const freePacksStore = writable(loadFreePacks());

function saveWallet(v)  { if (browser) localStorage.setItem(WALLET_KEY, JSON.stringify(v)); }
function saveFreePacks(v) { if (browser) localStorage.setItem(PACKS_KEY, JSON.stringify(v)); }

// ── Hearts wallet API ─────────────────────────────────────────
export const wallet = {
  subscribe: walletStore.subscribe,

  /** Get balance for a user id */
  balance(userId) {
    return get(walletStore)[userId] ?? 0;
  },

  /** Add hearts to a user */
  credit(userId, amount) {
    walletStore.update(w => {
      const next = { ...w, [userId]: (w[userId] ?? 0) + amount };
      saveWallet(next);
      return next;
    });
  },

  /** Deduct hearts; returns false if insufficient */
  debit(userId, amount) {
    let ok = false;
    walletStore.update(w => {
      if ((w[userId] ?? 0) < amount) return w;
      ok = true;
      const next = { ...w, [userId]: w[userId] - amount };
      saveWallet(next);
      return next;
    });
    return ok;
  },

  /** Test-mode reset: restore 200 ♥ and clear today's free-pack usage */
  reset(userId) {
    walletStore.update(w => {
      const next = { ...w, [userId]: 200 };
      saveWallet(next);
      return next;
    });
    freePacksStore.update(data => {
      const today = israelDateKey();
      const key   = `${userId}:${today}`;
      const { [key]: _removed, ...rest } = data;
      saveFreePacks(rest);
      return rest;
    });
  }
};

// ── Free packs API ────────────────────────────────────────────
export const freePacks = {
  subscribe: freePacksStore.subscribe,

  /** How many free packs are remaining today for a user */
  remaining(userId) {
    const data  = get(freePacksStore);
    const today = israelDateKey();
    const entry = data[`${userId}:${today}`];
    if (!entry) return FREE_PACKS_PER_DAY;
    return Math.max(0, FREE_PACKS_PER_DAY - entry.used);
  },

  /** Consume one free pack; returns false if none left */
  use(userId) {
    let ok = false;
    freePacksStore.update(data => {
      const today = israelDateKey();
      const k = `${userId}:${today}`;
      const used = data[k]?.used ?? 0;
      if (used >= FREE_PACKS_PER_DAY) return data;
      ok = true;
      const next = { ...data, [k]: { used: used + 1 } };
      saveFreePacks(next);
      return next;
    });
    return ok;
  },

  FREE_PER_DAY: FREE_PACKS_PER_DAY,
  COSTS: PACK_COSTS
};

// ── Derived: balance per user ─────────────────────────────────
export const balances = derived(walletStore, w => w);
