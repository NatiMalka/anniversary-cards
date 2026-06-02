/**
 * Maps our friendly effect ids -> the data-attributes that the ported
 * pokemon-cards-css stylesheets key off of (data-rarity / data-subtypes /
 * data-supertype / data-trainer-gallery / data-set / data-number).
 *
 * All effects render in "full-art" mode (no per-card mask) using only the
 * local /static/img textures, so any uploaded photo works out of the box.
 * A `mask` prop is still left open on <Card> for an optional future per-card mask.
 *
 * `tier` is a sensible default rarity tier for the album (the admin can override).
 */

/** @typedef {{label:string, rarity:string, subtypes?:string, supertype?:string, trainerGallery?:boolean, set?:string, number?:string, tier:string, note?:string}} EffectDef */

/** @type {Record<string, EffectDef>} */
export const EFFECTS = {
	basic: { label: 'רגיל (ללא ברק)', rarity: 'common', tier: 'common' },
	holo: { label: 'הולו קלאסי', rarity: 'rare holo', tier: 'rare' },
	reverse: { label: 'ריוורס הולו', rarity: 'reverse holo', tier: 'rare' },
	cosmos: { label: 'קוסמוס / גלקסיה', rarity: 'rare holo cosmos', tier: 'rare' },
	radiant: { label: 'זוהר (Radiant)', rarity: 'radiant rare', tier: 'epic' },
	v: { label: 'V', rarity: 'rare holo v', tier: 'epic' },
	v_fullart: { label: 'V פול-ארט', rarity: 'rare ultra', supertype: 'pokémon', tier: 'epic' },
	vmax: { label: 'VMAX', rarity: 'rare holo vmax', tier: 'epic' },
	vstar: { label: 'VSTAR', rarity: 'rare holo vstar', tier: 'epic' },
	trainer_fullart: {
		label: 'מאמן פול-ארט',
		rarity: 'rare ultra',
		supertype: 'trainer',
		subtypes: 'supporter',
		tier: 'epic'
	},
	amazing: { label: 'מדהים (Amazing)', rarity: 'amazing rare', tier: 'epic' },
	shiny: { label: 'נוצץ (Shiny)', rarity: 'rare shiny', tier: 'epic' },
	shiny_v: { label: 'נוצץ V', rarity: 'rare shiny v', tier: 'epic' },
	shiny_vmax: {
		label: 'נוצץ VMAX',
		rarity: 'rare shiny vmax',
		tier: 'legendary',
		note: 'נראה הכי טוב עם mask ייעודי; בינתיים full-art'
	},
	rainbow: { label: 'קשת (Rainbow)', rarity: 'rare rainbow', tier: 'legendary' },
	rainbow_alt: { label: 'קשת אלט', rarity: 'rare rainbow alt', tier: 'legendary' },
	secret: { label: 'זהב / סיקרט', rarity: 'rare secret', tier: 'legendary' },
	pikachu: {
		label: 'פיקאצ׳ו זהב',
		rarity: 'rare secret',
		set: 'swsh12pt5',
		number: '160',
		tier: 'legendary'
	},
	tg_holo: { label: 'גלריית מאמנים — הולו', rarity: 'rare holo', trainerGallery: true, tier: 'epic' },
	tg_v: { label: 'גלריית מאמנים — V', rarity: 'rare holo v', trainerGallery: true, tier: 'epic' },
	tg_vmax: {
		label: 'גלריית מאמנים — VMAX',
		rarity: 'rare holo vmax',
		trainerGallery: true,
		tier: 'legendary'
	},
	tg_secret: {
		label: 'גלריית מאמנים — סיקרט',
		rarity: 'rare secret',
		trainerGallery: true,
		tier: 'legendary'
	}
};

/** ordered list of effect ids for pickers/galleries */
export const EFFECT_IDS = Object.keys(EFFECTS);

/** Hebrew labels for the rarity tiers used in the album */
export const TIER_LABELS = {
	common: 'רגיל',
	rare: 'נדיר',
	epic: 'אפי',
	legendary: 'אגדי'
};

/**
 * Resolve an effect id into the props <Card> expects.
 * Falls back to `holo` for unknown ids.
 * @param {string} id
 */
export function resolveEffect(id) {
	const e = EFFECTS[id] ?? EFFECTS.holo;
	return {
		rarity: e.rarity,
		subtypes: e.subtypes ?? 'basic',
		supertype: e.supertype ?? 'pokémon',
		trainerGallery: e.trainerGallery ?? false,
		set: e.set ?? '',
		number: e.number ?? ''
	};
}
