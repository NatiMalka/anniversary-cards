import { writable, derived, get } from 'svelte/store';
import { supabase } from '$lib/supabase.js';
import { browser } from '$app/environment';

const collectionStore = writable({});

export async function loadCollection(userId) {
  if (!browser || !userId) return;
  const { data, error } = await supabase
    .from('user_collection')
    .select('*, cards(*)')
    .eq('user_id', userId);
  if (!error && data) {
    const map = {};
    for (const item of data) {
      const c = item.cards;
      map[String(c.card_number)] = {
        cardNumber:  c.card_number,
        effect:      c.effect,
        photo:       c.photo_url,
        title:       c.title,
        date:        c.date,
        description: c.description,
        rarityTier:  c.rarity_tier,
        year:        c.year,
        isFlat:      c.is_flat,
        showFrame:   c.show_frame ?? false,
        frameColor:  c.frame_color ?? '#f5c451',
        count:       item.count,
        cardId:      c.id,
        collectionId: item.id
      };
    }
    collectionStore.set(map);
  }
}

export const collection = {
  subscribe: collectionStore.subscribe,

  /** Upsert card in pool + add to user's album (increment count if duplicate). */
  async addCard(cardData, userId) {
    const { data: card, error: cardError } = await supabase
      .from('cards')
      .upsert({
        card_number: cardData.cardNumber,
        title:       cardData.title,
        description: cardData.description ?? '',
        date:        cardData.date ?? '',
        effect:      cardData.effect,
        rarity_tier: cardData.rarityTier,
        is_flat:     cardData.isFlat,
        photo_url:   cardData.photo,
        year:        cardData.year ?? String(cardData.date ?? '')
      }, { onConflict: 'card_number' })
      .select()
      .single();
    if (cardError) return false;

    const { error: rpcError } = await supabase.rpc('add_to_collection', {
      p_user_id:     userId,
      p_card_id:     card.id,
      p_card_number: cardData.cardNumber
    });
    if (!rpcError) await loadCollection(userId);
    return !rpcError;
  },

  /** Grant several already-pooled cards to a user's album (increments counts), then refresh once. */
  async grantMany(cards, userId) {
    if (!userId) return;
    for (const c of cards) {
      if (!c?.cardId) continue;
      await supabase.rpc('add_to_collection', {
        p_user_id:     userId,
        p_card_id:     c.cardId,
        p_card_number: c.cardNumber
      });
    }
    await loadCollection(userId);
  },

  async removeCard(cardNumber, userId) {
    const entry = get(collectionStore)[String(cardNumber)];
    if (!entry) return;
    const { error } = await supabase.from('user_collection').delete().eq('id', entry.collectionId);
    if (!error) collectionStore.update((c) => { const n = { ...c }; delete n[String(cardNumber)]; return n; });
  },

  async reset(userId) {
    collectionStore.set({});
    await supabase.from('user_collection').delete().eq('user_id', userId);
  }
};

export const collectedCards = derived(collectionStore, ($col) =>
  Object.values($col).sort((a, b) => a.cardNumber - b.cardNumber)
);
export const collectedCount = derived(collectionStore, ($col) => Object.keys($col).length);
export const collectionYears = derived(collectionStore, ($col) => {
  const years = [...new Set(Object.values($col).map((c) => c.year).filter(Boolean))];
  return years.sort((a, b) => b - a);
});
