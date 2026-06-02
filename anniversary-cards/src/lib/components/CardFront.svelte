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

	$: tierLabel = TIER_LABELS[rarityTier] ?? '';
</script>

<Card {effect} {back} {name} {types} {showcase}>
	{#if photo}
		<img class="ann-photo" src={photo} alt={title || 'תמונת קלף'} />
	{:else}
		<div class="ann-photo ann-photo--empty" aria-hidden="true">
			<span>העלו תמונה</span>
		</div>
	{/if}

	{#if !isFlat}
		<div class="ann-template" dir="rtl">
			<div class="ann-top">
				{#if title}<span class="ann-title">{title}</span>{/if}
				{#if tierLabel}<span class="ann-badge ann-badge--{rarityTier}">{tierLabel}</span>{/if}
			</div>
			<div class="ann-bottom">
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

	.ann-photo {
		height: 100%;
		width: 100%;
		object-fit: cover;
		object-position: center;
	}

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

	.ann-template {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		container-type: inline-size;
		padding: 6.5% 7%;
		font-family: 'Frank Ruhl Libre', 'Heebo', serif;
		color: white;
		pointer-events: none;
		/* sit above the photo but below shine/glare (those have higher translateZ) */
		z-index: 2;
		/* keep text on a flat layer so it isn't rasterized + scaled (blur) */
		transform: none;
		transform-style: flat;
		backface-visibility: visible;
		-webkit-backface-visibility: visible;
	}

	/* undo the inherited engine styles for template internals + keep text crisp.
	   The engine forces aspect-ratio/grid/overflow/preserve-3d/backface-hidden on
	   every card descendant; for text we want flat, un-promoted layers. */
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
		/* crisp contrast: tight 1px halo, no soft blur */
		text-shadow:
			0 1px 2px rgba(0, 0, 0, 0.9),
			0 0 1px rgba(0, 0, 0, 0.95),
			0 0 2px rgba(0, 0, 0, 0.6);
		padding: 0.15em 0.1em;
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
	.ann-badge--rare {
		background: linear-gradient(135deg, #2563eb, #06b6d4);
	}
	.ann-badge--epic {
		background: linear-gradient(135deg, var(--silver-dim), var(--silver));
	}
	.ann-badge--legendary {
		background: linear-gradient(135deg, #f59e0b, #ef4444);
		color: #1a0b00;
	}

	.ann-bottom {
		display: flex;
		flex-direction: column;
		gap: 0.25em;
		background: linear-gradient(to top, rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0));
		margin: 0 -7% -6.5%;
		padding: 14% 7% 7%;
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
			0 1px 2px rgba(0, 0, 0, 0.9),
			0 0 1px rgba(0, 0, 0, 0.9);
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
