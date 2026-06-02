<script>
  import { onMount, onDestroy } from 'svelte';

  const START = new Date('2016-06-14');
  const NOW   = new Date();
  const DAYS  = Math.floor((NOW - START) / 86400000);
  const YEARS = NOW.getFullYear() - START.getFullYear();

  // Particle system
  const PARTICLES = Array.from({ length: 60 }, (_, i) => ({
    x:     5 + (i * 41 % 90),
    y:     5 + (i * 67 % 90),
    size:  2 + (i % 5),
    dur:   2 + (i % 6) * 0.5,
    delay: (i % 12) * 0.2,
    type:  i % 3, // 0=gold circle, 1=silver star, 2=heart
  }));

  const MILESTONES = [
    { year: 2016, label: 'החתונה', icon: '💍' },
    { year: 2017, label: 'שנה ראשונה', icon: '🌹' },
    { year: 2018, label: 'הבכור נולד', icon: '👶' },
    { year: 2020, label: 'בית חדש', icon: '🏠' },
    { year: 2023, label: 'ילד שני', icon: '👶' },
    { year: 2026, label: 'עשור! 🎉', icon: '✨' },
  ];

  let countUp = 0;
  let interval;
  onMount(() => {
    let v = 0;
    interval = setInterval(() => {
      v += Math.ceil(DAYS / 80);
      if (v >= DAYS) { v = DAYS; clearInterval(interval); }
      countUp = v;
    }, 16);
  });
  onDestroy(() => clearInterval(interval));
</script>

<svelte:head><title>עשור של אהבה 💍</title></svelte:head>

