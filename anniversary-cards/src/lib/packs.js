/** @typedef {'regular' | 'rare' | 'legendary'} PackId */

/** @type {Record<PackId, object>} */
export const PACK_TYPES = {
  regular: {
    id: 'regular',
    label: 'רגילה',
    cost: 10,
    desc: 'רגיל – נדיר',
    tiers: ['common', 'rare'],
    color: 'var(--silver-dim)',
    glow: 'rgba(138,138,154,0.22)',
    border: 'rgba(138,138,154,0.35)'
  },
  legendary: {
    id: 'legendary',
    label: 'אגדית',
    cost: 20,
    desc: 'אפי – אגדי',
    tiers: ['epic', 'legendary'],
    color: 'var(--gold)',
    glow: 'rgba(245,196,81,0.42)',
    border: 'rgba(245,196,81,0.55)',
    center: true
  },
  rare: {
    id: 'rare',
    label: 'נדירה',
    cost: 15,
    desc: 'נדיר – אפי',
    tiers: ['rare', 'epic'],
    color: 'var(--silver)',
    glow: 'rgba(200,200,212,0.26)',
    border: 'rgba(200,200,212,0.4)'
  }
};

/** @type {PackId[]} */
export const PACK_ORDER = ['regular', 'legendary', 'rare'];

export const ANNIVERSARY_DATE = new Date('2016-06-14');

export function anniversaryStats(asOf = new Date()) {
  const years = asOf.getFullYear() - ANNIVERSARY_DATE.getFullYear();
  const days = Math.floor((asOf.getTime() - ANNIVERSARY_DATE.getTime()) / 86400000);
  return { years, days };
}
