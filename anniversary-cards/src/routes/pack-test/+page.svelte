<script>
	import { onDestroy } from 'svelte';
	import PackOpener from '$lib/components/PackOpener.svelte';
	import { EFFECTS, EFFECT_IDS, TIER_LABELS } from '$lib/effects.js';
	import { collection } from '$lib/stores/collection.js';
	import { toDataURL } from '$lib/utils.js';

	const tiers = Object.keys(TIER_LABELS);

	// a default 5-card deck that shows off the tier flair
	// Each has a cardNumber so opening the pack saves them to the album
	let deck = [
		{ effect: 'holo',     rarityTier: 'rare',      title: 'הטיול הראשון',  date: 'אביב 2014',       cardNumber: 1,  year: 2014 },
		{ effect: 'cosmos',   rarityTier: 'rare',      title: 'מתחת לכוכבים', date: 'קיץ 2015',         cardNumber: 2,  year: 2015 },
		{ effect: 'v_fullart',rarityTier: 'epic',      title: 'יום החתונה',   date: '14 ביוני 2016',    cardNumber: 3,  year: 2016 },
		{ effect: 'rainbow',  rarityTier: 'legendary', title: 'הבכור נולד',   date: 'חורף 2018',        cardNumber: 4,  year: 2018 },
		{ effect: 'secret',   rarityTier: 'legendary', title: 'עשור של אהבה', date: '2026',             cardNumber: 5,  year: 2026 }
	];

	let photo = '/pack-image.png';
	let photoName = '(תמונת ברירת מחדל)';
	let sound = true;
	let runKey = 0; // remount the opener to apply deck/photo changes

	const sampleDesc = 'רגע קטן שנשאר איתנו לנצח. ❤️';

	$: cards = deck.map((d) => ({
		...d,
		photo,
		description: sampleDesc
	}));

	function onPhoto(e) {
		const file = e.target.files?.[0];
		if (!file) return;
		if (photo.startsWith('blob:')) URL.revokeObjectURL(photo);
		photo = URL.createObjectURL(file);
		photoName = file.name;
		restart();
	}

	function randomize() {
		deck = deck.map(() => {
			const effect = EFFECT_IDS[Math.floor(Math.random() * EFFECT_IDS.length)];
			return {
				effect,
				rarityTier: EFFECTS[effect].tier,
				title: 'קלף אקראי',
				date: '— בדיקה —'
			};
		});
		restart();
	}

	function restart() {
		runKey += 1;
	}

	function onPackReset() {
		// cards were already saved when the pack finished — nothing to do on replay
	}

	async function onPackDone() {
		for (const c of cards) {
			if (!c.cardNumber) continue;
			const persistedPhoto = await toDataURL(c.photo);
			collection.addCard({ ...c, photo: persistedPhoto, description: sampleDesc });
		}
	}

	onDestroy(() => {
		if (photo.startsWith('blob:')) URL.revokeObjectURL(photo);
	});
</script>

<svelte:head>
	<title>בדיקת פתיחת חבילה</title>
</svelte:head>

<main>
	<header>
		<h1>🎁 סימולטור פתיחת חבילה</h1>
		<p>זו סביבת בדיקה לאנימציה בלבד. בחרו אפקטים/נדירויות, לחצו על החבילה ופִתחו.</p>
	</header>

	<section class="opener-area">
		{#key runKey}
			<PackOpener {cards} {sound} on:done={onPackDone} on:reset={onPackReset} />
		{/key}
	</section>

	<details class="controls" open>
		<summary>הגדרות בדיקה</summary>

		<div class="row">
			<label class="file">
				תמונה לכל הקלפים:
				<input type="file" accept="image/*" on:change={onPhoto} />
				<span class="hint">{photoName}</span>
			</label>
			<label class="toggle">
				<input type="checkbox" bind:checked={sound} />
				צליל
			</label>
			<button on:click={randomize}>אקראי 🎲</button>
			<button on:click={restart}>אתחל</button>
		</div>

		<div class="deck">
			{#each deck as card, i}
				<div class="deck-card">
					<span class="num">{i + 1}</span>
					<select bind:value={card.effect} on:change={restart}>
						{#each EFFECT_IDS as id}
							<option value={id}>{EFFECTS[id].label}</option>
						{/each}
					</select>
					<select bind:value={card.rarityTier} on:change={restart}>
						{#each tiers as t}
							<option value={t}>{TIER_LABELS[t]}</option>
						{/each}
					</select>
				</div>
			{/each}
		</div>
	</details>
</main>

<style>
	main {
		max-width: 1100px;
		margin: 0 auto;
		padding: clamp(1rem, 3vw, 2rem);
	}
	header h1 {
		font-size: clamp(1.6rem, 5vw, 2.6rem);
	}
	header p {
		color: var(--ink-dim);
		margin: 0 0 1rem;
	}
	.opener-area {
		min-height: 70vh;
	}

	.controls {
		margin-top: 1.5rem;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 16px;
		padding: 1rem 1.25rem;
	}
	.controls summary {
		cursor: pointer;
		font-weight: 700;
		color: var(--ink-dim);
	}
	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1rem;
		margin: 1rem 0;
	}
	.file,
	.toggle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
		color: var(--ink-dim);
	}
	.hint {
		font-size: 0.75rem;
		opacity: 0.7;
	}
	.row button {
		padding: 0.5rem 1rem;
		border-radius: 10px;
		border: 1px solid rgba(255, 255, 255, 0.16);
		background: rgba(0, 0, 0, 0.25);
		color: var(--ink);
		cursor: pointer;
	}
	.row button:hover {
		border-color: var(--gold-muted);
	}

	.deck {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 0.75rem;
	}
	.deck-card {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		background: rgba(0, 0, 0, 0.25);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 10px;
		padding: 0.5rem;
	}
	.deck-card .num {
		width: 1.6rem;
		height: 1.6rem;
		flex: none;
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: rgba(245, 196, 81, 0.2);
		font-weight: 700;
		font-size: 0.8rem;
	}
	.deck-card select {
		flex: 1;
		min-width: 0;
		padding: 0.4rem;
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.14);
		background: #1a0b2e;
		color: var(--ink);
		font: inherit;
		font-size: 0.85rem;
	}
</style>
