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
		font-size: clamp(0.85rem, 5.2cqw, 1.7rem);
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
		flex: none;
		font-family: 'Heebo', sans-serif;
		font-size: clamp(0.55rem, 3cqw, 0.85rem);
		font-weight: 700;
		padding: 0.25em 0.7em;
		border-radius: 999px;
		background: rgba(0, 0, 0, 0.45);
		border: 1px solid rgba(255, 255, 255, 0.45);
		backdrop-filter: blur(2px);
		white-space: nowrap;
	}
	.ann-badge--rare      { background: linear-gradient(135deg, #2563eb, #06b6d4); }
	.ann-badge--epic      { background: linear-gradient(135deg, var(--silver-dim), var(--silver)); }
	.ann-badge--legendary { background: linear-gradient(135deg, #f59e0b, #ef4444); color: #1a0b00; }

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
		font-size: clamp(0.6rem, 3.4cqw, 0.95rem);
		font-weight: 500;
		opacity: 0.95;
		letter-spacing: 0.02em;
	}

	.ann-desc {
		margin: 0;
		font-size: clamp(0.62rem, 3.7cqw, 1.05rem);
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
