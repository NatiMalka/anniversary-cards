/**
 * Client-side collection store — backed by localStorage for the POC.
 * In Phase B this will sync to Supabase user_collection.
 *
 * Shape: { [cardNumber: string]: CardEntry }
 * CardEntry: { cardNumber, effect, photo, title, date, description, rarityTier, year, isFlat, count }
 */
import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

const KEY = 'ann_collection_v1';

function load() {
	if (!browser) return {};
	try {
		return JSON.parse(localStorage.getItem(KEY) || '{}');
	} catch {
		return {};
	}
}

function save(data) {
	if (!browser) return;
	try {
		localStorage.setItem(KEY, JSON.stringify(data));
	} catch {}
}

function createCollection() {
	const { subscribe, update, set } = writable(load());

	return {
		subscribe,

		/** Add or increment a card in the collection. */
		addCard(cardData) {
			update((col) => {
				const n = String(cardData.cardNumber);
				const existing = col[n];
				const next = { ...col, [n]: { ...cardData, count: (existing?.count ?? 0) + 1 } };
				save(next);
				return next;
			});
		},

		/** Remove a card from the collection entirely. */
		removeCard(cardNumber) {
			update((col) => {
				const next = { ...col };
				delete next[String(cardNumber)];
				save(next);
				return next;
			});
		},

		/** Wipe everything (dev / reset). */
		reset() {
			if (browser) localStorage.removeItem(KEY);
			set({});
		}
	};
}

export const collection = createCollection();

/** Sorted list of all cards in the collection. */
export const collectedCards = derived(collection, ($col) =>
	Object.values($col).sort((a, b) => a.cardNumber - b.cardNumber)
);

/** How many unique slots are filled. */
export const collectedCount = derived(collection, ($col) => Object.keys($col).length);

/** Unique years present in the collection, sorted desc. */
export const collectionYears = derived(collection, ($col) => {
	const years = [...new Set(Object.values($col).map((c) => c.year).filter(Boolean))];
	return years.sort((a, b) => b - a);
});
