// Weighted card draw from the real pool, by per-pack odds.
// Pure functions (only Math.random) — no Svelte/DOM deps, easy to test.

const TYPES = ['common', 'rare', 'legendary'];

/**
 * Pick a card type by cumulative-probability roll.
 * @param {Record<string, number>} odds  e.g. { common: 0.8, rare: 0.19, legendary: 0.01 }
 * @returns {string} the rolled type
 */
export function rollType(odds) {
  const entries = Object.entries(odds);
  const total = entries.reduce((s, [, p]) => s + p, 0) || 1;
  let r = Math.random() * total;
  for (const [type, p] of entries) {
    r -= p;
    if (r <= 0) return type;
  }
  return entries[entries.length - 1][0];
}

/**
 * Pick a random card from a list, weighted by `card.weight` (default 10), and not
 * already used in this pack.
 * @param {any[]} cards
 * @param {Set<number>} usedNumbers
 * @returns {any | null}
 */
function pickFrom(cards, usedNumbers) {
  const avail = cards.filter((c) => !usedNumbers.has(c.card_number));
  if (avail.length === 0) return null;
  const total = avail.reduce((s, c) => s + (c.weight ?? 10), 0) || avail.length;
  let r = Math.random() * total;
  for (const c of avail) {
    r -= (c.weight ?? 10);
    if (r <= 0) return c;
  }
  return avail[avail.length - 1];
}

/**
 * Convert a DB card row into the shape PackOpener expects.
 * @param {any} c
 */
function toOpenerCard(c) {
  return {
    effect:      c.effect,
    photo:       c.photo_url || '/pack-image.png',
    title:       c.title,
    date:        c.date,
    description: c.description,
    rarityTier:  c.rarity_tier,
    cardNumber:  c.card_number,
    year:        c.year,
    cardId:      c.id
  };
}

/**
 * Draw `count` real cards from the pool using a pack's odds.
 * Allows duplicates across packs, but avoids repeats within a single pack.
 * Fallback when a rolled type is empty/exhausted: other types in the odds → any pool card.
 * Only yields a placeholder when the active pool is completely empty.
 *
 * @param {any[]} pool   all card rows (from the `cards` table)
 * @param {Record<string, number>} odds
 * @param {number} [count=5]
 * @returns {Array<object>}
 */
export function drawPack(pool, odds, count = 5) {
  const active = (pool || []).filter((c) => c.active !== false && c.card_number != null);

  // bucket by rarity type
  const buckets = { common: [], rare: [], legendary: [] };
  for (const c of active) {
    if (buckets[c.rarity_tier]) buckets[c.rarity_tier].push(c);
  }

  const usedNumbers = new Set();
  const result = [];

  // type preference order = rolled type first, then the rest of the pack's odds, then all types
  const fallbackOrder = (rolled) => {
    const ordered = [rolled, ...Object.keys(odds).filter((t) => t !== rolled), ...TYPES];
    return [...new Set(ordered)];
  };

  for (let i = 0; i < count; i++) {
    const rolled = rollType(odds);

    let chosen = null;
    for (const type of fallbackOrder(rolled)) {
      chosen = pickFrom(buckets[type] || [], usedNumbers);
      if (chosen) break;
    }
    // last resort: any remaining active card regardless of type
    if (!chosen) chosen = pickFrom(active, usedNumbers);
    // pool smaller than the pack — allow a within-pack duplicate rather than a blank slot
    if (!chosen) chosen = pickFrom(active, new Set());

    if (chosen) {
      usedNumbers.add(chosen.card_number);
      result.push(toOpenerCard(chosen));
    } else {
      // pool is empty (or fully exhausted with no duplicates allowed within a pack) — placeholder
      result.push({
        effect: 'holo', photo: '/pack-image.png', title: '', date: '',
        description: '', rarityTier: rolled, cardNumber: null, year: null, cardId: null
      });
    }
  }

  return result;
}
