<script>
	// Ported from pokemon-cards-css (GPLv3 © Simon Goellner / @simeydotme).
	// Changes: removed gtag analytics, SSR-guarded document/window access,
	// dropped the pokemontcg.io CDN coupling, added an `effect` prop that
	// resolves to the data-attributes the stylesheets key off, and replaced
	// the hard-coded front <img> with a <slot> so a custom photo + template
	// can be composed underneath the holographic shine/glare layers.
	import { spring } from 'svelte/motion';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { activeCard } from '../stores/activeCard.js';
	import { orientation, resetBaseOrientation } from '../stores/orientation.js';
	import { clamp, round, adjust } from '../helpers/Math.js';
	import { resolveEffect } from '../effects.js';

	// effect: our friendly effect id (see effects.js). When set it overrides
	// the explicit rarity/subtypes/supertype/trainerGallery/set/number props.
	export let effect = '';

	// explicit card-attribute props (used when `effect` is empty)
	export let rarity = 'common';
	export let subtypes = 'basic';
	export let supertype = 'pokémon';
	export let trainerGallery = false;
	export let set = '';
	export let number = '';
	export let types = '';
	export let name = '';

	// image props
	export let back = ''; // optional custom card-back image url
	export let foil = '';
	export let mask = '';

	// context
	export let showcase = false;

	let randomSeed = { x: 0.5, y: 0.5 };
	let cosmosPosition = { x: 367, y: 640 };

	let thisCard;
	let repositionTimer;
	let rafId = null;
	let pendingSpringUpdate = null;

	let active = false;
	let interacting = false;
	let firstPop = true;
	let isVisible = true;

	const springInteractSettings = { stiffness: 0.066, damping: 0.25 };
	const springPopoverSettings = { stiffness: 0.033, damping: 0.45 };
	let springRotate = spring({ x: 0, y: 0 }, springInteractSettings);
	let springGlare = spring({ x: 50, y: 50, o: 0 }, springInteractSettings);
	let springBackground = spring({ x: 50, y: 50 }, springInteractSettings);
	let springRotateDelta = spring({ x: 0, y: 0 }, springPopoverSettings);
	let springTranslate = spring({ x: 0, y: 0 }, springPopoverSettings);
	let springScale = spring(1, springPopoverSettings);

	let showcaseInterval;
	let showcaseTimerStart;
	let showcaseTimerEnd;
	let showcaseRunning = showcase;

	// resolve the effect id (or explicit props) into the stylesheet attributes
	$: resolved = effect
		? resolveEffect(effect)
		: { rarity, subtypes, supertype, trainerGallery, set, number };

	$: rRarity = (resolved.rarity || 'common').toLowerCase();
	$: rSupertype = (resolved.supertype || 'pokémon').toLowerCase();
	$: rSubtypes = Array.isArray(resolved.subtypes)
		? resolved.subtypes.join(' ').toLowerCase()
		: (resolved.subtypes || 'basic').toLowerCase();
	$: rNumber = (resolved.number || '').toLowerCase();
	$: rSet = resolved.set || '';
	$: rTypes = Array.isArray(types) ? types.join(' ').toLowerCase() : (types || '').toLowerCase();
	$: rTrainerGallery = !!resolved.trainerGallery || !!rNumber.match(/^[tg]g/i);

	const endShowcase = () => {
		if (showcaseRunning) {
			clearTimeout(showcaseTimerEnd);
			clearTimeout(showcaseTimerStart);
			clearInterval(showcaseInterval);
			showcaseRunning = false;
		}
	};

	const interact = (e) => {
		endShowcase();

		if (!isVisible) {
			return (interacting = false);
		}

		// prevent other background cards being interacted with
		if ($activeCard && $activeCard !== thisCard) {
			return (interacting = false);
		}

		interacting = true;

		if (e.type === 'touchmove') {
			e.clientX = e.touches[0].clientX;
			e.clientY = e.touches[0].clientY;
		}

		const $el = e.target;
		const rect = $el.getBoundingClientRect();
		const absolute = {
			x: e.clientX - rect.left,
			y: e.clientY - rect.top
		};
		const percent = {
			x: clamp(round((100 / rect.width) * absolute.x)),
			y: clamp(round((100 / rect.height) * absolute.y))
		};
		const center = {
			x: percent.x - 50,
			y: percent.y - 50
		};

		pendingSpringUpdate = {
			background: {
				x: adjust(percent.x, 0, 100, 37, 63),
				y: adjust(percent.y, 0, 100, 33, 67)
			},
			rotate: {
				x: round(-(center.x / 3.5)),
				y: round(center.y / 3.5)
			},
			glare: {
				x: round(percent.x),
				y: round(percent.y),
				o: 1
			}
		};

		if (rafId === null) {
			rafId = requestAnimationFrame(() => {
				if (pendingSpringUpdate) {
					updateSprings(
						pendingSpringUpdate.background,
						pendingSpringUpdate.rotate,
						pendingSpringUpdate.glare
					);
					pendingSpringUpdate = null;
				}
				rafId = null;
			});
		}
	};

	const interactEnd = (e, delay = 500) => {
		if (rafId !== null) {
			cancelAnimationFrame(rafId);
			rafId = null;
		}
		pendingSpringUpdate = null;

		setTimeout(function () {
			const snapStiff = 0.01;
			const snapDamp = 0.06;
			interacting = false;

			springRotate.stiffness = snapStiff;
			springRotate.damping = snapDamp;
			springRotate.set({ x: 0, y: 0 }, { soft: 1 });

			springGlare.stiffness = snapStiff;
			springGlare.damping = snapDamp;
			springGlare.set({ x: 50, y: 50, o: 0 }, { soft: 1 });

			springBackground.stiffness = snapStiff;
			springBackground.damping = snapDamp;
			springBackground.set({ x: 50, y: 50 }, { soft: 1 });
		}, delay);
	};

	const activate = () => {
		if ($activeCard && $activeCard === thisCard) {
			$activeCard = undefined;
		} else {
			$activeCard = thisCard;
			resetBaseOrientation();
		}
	};

	const deactivate = () => {
		interactEnd();
		$activeCard = undefined;
	};

	const reposition = () => {
		clearTimeout(repositionTimer);
		repositionTimer = setTimeout(() => {
			if ($activeCard && $activeCard === thisCard) {
				setCenter();
			}
		}, 300);
	};

	const setCenter = () => {
		const rect = thisCard.getBoundingClientRect();
		const view = document.documentElement;

		const delta = {
			x: round(view.clientWidth / 2 - rect.x - rect.width / 2),
			y: round(view.clientHeight / 2 - rect.y - rect.height / 2)
		};
		springTranslate.set({
			x: delta.x,
			y: delta.y
		});
	};

	const popover = () => {
		const rect = thisCard.getBoundingClientRect();
		let delay = 100;
		let scaleW = (window.innerWidth / rect.width) * 0.9;
		let scaleH = (window.innerHeight / rect.height) * 0.9;
		let scaleF = 1.75;
		setCenter();
		if (firstPop) {
			delay = 1000;
			springRotateDelta.set({
				x: 360,
				y: 0
			});
		}
		firstPop = false;
		springScale.set(Math.min(scaleW, scaleH, scaleF));
		interactEnd(null, delay);
	};

	const retreat = () => {
		springScale.set(1, { soft: true });
		springTranslate.set({ x: 0, y: 0 }, { soft: true });
		springRotateDelta.set({ x: 0, y: 0 }, { soft: true });
		interactEnd(null, 100);
	};

	const reset = () => {
		interactEnd(null, 0);
		springScale.set(1, { hard: true });
		springTranslate.set({ x: 0, y: 0 }, { hard: true });
		springRotateDelta.set({ x: 0, y: 0 }, { hard: true });
		springRotate.set({ x: 0, y: 0 }, { hard: true });
	};

	$: {
		if ($activeCard && $activeCard === thisCard) {
			popover();
			active = true;
		} else {
			retreat();
			active = false;
		}
	}

	$: foilStyles = mask || foil ? `--mask: url(${mask}); --foil: url(${foil});` : '';

	$: staticStyles = `
		--seedx: ${randomSeed.x};
		--seedy: ${randomSeed.y};
		--cosmosbg: ${cosmosPosition.x}px ${cosmosPosition.y}px;
	`;

	$: dynamicStyles = `
		--pointer-x: ${$springGlare.x}%;
		--pointer-y: ${$springGlare.y}%;
		--pointer-from-center: ${clamp(
			Math.sqrt(
				($springGlare.y - 50) * ($springGlare.y - 50) +
					($springGlare.x - 50) * ($springGlare.x - 50)
			) / 50,
			0,
			1
		)};
		--pointer-from-top: ${$springGlare.y / 100};
		--pointer-from-left: ${$springGlare.x / 100};
		--card-opacity: ${$springGlare.o};
		--rotate-x: ${$springRotate.x + $springRotateDelta.x}deg;
		--rotate-y: ${$springRotate.y + $springRotateDelta.y}deg;
		--background-x: ${$springBackground.x}%;
		--background-y: ${$springBackground.y}%;
		--card-scale: ${$springScale};
		--translate-x: ${$springTranslate.x}px;
		--translate-y: ${$springTranslate.y}px;
	`;

	const orientate = (e) => {
		const x = e.relative.gamma;
		const y = e.relative.beta;
		const limit = { x: 16, y: 18 };

		const degrees = {
			x: clamp(x, -limit.x, limit.x),
			y: clamp(y, -limit.y, limit.y)
		};

		updateSprings(
			{
				x: adjust(degrees.x, -limit.x, limit.x, 37, 63),
				y: adjust(degrees.y, -limit.y, limit.y, 33, 67)
			},
			{
				x: round(degrees.x * -1),
				y: round(degrees.y)
			},
			{
				x: adjust(degrees.x, -limit.x, limit.x, 0, 100),
				y: adjust(degrees.y, -limit.y, limit.y, 0, 100),
				o: 1
			}
		);
	};

	const updateSprings = (background, rotate, glare) => {
		springBackground.stiffness = springInteractSettings.stiffness;
		springBackground.damping = springInteractSettings.damping;
		springRotate.stiffness = springInteractSettings.stiffness;
		springRotate.damping = springInteractSettings.damping;
		springGlare.stiffness = springInteractSettings.stiffness;
		springGlare.damping = springInteractSettings.damping;

		springBackground.set(background);
		springRotate.set(rotate);
		springGlare.set(glare);
	};

	$: {
		if ($activeCard && $activeCard === thisCard) {
			interacting = true;
			orientate($orientation);
		}
	}

	const handleVisibility = () => {
		isVisible = document.visibilityState === 'visible';
		endShowcase();
		reset();
	};

	onMount(() => {
		// randomise the holo seeds on the client to avoid SSR hydration mismatch
		randomSeed = { x: Math.random(), y: Math.random() };
		cosmosPosition = {
			x: Math.floor(randomSeed.x * 734),
			y: Math.floor(randomSeed.y * 1280)
		};

		isVisible = document.visibilityState === 'visible';
		document.addEventListener('visibilitychange', handleVisibility);

		// auto-shimmer animation for showcase cards.
		// showcase='quick' (used during pack reveal) starts after 400ms so it kicks
		// in right after the flip. showcase=true uses the original 2s delay.
		if (showcase && isVisible) {
			const startDelay = showcase === 'quick' ? 400 : 2000;
			const s = 0.02;
			const d = 0.5;
			let r = 0;
			showcaseTimerStart = setTimeout(() => {
				interacting = true;
				active = true;
				springRotate.stiffness = s;
				springRotate.damping = d;
				springGlare.stiffness = s;
				springGlare.damping = d;
				springBackground.stiffness = s;
				springBackground.damping = d;
				showcaseInterval = setInterval(function () {
					r += 0.05;
					springRotate.set({ x: Math.sin(r) * 25, y: Math.cos(r) * 25 });
					springGlare.set({
						x: 55 + Math.sin(r) * 55,
						y: 55 + Math.cos(r) * 55,
						o: 0.8
					});
					springBackground.set({
						x: 20 + Math.sin(r) * 20,
						y: 20 + Math.cos(r) * 20
					});
				}, 20);
				showcaseTimerEnd = setTimeout(() => {
					clearInterval(showcaseInterval);
					interactEnd(null, 0);
				}, 4000);
			}, startDelay);
		}
	});

	onDestroy(() => {
		if (browser) document.removeEventListener('visibilitychange', handleVisibility);
		clearTimeout(repositionTimer);
		clearTimeout(showcaseTimerStart);
		clearTimeout(showcaseTimerEnd);
		clearInterval(showcaseInterval);
	});
