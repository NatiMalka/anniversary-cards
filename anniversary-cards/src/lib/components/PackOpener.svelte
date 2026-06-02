<script>
	import { onDestroy, createEventDispatcher } from 'svelte';
	import CardFront from './CardFront.svelte';
	import { playTear, playFlip, playReveal, setMuted } from '../sound.js';
	import { activeCard } from '../stores/activeCard.js';

	/** up to 5 card objects: {effect, photo, title, date, description, rarityTier, isFlat} */
	export let cards = [];
	export let packImage = '/pack-image.png';
	/** object-position for sprite-sheet packs: '0% 50%' | '50% 50%' | '100% 50%' */
	export let packImagePosition = '50% 50%';
	export let sound = true;

	const dispatch = createEventDispatcher();

	// phase: idle -> tearing(drag) -> reveal(swipe stack) -> done(3+2 grid)
	let phase = 'idle';
	let index = 0; // which card is currently on top of the stack
	let faceUp = false; // current card flipped to front

	// flair
	let burstTier = '';
	let burstKey = 0;
	let flashKey = 0;

	// pack tear drag
	let tearing = false;
	let tearProgress = 0;
	let tearStartX = 0;
	let tearSettle = false;

	// current-card swipe drag
	let dragging = false;
	let dragX = 0;
	let dragY = 0;
	let startX = 0;
	let startY = 0;
	let flying = false;
	let flyX = 0;
	let flyY = 0;

	let timers = [];
	const after = (ms, fn) => {
		const id = setTimeout(fn, ms);
		timers.push(id);
		return id;
	};
	const clearTimers = () => {
		timers.forEach(clearTimeout);
		timers = [];
	};

	$: setMuted(!sound);

	function fireBurst(tier) {
		burstTier = tier;
		burstKey += 1;
		flashKey += 1;
	}

	/* ---------------- PACK TEAR ---------------- */
	function tearDown(e) {
		if (phase !== 'idle') return;
		tearing = true;
		tearSettle = false;
		tearStartX = e.clientX;
		e.currentTarget.setPointerCapture?.(e.pointerId);
	}
	function tearMove(e) {
		if (!tearing) return;
		const w = e.currentTarget.getBoundingClientRect().width;
		tearProgress = Math.max(0, Math.min(1, Math.abs(e.clientX - tearStartX) / (w * 0.7)));
	}
	function tearUp() {
		if (!tearing) return;
		tearing = false;
		tearSettle = true;
		if (tearProgress > 0.5) completeTear();
		else tearProgress = 0;
	}
	function completeTear() {
		phase = 'tearing';
		tearProgress = 1;
		if (sound) playTear();
		fireBurst('legendary');
		after(700, startReveal);
	}

	/* ---------------- REVEAL (swipe stack) ---------------- */
	function startReveal() {
		phase = 'reveal';
		index = 0;
		showCurrent();
	}
	function showCurrent() {
		faceUp = false;
		flying = false;
		dragX = 0;
		dragY = 0;
		after(160, () => {
			faceUp = true;
			const tier = cards[index].rarityTier;
			if (sound) {
				playFlip();
				after(140, () => playReveal(tier));
			}
			if (tier === 'epic' || tier === 'legendary') fireBurst(tier);
		});
	}
	function nextCard() {
		index += 1;
		if (index < cards.length) showCurrent();
		else after(50, () => { phase = 'done'; dispatch('done'); });
	}

	function curDown(e) {
		if (phase !== 'reveal' || flying || !faceUp) return;
		dragging = true;
		startX = e.clientX;
		startY = e.clientY;
		e.currentTarget.setPointerCapture?.(e.pointerId);
	}
	function curMove(e) {
		if (!dragging) return;
		dragX = e.clientX - startX;
		dragY = e.clientY - startY;
	}
	function curUp() {
		if (!dragging) return;
		dragging = false;
		const dist = Math.hypot(dragX, dragY);
		if (dist > 60) {
			// fling the card off-screen in the drag direction, then reveal next
			const ang = Math.atan2(dragY, dragX);
			flyX = Math.cos(ang) * 900;
			flyY = Math.sin(ang) * 900;
			flying = true;
			if (sound) playFlip();
			after(360, nextCard);
		} else {
			dragX = 0;
			dragY = 0;
		}
	}

	$: curTransform = flying
		? `translate(-50%,-50%) translate(${flyX}px, ${flyY}px) rotate(${flyX * 0.05}deg)`
		: `translate(-50%,-50%) translate(${dragX}px, ${dragY}px) rotate(${dragX * 0.05}deg)`;

	// faint pile behind the current card (remaining cards), capped for depth
	$: pileBehind = Math.min(Math.max(cards.length - index - 1, 0), 3);

	function reset() {
		clearTimers();
		phase = 'idle';
		index = 0;
		faceUp = false;
		tearProgress = 0;
		tearSettle = false;
		dragX = dragY = flyX = flyY = 0;
		flying = false;
		burstTier = '';
		dispatch('reset');
	}

	/* grid cell refs — used to lift the active card above its siblings */
	let gridCells = [];
	$: activeGridIndex = gridCells.findIndex(el => el && $activeCard && el.contains($activeCard));

	/* particles */
	const tierParticles = { common: 10, rare: 16, epic: 28, legendary: 44 };
	$: particleCount = tierParticles[burstTier] || 0;
	$: particles = Array.from({ length: particleCount }, (_, i) => {
		const a = (i / Math.max(1, particleCount)) * Math.PI * 2 + (i % 3);
		const dist = 130 + (i % 5) * 52;
		return { x: Math.cos(a) * dist, y: Math.sin(a) * dist, d: 0.6 + (i % 4) * 0.18, delay: (i % 6) * 0.02 };
	});

	onDestroy(clearTimers);
