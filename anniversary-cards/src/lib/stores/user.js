import { page } from '$app/stores';
import { derived } from 'svelte/store';

const DEFAULT = { id: '', name: '', role: 'user', avatar: '👤' };

export const user    = derived(page, ($p) => $p.data?.profile ?? DEFAULT);
export const isAdmin = derived(user, ($u) => $u?.role === 'admin');
