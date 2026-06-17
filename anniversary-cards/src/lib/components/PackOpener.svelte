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
		else { phase = 'done'; after(50, () => dispatch('done')); }
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

	/* המשך → capture each NEW summary card's on-screen rect, hand off to the album reveal.
	   Dedupe by card number so a slot animates once even if the pack held two copies. */
	function onContinue() {
		const seen = new Set();
		const newCards = [];
		const sourceRects = [];
		cards.forEach((c, i) => {
			if (!c.isNew || c.cardNumber == null || seen.has(c.cardNumber)) return;
			seen.add(c.cardNumber);
			const el = gridCells[i];
			const r = el ? el.getBoundingClientRect() : null;
			newCards.push(c);
			sourceRects.push(r ? { left: r.left, top: r.top, width: r.width, height: r.height } : null);
		});
		dispatch('continue', { newCards, sourceRects });
	}

	/* particles */
	const tierParticles = { common: 10, rare: 16, epic: 28, legendary: 44 };
	$: particleCount = tierParticles[burstTier] || 0;
	$: particles = Array.from({ length: particleCount }, (_, i) => {
		const a = (i / Math.max(1, particleCount)) * Math.PI * 2 + (i % 3);
		const dist = 130 + (i % 5) * 52;
		return { x: Math.cos(a) * dist, y: Math.sin(a) * dist, d: 0.6 + (i % 4) * 0.18, delay: (i % 6) * 0.02 };
	});

	/* tear guide — matches the clip-path zigzag exactly */
	const TEAR_PTS = [[0,13],[10,20],[20,14],[30,21],[40,14],[50,20],[60,14],[70,21],[80,14],[90,20],[100,15]];
	function tearY(x) {
		for (let i = 0; i < TEAR_PTS.length - 1; i++) {
			const [x1,y1] = TEAR_PTS[i], [x2,y2] = TEAR_PTS[i+1];
			if (x >= x1 && x <= x2) return y1 + (x-x1)/(x2-x1)*(y2-y1);
		}
		return 16;
	}

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
					<div class="pack__body" style="background-image:url({packImage});background-position:{packImagePosition}"></div>
					<div
						class="pack__top"
						class:settle={tearSettle}
						style="--p:{tearProgress};background-image:url({packImage});background-position:{packImagePosition}"
					></div>

					<!-- Tear guide line -->
					<svg class="tear-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
						<defs>
							<filter id="tg-outer" x="-40%" y="-400%" width="180%" height="900%">
								<feGaussianBlur stdDeviation="2.8"/>
							</filter>
							<filter id="tg-mid" x="-20%" y="-250%" width="140%" height="600%">
								<feGaussianBlur stdDeviation="1.1"/>
							</filter>
							<filter id="tg-spark" x="-600%" y="-600%" width="1300%" height="1300%">
								<feGaussianBlur stdDeviation="2.2" result="b"/>
								<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
							</filter>
						</defs>

						<!-- Idle hint: subtle dashed pulse -->
						<polyline class="tl-hint"
							points="0,13 10,20 20,14 30,21 40,14 50,20 60,14 70,21 80,14 90,20 100,15"/>

						<!-- Outer diffuse gold glow (reveals L→R) -->
						<polyline class="tl-outer"
							points="0,13 10,20 20,14 30,21 40,14 50,20 60,14 70,21 80,14 90,20 100,15"
							pathLength="120"
							style="stroke-dashoffset:{(120*(1-tearProgress)).toFixed(2)}"
							filter="url(#tg-outer)"/>

						<!-- Mid warm glow -->
						<polyline class="tl-mid"
							points="0,13 10,20 20,14 30,21 40,14 50,20 60,14 70,21 80,14 90,20 100,15"
							pathLength="120"
							style="stroke-dashoffset:{(120*(1-tearProgress)).toFixed(2)}"
							filter="url(#tg-mid)"/>

						<!-- Bright white core -->
						<polyline class="tl-core"
							points="0,13 10,20 20,14 30,21 40,14 50,20 60,14 70,21 80,14 90,20 100,15"
							pathLength="120"
							style="stroke-dashoffset:{(120*(1-tearProgress)).toFixed(2)}"/>

						<!-- Moving spark at the tear tip -->
						{#if tearProgress > 0.01 && tearProgress < 0.99}
							<circle class="tl-spark"
								cx={tearProgress * 100}
								cy={tearY(tearProgress * 100)}
								r="1.4"
								filter="url(#tg-spark)"/>
						{/if}
					</svg>
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
						<div class="pile-bg" style="background-image:url({packImage});background-position:{packImagePosition}"></div>
					</div>
				{/each}

				{#key index}
					<div
						class="current"
						class:flying
						class:dragging
						style="transform: {curTransform}; z-index: 50;"
					>
						{#if faceUp && cards[index]?.isNew}
							<div class="new-badge-reveal" dir="rtl">✦ חדש</div>
						{/if}
						<div class="flip" class:front={faceUp}>
							<div class="face face--back"><div class="pack-back-bg" style="background-image:url({packImage});background-position:{packImagePosition}"></div></div>
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
						{#if c.isNew}
							<div class="new-badge-grid" dir="rtl" style="--delay:{i * 70 + 320}ms">חדש</div>
						{/if}
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
		<div class="actions">
			<button class="again continue-btn" on:click={onContinue}>המשך →</button>
			<button class="again" on:click={reset}>פתחו חבילה נוספת 🎴</button>
		</div>
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
		background-size: 300% auto;
		background-repeat: no-repeat;
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
	.pile-bg {
		width: 100%;
		height: 100%;
		background-size: 300% auto;
		background-repeat: no-repeat;
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
	.pack-back-bg {
		width: 100%;
		height: 100%;
		background-size: 300% auto;
		background-repeat: no-repeat;
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
	.continue-btn {
		background: linear-gradient(135deg, #c89a1a, #f5c451);
		border-color: transparent;
		color: #1a1208;
		box-shadow: 0 6px 18px rgba(245, 196, 81, 0.35);
	}
	.continue-btn:hover {
		background: linear-gradient(135deg, #d4a521, #ffd472);
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

	/* ── Tear guide line ─────────────────────────────────── */
	.tear-svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		overflow: visible;
		pointer-events: none;
		z-index: 6;
	}

	/* Subtle idle dashed hint — tells user where to tear */
	.tl-hint {
		fill: none;
		stroke: rgba(245, 196, 81, 0.32);
		stroke-width: 0.45;
		stroke-dasharray: 1.6 2.6;
		animation: tlHintPulse 2.4s ease-in-out infinite;
	}

	/* Outer diffuse gold glow (L→R reveal) */
	.tl-outer {
		fill: none;
		stroke: rgba(245, 196, 81, 0.6);
		stroke-width: 4.5;
		stroke-dasharray: 120;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	/* Mid warm glow */
	.tl-mid {
		fill: none;
		stroke: rgba(255, 222, 100, 0.85);
		stroke-width: 1.8;
		stroke-dasharray: 120;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	/* Bright white razor core */
	.tl-core {
		fill: none;
		stroke: rgba(255, 255, 255, 0.96);
		stroke-width: 0.45;
		stroke-dasharray: 120;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	/* Moving spark at the tip */
	.tl-spark {
		fill: white;
		animation: tlSparkPulse 0.18s ease-in-out infinite alternate;
	}

	@keyframes tlHintPulse {
		0%, 100% { opacity: 0.55; }
		50%       { opacity: 1; }
	}
	@keyframes tlSparkPulse {
		from { opacity: 0.8; r: 1.2; }
		to   { opacity: 1;   r: 1.7; }
	}
	@media (prefers-reduced-motion: reduce) {
		.tl-hint, .tl-spark { animation: none; }
	}

	/* ── "New card" badges ───────────────────────────────────── */

	/* Floating pill centered above the card during reveal */
	.new-badge-reveal {
		position: absolute;
		top: -3.4rem;
		left: 50%;
		z-index: 200;
		overflow: hidden;
		font-family: 'Heebo', sans-serif;
		font-size: 0.9rem;
		font-weight: 800;
		letter-spacing: 0.07em;
		white-space: nowrap;
		padding: 0.42em 1.15em;
		border-radius: 999px;
		background: linear-gradient(135deg, rgba(8,4,18,0.94) 0%, rgba(16,9,28,0.9) 100%);
		border: 1px solid rgba(245,196,81,0.65);
		color: #f5c451;
		box-shadow:
			0 0 14px rgba(245,196,81,0.55),
			0 0 34px rgba(245,196,81,0.2),
			0 3px 12px rgba(0,0,0,0.65),
			inset 0 1px 0 rgba(255,255,255,0.1);
		pointer-events: none;
		/* keep translateX(-50%) in every keyframe so it isn't overridden */
		animation:
			newRevealPop   0.5s cubic-bezier(0.2, 0.9, 0.3, 1.4) 0.65s both,
			newRevealPulse 2.6s ease-in-out infinite 1.2s;
	}

	/* Shimmer sweep */
	.new-badge-reveal::after {
		content: '';
		position: absolute;
		top: 0; left: -55%;
		width: 45%; height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
		transform: skewX(-18deg);
		animation: newRevealShimmer 3s ease-in-out infinite 1.7s;
	}

	/* Small corner badge on the grid summary */
	.new-badge-grid {
		position: absolute;
		top: -0.72rem;
		right: -0.38rem;
		z-index: 20;
		font-family: 'Heebo', sans-serif;
		font-size: 0.6rem;
		font-weight: 800;
		letter-spacing: 0.06em;
		white-space: nowrap;
		padding: 0.22em 0.6em;
		border-radius: 999px;
		background: linear-gradient(135deg, rgba(8,4,18,0.93), rgba(16,9,28,0.88));
		border: 1px solid rgba(245,196,81,0.6);
		color: #f5c451;
		box-shadow:
			0 0 9px rgba(245,196,81,0.55),
			0 2px 6px rgba(0,0,0,0.55);
		pointer-events: none;
		animation: newGridPop 0.44s cubic-bezier(0.2, 0.9, 0.3, 1.4) both;
		animation-delay: var(--delay, 300ms);
	}

	@keyframes newRevealPop {
		from { opacity: 0; transform: translateX(-50%) scale(0.4) translateY(8px); }
		to   { opacity: 1; transform: translateX(-50%) scale(1)   translateY(0);   }
	}
	@keyframes newRevealPulse {
		0%, 100% {
			box-shadow:
				0 0 14px rgba(245,196,81,0.55), 0 0 34px rgba(245,196,81,0.2),
				0 3px 12px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.1);
		}
		50% {
			box-shadow:
				0 0 22px rgba(245,196,81,0.9), 0 0 54px rgba(245,196,81,0.38),
				0 3px 12px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.1);
		}
	}
	@keyframes newRevealShimmer {
		0%        { left: -55%; }
		35%, 100% { left: 115%; }
	}
	@keyframes newGridPop {
		from { opacity: 0; transform: scale(0.3) translateY(-6px); }
		to   { opacity: 1; transform: scale(1)   translateY(0);    }
	}
	@media (prefers-reduced-motion: reduce) {
		.new-badge-reveal, .new-badge-grid { animation: none; opacity: 1; }
		.new-badge-reveal { transform: translateX(-50%); }
		.new-badge-reveal::after { display: none; }
	}
</style>
