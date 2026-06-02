/**
 * Sound engine for the pack-opening experience.
 * - playFlip: uses the real card-slide MP3 asset.
 * - playTear / playReveal: synthesized Web Audio (no extra files).
 * All calls are no-ops on the server or when muted.
 * The AudioContext is created lazily on the first sound so autoplay
 * policies are satisfied (it always follows a user gesture).
 */
import { browser } from '$app/environment';

let ctx = null;
let muted = false;

// decoded AudioBuffer for the card-slide sample, loaded once
let cardSliceBuf = null;
let cardSliceLoading = false;

export function setMuted(v) {
	muted = !!v;
}
export function isMuted() {
	return muted;
}

function ac() {
	if (!browser || muted) return null;
	if (!ctx) {
		const AC = window.AudioContext || window.webkitAudioContext;
		if (!AC) return null;
		ctx = new AC();
	}
	if (ctx.state === 'suspended') ctx.resume();
	return ctx;
}

/** Load and decode the card-slide MP3 once, cache the AudioBuffer. */
async function loadCardSlice() {
	const c = ac();
	if (!c || cardSliceBuf || cardSliceLoading) return;
	cardSliceLoading = true;
	try {
		const res = await fetch('/sounds/card-slide.mp3');
		const ab = await res.arrayBuffer();
		cardSliceBuf = await c.decodeAudioData(ab);
	} catch (e) {
		console.warn('card-slide.mp3 failed to load, falling back to synth', e);
	}
	cardSliceLoading = false;
}

// Kick off the load as soon as this module is imported in the browser
if (browser) loadCardSlice();

/** Card slide / flip — real MP3 asset, falls back to synth if not loaded yet. */
export function playFlip() {
	const c = ac();
	if (!c) return;

	if (cardSliceBuf) {
		const src = c.createBufferSource();
		src.buffer = cardSliceBuf;
		const g = c.createGain();
		g.gain.value = 0.75;
		src.connect(g);
		g.connect(c.destination);
		src.start();
		return;
	}

	// synth fallback while the buffer is still loading
	const t = c.currentTime;
	const o = c.createOscillator();
	o.type = 'triangle';
	o.frequency.setValueAtTime(420, t);
	o.frequency.exponentialRampToValueAtTime(160, t + 0.09);
	const g = c.createGain();
	g.gain.value = 0.22;
	o.connect(g);
	g.connect(c.destination);
	g.gain.setValueAtTime(0.22, t);
	g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
	o.start(t);
	o.stop(t + 0.13);
}

/** soft filtered-noise swell — the pack tearing open */
export function playTear() {
	const c = ac();
	if (!c) return;
	const t = c.currentTime;
	const dur = 0.55;
	const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
	const data = buf.getChannelData(0);
	for (let i = 0; i < data.length; i++) {
		data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
	}
	const src = c.createBufferSource();
	src.buffer = buf;
	const bp = c.createBiquadFilter();
	bp.type = 'bandpass';
	bp.frequency.setValueAtTime(1200, t);
	bp.frequency.exponentialRampToValueAtTime(3500, t + dur);
	bp.Q.value = 0.8;
	const g = c.createGain();
	g.gain.setValueAtTime(0.0001, t);
	g.gain.exponentialRampToValueAtTime(0.5, t + 0.06);
	g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
	src.connect(bp);
	bp.connect(g);
	g.connect(c.destination);
	src.start(t);
	src.stop(t + dur);
}

/**
 * sparkle/chime on reveal; richness scales with tier.
 * common: single soft note. rare/epic/legendary: ascending arpeggio + shimmer.
 */
export function playReveal(tier = 'common') {
	const c = ac();
	if (!c) return;
	const t = c.currentTime;
	const scales = {
		common: [523.25],
		rare: [523.25, 659.25],
		epic: [523.25, 659.25, 783.99],
		legendary: [523.25, 659.25, 783.99, 1046.5, 1318.51]
	};
	const notes = scales[tier] || scales.common;
	notes.forEach((freq, i) => {
		const start = t + i * 0.085;
		const o = c.createOscillator();
		o.type = 'sine';
		o.frequency.value = freq;
		const g = c.createGain();
		const peak = tier === 'legendary' ? 0.3 : 0.22;
		g.gain.setValueAtTime(0.0001, start);
		g.gain.exponentialRampToValueAtTime(peak, start + 0.02);
		g.gain.exponentialRampToValueAtTime(0.0001, start + 0.6);
		o.connect(g);
		g.connect(c.destination);
		o.start(start);
		o.stop(start + 0.65);
	});
}