</script>

<svelte:window on:scroll={reposition} />

<div
	class="card {rTypes} / interactive /"
	class:active
	class:interacting
	class:masked={!!mask}
	data-number={rNumber}
	data-set={rSet}
	data-subtypes={rSubtypes}
	data-supertype={rSupertype}
	data-rarity={rRarity}
	data-trainer-gallery={rTrainerGallery}
	style={dynamicStyles}
	bind:this={thisCard}
>
	<div class="card__translater">
		<button
			class="card__rotator"
			on:click={activate}
			on:pointermove={interact}
			on:mouseout={interactEnd}
			on:blur={deactivate}
			aria-label={name ? `הגדל את הקלף: ${name}` : 'הגדל את הקלף'}
			tabindex="0"
		>
			{#if back}
				<img class="card__back" src={back} alt="גב הקלף" loading="lazy" />
			{:else}
				<div class="card__back" aria-hidden="true"></div>
			{/if}
			<div class="card__front" style={staticStyles + foilStyles}>
				<slot />
				<div class="card__shine"></div>
				<div class="card__glare"></div>
			</div>
		</button>
	</div>
</div>

<style>
	:root {
		--pointer-x: 50%;
		--pointer-y: 50%;
		--card-scale: 1;
		--card-opacity: 0;
		--translate-x: 0px;
		--translate-y: 0px;
		--rotate-x: 0deg;
		--rotate-y: 0deg;
		--background-x: var(--pointer-x);
		--background-y: var(--pointer-y);
		--pointer-from-center: 0;
		--pointer-from-top: var(--pointer-from-center);
		--pointer-from-left: var(--pointer-from-center);
	}
</style>
