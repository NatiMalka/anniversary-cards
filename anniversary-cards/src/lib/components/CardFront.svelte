<script>
	// Composes a card face (photo + romantic template overlay) and feeds it into
	// the holographic <Card> via its slot, so the shine/glare sit on top.
	import Card from './Card.svelte';
	import { TIER_LABELS } from '../effects.js';

	export let effect = 'holo';
	export let photo = ''; // image url (object URL in the editor, storage URL later)
	export let title = '';
	export let date = ''; // pre-formatted display string
	export let description = '';
	export let rarityTier = 'rare';
	export let isFlat = false; // true => photo is a fully designed card; skip the template
	export let back = '';
	export let name = '';
	export let types = '';
	export let showcase = false;
	/** Show a TCG-style border frame around the art */
	export let showFrame = false;
	/** CSS colour value for the frame (hex / var / rgb) */
	export let frameColor = '#f5c451';

	$: tierLabel = TIER_LABELS[rarityTier] ?? '';
</script>

<Card {effect} {back} {name} {types} {showcase}>
	<!--
		Frame strategy: wrap the photo in a padding-box so it physically stays
		smaller. The engine forces width/height/aspect-ratio on *direct* slot
		children, but NOT on the wrapper's own children — those only get the
		universal descendant selectors which Svelte's scoped class selectors
		out-specify without !important.
	-->
	{#if showFrame}
		<div class="ann-frame-wrap" style="--ann-fc:{frameColor};">
			{#if photo}
				<img class="ann-photo-art" src={photo} alt={title || 'תמונת קלף'} />
			{:else}
				<div class="ann-photo-art ann-photo--empty" aria-hidden="true">
					<span>העלו תמונה</span>
				</div>
			{/if}
		</div>
	{:else}
		{#if photo}
			<img class="ann-photo" src={photo} alt={title || 'תמונת קלף'} />
		{:else}
			<div class="ann-photo ann-photo--empty" aria-hidden="true">
				<span>העלו תמונה</span>
			</div>
		{/if}
	{/if}

	{#if !isFlat}
		<div
			class="ann-template"
			class:ann-template--framed={showFrame}
			dir="rtl"
		>
			<div class="ann-top">
				{#if title}<span class="ann-title">{title}</span>{/if}
				{#if tierLabel}<span class="ann-badge ann-badge--{rarityTier}">{tierLabel}</span>{/if}
			</div>
			<div class="ann-bottom" class:ann-bottom--framed={showFrame}>
				{#if date}<bdi class="ann-date">{date}</bdi>{/if}
				{#if description}<p class="ann-desc">{description}</p>{/if}
			</div>
		</div>
	{/if}
</Card>

<style>
	/* the engine's `.card__rotator *` forces grid-area/aspect-ratio/overflow on
	   every descendant — fine for the photo, but we must reset it inside the
	   template so normal flow layout works. Scoped selectors out-specify it. */

	/* ── Photo (no frame) ──────────────────────────────────────────── */
	.ann-photo {
		height: 100%;
		width: 100%;
		object-fit: cover;
		object-position: center;
	}

	/* ── TCG frame ─────────────────────────────────────────────────
	   The wrapper is a direct slot child so the engine sizes it to
	   fill the card (width/height 100%). The padding on the wrapper
	   creates the visible frame gap; the photo inside fills the
	   content area normally — no fighting the engine's forced styles. */
	.ann-frame-wrap {
		/* Let the engine size this to fill the card */
		width: 100%;
		height: 100%;
		/* Frame colour fills the padded edges */
		background: var(--ann-fc, #2a2a2a);
		/* Frame width — ~2-3 mm at card size */
		padding: clamp(5px, 3%, 8px);
		box-sizing: border-box;
		/* Depth shadow inside the frame border */
		box-shadow:
			inset 0 0 0 1.5px rgba(255, 255, 255, 0.2),
			inset 0 0 20px rgba(0, 0, 0, 0.55);
		/* Clip photo tightly to the content rectangle */
		overflow: hidden;
		/* Reset engine 3-D promotion so we stay flat */
		transform: none;
		transform-style: flat;
		backface-visibility: visible;
		-webkit-backface-visibility: visible;
		z-index: 0;
	}

	/* Photo INSIDE the frame wrapper — fills the padded content area */
	.ann-photo-art {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center;
		/* tiny rounding so the inner corners feel intentional */
		border-radius: 3px;
		/* thin shadow at photo edge to separate it from the frame */
		box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.5);
	}

	/* ── Photo empty state ──────────────────────────────────────── */
	.ann-photo--empty {
		display: grid;
		place-items: center;
		background: repeating-linear-gradient(
			45deg,
			#111111,
			#111111 12px,
			#181818 12px,
			#181818 24px
		);
		color: hsl(280 20% 70%);
		font-size: 1.1rem;
		letter-spacing: 0.04em;
	}

	/* ── Template overlay ───────────────────────────────────────── */
	/* z-index: 4 puts the template ABOVE shine (z-index: 3) and glare
	   (z-index: auto, DOM order) so blend modes do not composite over
	   the text.
	   NO isolation / backdrop-filter here — those force a compositing
	   layer that rasterises at CSS-pixel resolution inside the 3D
	   context, making everything blurry on retina. */
	.ann-template {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		container-type: inline-size;
		padding: 6.5% 7%;
		font-family: 'Frank Ruhl Libre', 'Heebo', serif;
		color: white;
		pointer-events: none;
		z-index: 4;
		transform: none;
		transform-style: flat;
		backface-visibility: visible;
		-webkit-backface-visibility: visible;
	}

	/* Push template text inside the art window when frame is on
	   (frame is ~3 % per side, so padding just needs to exceed that) */
	.ann-template--framed {
		padding: clamp(8px, 7.5%, 18px) clamp(7px, 7%, 16px);
	}

	/* Reset engine forced styles on template descendants */
	.ann-template * {
		aspect-ratio: auto;
		grid-area: auto;
		width: auto;
		border-radius: 0;
		overflow: visible;
		display: revert;
		transform: none;
		transform-style: flat;
		backface-visibility: visible;
		-webkit-backface-visibility: visible;
		-webkit-font-smoothing: antialiased;
		text-rendering: optimizeLegibility;
	}

	.ann-top {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.5em;
	}

	.ann-title {
		font-size: clamp(0.62rem, 5.2cqw, 1.7rem);
		font-weight: 700;
		line-height: 1.15;
		/* Hard 1px bottom + two-step bloom for crisp legibility */
		text-shadow:
			0 1px 0   rgba(0, 0, 0, 1),
			0 1px 3px rgba(0, 0, 0, 0.95),
			0 2px 6px rgba(0, 0, 0, 0.8),
			0 0   1px rgba(0, 0, 0, 1);
		/* Plain dark pill — NO backdrop-filter (causes retina blur in 3D) */
		background: rgba(0, 0, 0, 0.28);
		padding: 0.18em 0.45em;
		border-radius: 4px;
	}

	.ann-badge {
		position: relative;
		flex: none;
		display: inline-flex;
		align-items: center;
		gap: 0.34em;
		font-family: 'Heebo', sans-serif;
		font-size: clamp(0.42rem, 3cqw, 0.85rem);
		font-weight: 800;
		letter-spacing: 0.04em;
		padding: 0.3em 0.78em;
		border-radius: 999px;
		overflow: hidden;
		white-space: nowrap;
		/* NO backdrop-filter — it rasterises blurry inside the 3-D card */
		background: linear-gradient(135deg, #2a2c31, #4a4d54 48%, #232529);
		color: #eef0f3;
		border: 1px solid rgba(255, 255, 255, 0.4);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.28),
			inset 0 -1px 2px rgba(0, 0, 0, 0.35),
			0 1px 3px rgba(0, 0, 0, 0.55);
		text-shadow: 0 1px 1px rgba(0, 0, 0, 0.35);
	}

	/* faceted gem mark before the label */
	.ann-badge::before {
		content: '◆';
		font-size: 0.82em;
		line-height: 1;
		color: rgba(255, 255, 255, 0.85);
		filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.5));
	}

	/* travelling sheen (rare + legendary only) */
	.ann-badge::after {
		content: '';
		position: absolute;
		top: 0;
		left: -65%;
		width: 45%;
		height: 100%;
		background: linear-gradient(
			115deg,
			transparent,
			rgba(255, 255, 255, 0.7),
			transparent
		);
		transform: skewX(-18deg);
		opacity: 0;
		pointer-events: none;
	}

	/* ── Common — understated graphite ───────────────────────────── */
	.ann-badge--common {
		background: linear-gradient(135deg, #41454d, #5b616b 48%, #33363c);
		color: #eef0f3;
		border-color: rgba(255, 255, 255, 0.32);
	}
	.ann-badge--common::before { color: #b6bcc6; }

	/* ── Rare — brushed silver with a cool glow ──────────────────── */
	.ann-badge--rare {
		background: linear-gradient(135deg, #eef3fb 0%, #aebfd6 34%, #7990b2 56%, #d2dcec 100%);
		color: #16243c;
		border-color: rgba(255, 255, 255, 0.75);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.85),
			inset 0 -1px 2px rgba(0, 0, 0, 0.22),
			0 0 9px rgba(120, 170, 255, 0.55),
			0 1px 3px rgba(0, 0, 0, 0.5);
		text-shadow: 0 1px 1px rgba(255, 255, 255, 0.4);
	}
	.ann-badge--rare::before { color: #1d4ed8; filter: drop-shadow(0 0 2px rgba(120,170,255,0.7)); }
	.ann-badge--rare::after  { opacity: 1; animation: badgeSheen 4.4s ease-in-out infinite; }

	/* ── Epic (legacy) — platinum ────────────────────────────────── */
	.ann-badge--epic {
		background: linear-gradient(135deg, #f2f2f6 0%, var(--silver) 45%, var(--silver-dim) 70%, #e8e8f0 100%);
		color: #1a1a22;
		border-color: rgba(255, 255, 255, 0.7);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.85),
			0 0 8px rgba(200, 200, 212, 0.5),
			0 1px 3px rgba(0, 0, 0, 0.5);
	}
	.ann-badge--epic::before { color: #6b6b78; }

	/* ── Legendary — molten gold, glowing, with a slow shimmer ───── */
	.ann-badge--legendary {
		background: linear-gradient(135deg, #fff4c8 0%, #f5c451 28%, #b8860b 52%, #ffe08a 74%, #d4a017 100%);
		color: #3a2400;
		border-color: rgba(255, 240, 190, 0.9);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.85),
			inset 0 -1px 2px rgba(120, 72, 0, 0.4),
			0 0 10px rgba(245, 196, 81, 0.7),
			0 0 22px rgba(245, 196, 81, 0.35),
			0 1px 3px rgba(0, 0, 0, 0.5);
		text-shadow: 0 1px 1px rgba(255, 240, 200, 0.5);
		animation: badgeGoldPulse 3s ease-in-out infinite;
	}
	.ann-badge--legendary::before { color: #7a4a00; filter: drop-shadow(0 0 2px rgba(255, 224, 150, 0.9)); }
	.ann-badge--legendary::after  { opacity: 1; animation: badgeSheen 3.6s ease-in-out infinite; }

	@keyframes badgeSheen {
		0%        { left: -65%; }
		28%, 100% { left: 135%; }
	}
	@keyframes badgeGoldPulse {
		0%, 100% { box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.85),
			inset 0 -1px 2px rgba(120, 72, 0, 0.4),
			0 0 10px rgba(245, 196, 81, 0.7),
			0 0 22px rgba(245, 196, 81, 0.35),
			0 1px 3px rgba(0, 0, 0, 0.5); }
		50%      { box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.9),
			inset 0 -1px 2px rgba(120, 72, 0, 0.4),
			0 0 14px rgba(245, 196, 81, 0.9),
			0 0 30px rgba(245, 196, 81, 0.5),
			0 1px 3px rgba(0, 0, 0, 0.5); }
	}

	@media (prefers-reduced-motion: reduce) {
		.ann-badge::after,
		.ann-badge--legendary { animation: none; }
	}

	.ann-bottom {
		display: flex;
		flex-direction: column;
		gap: 0.25em;
		background: linear-gradient(to top, rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0));
		margin: 0 -7% -6.5%;
		padding: 14% 7% 7%;
	}

	/* Framed: extend the gradient to bleed to the art-window edge */
	.ann-bottom--framed {
		margin: 0 -7% -7.5%;
		padding: 14% 7% 7.5%;
	}

	.ann-date {
		font-family: 'Heebo', sans-serif;
		font-size: clamp(0.45rem, 3.4cqw, 0.95rem);
		font-weight: 500;
		opacity: 0.95;
		letter-spacing: 0.02em;
	}

	.ann-desc {
		margin: 0;
		font-size: clamp(0.5rem, 3.7cqw, 1.05rem);
		font-weight: 500;
		line-height: 1.3;
		text-shadow:
			0 1px 0   rgba(0, 0, 0, 1),
			0 1px 3px rgba(0, 0, 0, 0.95),
			0 2px 5px rgba(0, 0, 0, 0.8);
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