</script>

<div class="opener">
	<div class="scene">
		<div class="rays" class:on={phase === 'tearing' || phase === 'reveal'}></div>

		<!-- PACK -->
		{#if phase === 'idle' || phase === 'tearing'}
			<div
				class="pack-wrap"
				class:tearing={phase === 'tearing'}
				on:pointerdown={tearDown}
				on:pointermove={tearMove}
				on:pointerup={tearUp}
				on:pointercancel={tearUp}
				role="button"
				tabindex="0"
				aria-label="גררו כדי לקרוע את החבילה"
				on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && completeTear()}
			>
				<div class="pack">
					<div class="pack__glow" style="--p:{tearProgress}"></div>
					<img class="pack__body" src={packImage} alt="" draggable="false" style="object-position:{packImagePosition}" />
					<img
						class="pack__top"
						class:settle={tearSettle}
						src={packImage}
						alt=""
						draggable="false"
						style="--p:{tearProgress}; object-position:{packImagePosition}"
					/>
				</div>
				{#if phase === 'idle'}<div class="hint">גררו ימינה כדי לקרוע ✂️</div>{/if}
			</div>
		{/if}

		<!-- REVEAL: focus on the top stacked card; swipe it away -->
		{#if phase === 'reveal'}
			<!-- drag is handled on the whole stage, so a press ANYWHERE drags the top card -->
			<div
				class="stack"
				on:pointerdown={curDown}
				on:pointermove={curMove}
				on:pointerup={curUp}
				on:pointercancel={curUp}
			>
				{#each Array(pileBehind) as _, k}
					<div
						class="pile"
						style="transform: translate(-50%,-50%) translate({(k + 1) * 7}px, {(k + 1) * 9}px) scale({0.97 - k * 0.02}) rotate({(k + 1) * 1.5}deg); z-index:{10 - k};"
					>
						<img src={packImage} alt="" draggable="false" style="object-position:{packImagePosition}" />
					</div>
				{/each}

				{#key index}
					<div
						class="current"
						class:flying
						class:dragging
						style="transform: {curTransform}; z-index: 50;"
					>
						<div class="flip" class:front={faceUp}>
							<div class="face face--back"><img src={packImage} alt="" draggable="false" style="object-position:{packImagePosition}" /></div>
							<div class="face face--front">
								<CardFront
									effect={cards[index].effect}
									photo={cards[index].photo}
									title={cards[index].title}
									date={cards[index].date}
									description={cards[index].description}
									rarityTier={cards[index].rarityTier}
									isFlat={cards[index].isFlat}
									back={packImage}
									showcase="quick"
								/>
							</div>
						</div>
					</div>
				{/key}

				{#if faceUp && !flying}<div class="swipe-hint">החליקו לכל כיוון →</div>{/if}
			</div>
		{/if}

		<!-- DONE: the full 3 + 2 grid -->
		{#if phase === 'done'}
			<div class="grid">
				{#each cards as c, i}
					<div
						class="grid-cell"
						style="animation-delay:{i * 70}ms; z-index:{activeGridIndex === i ? 1000 : 1};"
						bind:this={gridCells[i]}
					>
						<CardFront
							effect={c.effect}
							photo={c.photo}
							title={c.title}
							date={c.date}
							description={c.description}
							rarityTier={c.rarityTier}
							isFlat={c.isFlat}
							back={packImage}
						/>
					</div>
				{/each}
			</div>
		{/if}

		<!-- flair -->
		{#key flashKey}
			{#if phase !== 'idle'}<div class="flash flash--{burstTier}"></div>{/if}
		{/key}
		{#key burstKey}
			{#if particleCount}
				<div class="particles particles--{burstTier}">
					{#each particles as p}
						<span style="--px:{p.x}px; --py:{p.y}px; --d:{p.d}s; --delay:{p.delay}s;"></span>
					{/each}
				</div>
			{/if}
		{/key}
	</div>

	{#if phase === 'done'}
		<div class="actions"><button class="again" on:click={reset}>פתחו חבילה נוספת 🎴</button></div>
	{:else if phase === 'reveal'}
		<p class="progress">{Math.min(index + 1, cards.length)} / {cards.length}</p>
	{/if}
</div>

<style>
	.opener {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		width: 100%;
	}
	.scene {
		position: relative;
		width: 100%;
		min-height: 78vh;
		display: grid;
		place-items: center;
		perspective: 1500px;
		perspective-origin: 50% 45%;
		overflow: hidden;
		touch-action: none;
	}

	/* ---------------- PACK ---------------- */
	.pack-wrap {
		position: relative;
		width: min(340px, 76vw);
		aspect-ratio: 0.706;
		cursor: grab;
		transform-style: preserve-3d;
		animation: float 5s ease-in-out infinite;
		outline: none;
	}
	.pack-wrap:active {
		cursor: grabbing;
	}
	.pack {
		position: absolute;
		inset: 0;
		transform-style: preserve-3d;
	}
	.pack__glow {
		position: absolute;
		inset: -18%;
		background: radial-gradient(circle at 50% 45%, rgba(245, 196, 81, 0.45), rgba(245, 196, 81, 0.12) 45%, transparent 70%);
		filter: blur(8px);
		opacity: calc(0.5 + var(--p, 0) * 0.5);
		transform: translateZ(-40px) scale(calc(1 + var(--p, 0) * 0.4));
		animation: glowPulse 3.2s ease-in-out infinite;
	}
	.pack__body,
	.pack__top {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 14px;
		box-shadow: 0 30px 60px -20px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(245, 196, 81, 0.25);
		user-select: none;
	}
	.pack__body {
		clip-path: polygon(0% 13%, 10% 20%, 20% 14%, 30% 21%, 40% 14%, 50% 20%, 60% 14%, 70% 21%, 80% 14%, 90% 20%, 100% 15%, 100% 100%, 0% 100%);
	}
	.pack__top {
		clip-path: polygon(0% 0%, 100% 0%, 100% 15%, 90% 20%, 80% 14%, 70% 21%, 60% 14%, 50% 20%, 40% 14%, 30% 21%, 20% 14%, 10% 20%, 0% 13%);
		transform-origin: 50% 15%;
		transform: translateY(calc(var(--p, 0) * -46%)) rotateX(calc(var(--p, 0) * -165deg)) translateZ(calc(var(--p, 0) * 60px));
		opacity: calc(1 - var(--p, 0) * 0.9);
		z-index: 2;
	}
	.pack__top.settle {
		transition: transform 0.6s cubic-bezier(0.5, 0, 0.3, 1), opacity 0.6s ease;
	}
	.pack-wrap.tearing {
		animation: shake 0.42s ease-in-out;
	}
	.hint {
		position: absolute;
		bottom: -2.6rem;
		left: 50%;
		transform: translateX(-50%);
		white-space: nowrap;
		color: var(--gold, #f5c451);
		font-weight: 600;
		letter-spacing: 0.04em;
		animation: bobHint 2s ease-in-out infinite;
		text-shadow: 0 0 12px rgba(245, 196, 81, 0.4);
	}

	/* ---------------- REVEAL STACK ---------------- */
	.stack {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		pointer-events: auto;
		cursor: grab;
		touch-action: none;
	}
	.stack:active {
		cursor: grabbing;
	}
	.pile,
	.current {
		position: absolute;
		top: 50%;
		left: 50%;
		width: min(360px, 82vw);
		aspect-ratio: 0.718;
		transform-style: preserve-3d;
		/* the stage owns the drag; cards never intercept the pointer */
		pointer-events: none;
	}
	.pile {
		border-radius: 4.55% / 3.5%;
		overflow: hidden;
		box-shadow: 0 18px 40px -16px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(245, 196, 81, 0.25);
		opacity: 0.85;
	}
	.pile img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.current {
		transition: transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1);
	}
	.current.dragging {
		transition: none; /* track the pointer 1:1 while dragging */
	}
	.current.flying {
		transition: transform 0.4s ease-in, opacity 0.4s ease-in;
		opacity: 0;
	}

	.flip {
		position: relative;
		width: 100%;
		height: 100%;
		transform-style: preserve-3d;
		transform: rotateY(180deg);
		transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
	}
	.flip.front {
		transform: rotateY(0deg);
	}
	.face {
		position: absolute;
		inset: 0;
		backface-visibility: hidden;
		-webkit-backface-visibility: hidden;
		border-radius: 4.55% / 3.5%;
		transform-style: flat;
	}
	.face--back {
		transform: rotateY(180deg);
		overflow: hidden;
		box-shadow: 0 20px 45px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(245, 196, 81, 0.3);
	}
	.face--back img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.swipe-hint {
		position: absolute;
		bottom: 8%;
		left: 50%;
		transform: translateX(-50%);
		white-space: nowrap;
		color: var(--gold, #f5c451);
		font-weight: 600;
		animation: bobHint 1.6s ease-in-out infinite;
		pointer-events: none;
		z-index: 60;
		text-shadow: 0 0 10px rgba(0, 0, 0, 0.6);
	}

	/* ---------------- GRID (3 + 2) ---------------- */
	.grid {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-content: center;
		gap: clamp(0.75rem, 2.5vw, 1.75rem);
		max-width: 760px;
		width: 100%;
		padding: 1rem;
	}
	.grid-cell {
		width: clamp(150px, 28%, 220px);
		animation: popIn 0.5s cubic-bezier(0.2, 0.9, 0.3, 1.2) both;
		position: relative; /* required so z-index is respected among flex siblings */
	}

	/* ---------------- FLAIR ---------------- */
	.rays {
		position: absolute;
		width: 170%;
		aspect-ratio: 1;
		border-radius: 50%;
		background: repeating-conic-gradient(from 0deg, rgba(245, 196, 81, 0) 0deg, rgba(245, 196, 81, 0.18) 2deg, rgba(245, 196, 81, 0) 8deg);
		opacity: 0;
		transition: opacity 0.6s ease;
		pointer-events: none;
		mix-blend-mode: screen;
		animation: spin 18s linear infinite;
	}
	.rays.on {
		opacity: 0.7;
	}
	.flash {
		position: absolute;
		inset: -20%;
		pointer-events: none;
		background: radial-gradient(circle at center, rgba(255, 255, 255, 0.95), rgba(245, 196, 81, 0.6) 30%, transparent 65%);
		opacity: 0;
		animation: flash 0.6s ease-out;
		mix-blend-mode: screen;
	}
	.flash--epic {
		background: radial-gradient(circle at center, rgba(240, 236, 220, 0.95), rgba(200, 200, 212, 0.5) 35%, transparent 65%);
	}
	.flash--rare {
		background: radial-gradient(circle at center, rgba(186, 230, 255, 0.9), rgba(37, 99, 235, 0.45) 35%, transparent 65%);
	}
	.particles {
		position: absolute;
		inset: 0;
		pointer-events: none;
		display: grid;
		place-items: center;
	}
	.particles span {
		position: absolute;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: radial-gradient(circle, #fff, var(--gold, #f5c451) 60%, transparent 70%);
		box-shadow: 0 0 8px rgba(245, 196, 81, 0.9);
		animation: fly var(--d) ease-out var(--delay) both;
	}
	.particles--epic span {
		background: radial-gradient(circle, #fff, var(--silver) 60%, transparent 70%);
		box-shadow: 0 0 8px rgba(200, 200, 212, 0.8);
	}
	.particles--rare span {
		background: radial-gradient(circle, #fff, #4cc9f0 60%, transparent 70%);
	}

	.progress {
		color: var(--ink-dim);
		font-weight: 700;
		letter-spacing: 0.1em;
	}
	.actions {
		display: flex;
		gap: 1rem;
	}
	.again {
		padding: 0.8rem 1.6rem;
		border-radius: 999px;
		border: 1px solid rgba(245, 196, 81, 0.4);
		background: linear-gradient(135deg, rgba(245, 196, 81, 0.15), rgba(200, 200, 212, 0.12));
		color: var(--ink, #f0ece8);
		font-weight: 700;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}
	.again:hover {
		transform: translateY(-2px);
		background: linear-gradient(135deg, rgba(245, 196, 81, 0.3), rgba(200, 200, 212, 0.2));
	}

	/* ---------------- KEYFRAMES ---------------- */
	@keyframes float {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-14px); }
	}
	@keyframes glowPulse {
		0%, 100% { filter: blur(8px) brightness(1); }
		50% { filter: blur(10px) brightness(1.2); }
	}
	@keyframes bobHint {
		0%, 100% { opacity: 0.85; }
		50% { opacity: 1; }
	}
	@keyframes shake {
		0%, 100% { transform: translate(0, 0) rotateZ(0); }
		20% { transform: translate(-6px, 2px) rotateZ(-1.5deg); }
		40% { transform: translate(6px, -2px) rotateZ(1.5deg); }
		60% { transform: translate(-5px, 1px) rotateZ(-1deg); }
		80% { transform: translate(5px, -1px) rotateZ(1deg); }
	}
	@keyframes flash {
		0% { opacity: 0; transform: scale(0.6); }
		25% { opacity: 1; }
		100% { opacity: 0; transform: scale(1.5); }
	}
	@keyframes fly {
		0% { opacity: 1; transform: translate(0, 0) scale(1); }
		100% { opacity: 0; transform: translate(var(--px), var(--py)) scale(0.3); }
	}
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
	@keyframes popIn {
		0% { opacity: 0; transform: translateY(20px) scale(0.8); }
		100% { opacity: 1; transform: translateY(0) scale(1); }
	}
	@media (prefers-reduced-motion: reduce) {
		.pack-wrap, .pack__glow, .hint, .rays, .swipe-hint { animation: none !important; }
	}
</style>
