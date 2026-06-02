/**
 * POC user store — no real auth yet.
 * Stores who is currently "logged in" in localStorage.
 * In Phase B this will be replaced by Supabase auth.
 */
import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

const KEY = 'ann_user_v1';

const USERS = {
  netanel: { id: 'netanel', name: 'נתנאל', role: 'admin', avatar: '👨' },
  almog:   { id: 'almog',   name: 'אלמוג אסתר', role: 'user',  avatar: '👩' }
};

function loadUser() {
  if (!browser) return USERS.netanel;
  const id = localStorage.getItem(KEY) || 'netanel';
  return USERS[id] || USERS.netanel;
}

const { subscribe, set } = writable(loadUser());

export const user = {
  subscribe,
  switchTo(id) {
    const u = USERS[id];
    if (!u) return;
    if (browser) localStorage.setItem(KEY, id);
    set(u);
  },
  USERS
};

export const isAdmin = derived({ subscribe }, ($u) => $u.role === 'admin');
