import { writable } from 'svelte/store';
import { supabase } from '$lib/supabase.js';
import { browser } from '$app/environment';

const poolStore = writable(/** @type {any[]} */ ([]));

export const pool = { subscribe: poolStore.subscribe };

export async function loadPool() {
  if (!browser) return;
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .order('card_number');
  if (!error && data) poolStore.set(data);
}

/**
 * Upsert a card into the pool (no add_to_collection side-effect).
 * @param {Record<string, any>} cardData
 * @returns {Promise<{ok: boolean, card?: any}>}
 */
export async function savePool(cardData) {
  const { data, error } = await supabase
    .from('cards')
    .upsert({
      card_number:  cardData.cardNumber,
      title:        cardData.title,
      description:  cardData.description ?? '',
      date:         cardData.date ?? '',
      effect:       cardData.effect,
      rarity_tier:  cardData.rarityTier,
      is_flat:      cardData.isFlat,
      photo_url:    cardData.photo,
      year:         cardData.year ?? String(cardData.date ?? ''),
      show_frame:   cardData.showFrame ?? false,
      frame_color:  cardData.frameColor ?? '#f5c451'
    }, { onConflict: 'card_number' })
    .select()
    .single();
  if (error) return { ok: false };
  poolStore.update((cards) => {
    const idx = cards.findIndex((c) => c.card_number === data.card_number);
    if (idx === -1) return [...cards, data].sort((a, b) => a.card_number - b.card_number);
    const next = [...cards];
    next[idx] = data;
    return next;
  });
  return { ok: true, card: data };
}

/**
 * Delete a card from the pool by its UUID.
 * Cascades to user_collection via FK.
 * @param {string} id
 */
export async function deletePool(id) {
  const { error } = await supabase.from('cards').delete().eq('id', id);
  if (!error) poolStore.update((cards) => cards.filter((c) => c.id !== id));
  return !error;
}

/**
 * Fetch one card by card_number (for editor prefill).
 * @param {number} cardNumber
 */
export async function getByNumber(cardNumber) {
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('card_number', cardNumber)
    .single();
  if (error) return null;
  return data;
}