<div class="anni-page">

  <!-- particles backdrop -->
  <div class="particles" aria-hidden="true">
    {#each PARTICLES as p}
      <span
        class="p p--{p.type}"
        style="left:{p.x}%;top:{p.y}%;width:{p.size}px;height:{p.size}px;--dur:{p.dur}s;--delay:{p.delay}s;"
      ></span>
    {/each}
  </div>

  <!-- glow rings -->
  <div class="ring ring-1" aria-hidden="true"></div>
  <div class="ring ring-2" aria-hidden="true"></div>

  <!-- hero content -->
  <div class="hero-content">
    <div class="diamond" aria-hidden="true">💍</div>
    <p class="eyebrow">חוגגים</p>
    <h1 class="main-title">
      <span class="num-title">{YEARS}</span>
      <span class="word-title">שנות נישואין</span>
    </h1>

    <div class="names-line">
      <span class="name-gold">נתנאל</span>
      <span class="names-amp">&</span>
      <span class="name-silver">אלמוג אסתר</span>
    </div>

    <!-- animated days counter -->
    <div class="counter-block">
      <div class="counter-num">{countUp.toLocaleString('he-IL')}</div>
      <div class="counter-label">ימים של אהבה</div>
    </div>

    <!-- divider -->
    <hr class="gold-divider" />

    <!-- milestones -->
    <div class="milestones">
      {#each MILESTONES as m, i}
        <div class="milestone" style="animation-delay:{0.3 + i * 0.12}s">
          <span class="m-icon">{m.icon}</span>
          <span class="m-year">{m.year}</span>
          <span class="m-label">{m.label}</span>
        </div>
      {/each}
    </div>

    <div class="anni-actions">
      <a href="/album" class="btn btn-gold btn-lg">📚 האלבום שלנו</a>
      <a href="/packs" class="btn btn-glass">פתחו חבילה ביחד</a>
    </div>

    <p class="quote">"אהבה אמיתית היא כשכל שנה היא טובה יותר מהשנה הקודמת"</p>
    <a href="/" class="back-home">← חזרה לבית</a>
  </div>
</div>

<style>
  .anni-page {
    position: relative;
    min-height: 100dvh;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    padding: calc(var(--nav-top-h) + var(--sp-8)) var(--sp-4) calc(var(--nav-bot-h) + var(--sp-8));
    text-align: center;
  }

  /* ── Background effects ────────────────────────────────────── */
  .particles { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
  .p {
    position: absolute;
    border-radius: 50%;
    opacity: 0;
    animation: pFloat var(--dur) ease-in-out var(--delay) infinite;
  }
  .p--0 { background: var(--gold);   box-shadow: 0 0 6px var(--gold-glow); }
  .p--1 { background: var(--silver); clip-path: polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%); border-radius: 0; }
  .p--2 { background: var(--heart);  clip-path: path('M 6 2 C 4 0 0 0 0 4 C 0 8 6 13 6 13 C 6 13 12 8 12 4 C 12 0 8 0 6 2 Z'); border-radius: 0; }

  @keyframes pFloat {
    0%   { opacity:0; transform: translateY(0) scale(0.5); }
    20%  { opacity:0.9; }
    80%  { opacity:0.6; }
    100% { opacity:0; transform: translateY(-80px) scale(1.2); }
  }

  .ring {
    position: absolute;
    border-radius: 50%;
    border: 1px solid;
    pointer-events: none;
    z-index: 0;
    animation: ringPulse 6s ease-in-out infinite;
  }
  .ring-1 {
    width: 600px; height: 600px;
    border-color: rgba(245,196,81,0.08);
    top: 50%; left: 50%;
    transform: translate(-50%,-50%);
  }
  .ring-2 {
    width: 900px; height: 900px;
    border-color: rgba(245,196,81,0.04);
    top: 50%; left: 50%;
    transform: translate(-50%,-50%);
    animation-delay: 1.5s;
  }
  @keyframes ringPulse {
    0%,100% { transform: translate(-50%,-50%) scale(1); opacity: 0.6; }
    50%      { transform: translate(-50%,-50%) scale(1.05); opacity: 1; }
  }

  /* ── Content ───────────────────────────────────────────────── */
  .hero-content {
    position: relative;
    z-index: 1;
    max-width: 600px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--sp-5);
    animation: fadeUp 0.8s var(--ease-out);
  }

  .diamond { font-size: 3rem; animation: spin 8s linear infinite; display: inline-block; }

  .eyebrow {
    font-size: var(--text-sm);
    color: var(--gold-dim);
    font-weight: 600;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    margin: 0;
  }

  .main-title {
    margin: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
    line-height: 1;
  }
  .num-title {
    font-size: clamp(5rem, 20vw, 10rem);
    font-weight: 900;
    background: linear-gradient(135deg, var(--gold-dim), var(--gold), var(--gold-bright));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1;
    filter: drop-shadow(0 0 30px rgba(245,196,81,0.4));
  }
  .word-title {
    font-size: clamp(1.2rem, 5vw, 2.2rem);
    color: var(--silver);
    font-weight: 400;
    letter-spacing: 0.1em;
  }

  .names-line {
    font-size: clamp(1.2rem, 4vw, 1.8rem);
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 0.5em;
    flex-wrap: wrap;
    justify-content: center;
  }
  .name-gold   { color: var(--gold); }
  .name-silver { color: var(--silver); }
  .names-amp   { color: var(--ink-dim); font-weight: 400; }

  /* counter */
  .counter-block {
    background: var(--glass-gold);
    border: 1px solid var(--glass-gold-border);
    border-radius: var(--r-xl);
    padding: var(--sp-5) var(--sp-10);
    backdrop-filter: blur(12px);
  }
  .counter-num {
    font-size: clamp(2.5rem, 10vw, 5rem);
    font-weight: 900;
    color: var(--gold);
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
  .counter-label {
    font-size: var(--text-sm);
    color: var(--ink-dim);
    margin-top: var(--sp-1);
  }

  /* milestones timeline */
  .milestones {
    display: flex;
    gap: var(--sp-4);
    flex-wrap: wrap;
    justify-content: center;
    margin: var(--sp-2) 0;
  }
  .milestone {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--sp-1);
    animation: fadeUp 0.5s var(--ease-out) both;
  }
  .m-icon  { font-size: 1.4rem; }
  .m-year  { font-size: var(--text-xs); color: var(--gold-dim); font-weight: 700; }
  .m-label { font-size: var(--text-xs); color: var(--ink-dim); }

  .anni-actions {
    display: flex;
    gap: var(--sp-3);
    flex-wrap: wrap;
    justify-content: center;
  }

  .quote {
    font-style: italic;
    color: var(--ink-dim);
    font-size: var(--text-sm);
    max-width: 380px;
    line-height: 1.7;
    margin: 0;
  }

  .back-home {
    font-size: var(--text-sm);
    color: var(--ink-dim);
    text-decoration: none;
  }
  .back-home:hover { color: var(--gold); }
</style>
