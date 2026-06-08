<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { savePool, getByNumber } from '$lib/stores/cardPool.js';
  import { supabase } from '$lib/supabase.js';
  import { EFFECTS, EFFECT_IDS, TIER_LABELS } from '$lib/effects.js';
  import CardFront from '$lib/components/CardFront.svelte';

  let editMode = false;

  onMount(async () => {
    const cardParam = $page.url.searchParams.get('card');
    if (cardParam) {
      const existing = await getByNumber(Number(cardParam));
      if (existing) {
        editMode = true;
        form = {
          cardNumber:  existing.card_number,
          effect:      existing.effect,
          title:       existing.title,
          description: existing.description,
          date:        existing.date,
          rarityTier:  existing.rarity_tier,
          isFlat:      existing.is_flat,
          photo:       existing.photo_url ?? '/pack-image.png',
          showFrame:   existing.show_frame ?? false,
          frameColor:  existing.frame_color ?? '#f5c451',
        };
        previewKey++;
      }
    }
  });

  const TIERS = ['common', 'rare', 'legendary'];
  const TIER_COLORS = { common: 'var(--ink-dim)', rare: 'var(--silver)', legendary: 'var(--gold)' };

  const FRAME_COLORS = [
    { value: '#f5c451', label: 'זהב' },
    { value: '#c8c8d4', label: 'כסף' },
    { value: '#e8e8f0', label: 'פלטינה' },
    { value: '#d4956a', label: 'ורד-זהב' },
    { value: '#b87333', label: 'נחושת' },
    { value: '#8b6914', label: 'ברונזה' },
    { value: '#111111', label: 'שחור' },
    { value: '#2e2e2e', label: 'אנתרציט' },
    { value: '#9b1b30', label: 'יין' },
    { value: '#1e3a5f', label: 'כחול-לילה' },
    { value: '#0d4f3c', label: 'ירוק-יער' },
    { value: '#4a2060', label: 'סגול-כהה' },
  ];

  let form = {
    cardNumber:  '',
    effect:      'holo',
    title:       'שם הקלף',
    description: 'תיאור קצר...',
    date:        '2015',
    rarityTier:  'rare',
    isFlat:      false,
    photo:       '/pack-image.png',
    showFrame:   false,
    frameColor:  '#f5c451',
  };

  let saved       = '';
  let saving      = false;
  let isDragging  = false;
  let selectedFile = null;
  let fileInput;
  let previewKey  = 0;

  const effectsByTier = {};
  for (const id of EFFECT_IDS) {
    const tier = EFFECTS[id].tier;
    if (!effectsByTier[tier]) effectsByTier[tier] = [];
    effectsByTier[tier].push({ id, label: EFFECTS[id].label });
  }

  function pickEffect(id) {
    form.effect    = id;
    previewKey++;
  }

  function bump() { previewKey++; }

  function readFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => { form.photo = e.target.result; previewKey++; };
    reader.readAsDataURL(file);
  }

  function handleFileChange(e) { readFile(e.target.files[0]); }
  function handleDrop(e)       { isDragging = false; readFile(e.dataTransfer.files[0]); }
  function clearPhoto()        { form.photo = '/pack-image.png'; selectedFile = null; previewKey++; }

  async function saveCard() {
    if (!form.cardNumber || !form.title.trim() || saving) return;
    saving = true;

    let photoUrl = form.photo;

    if (selectedFile) {
      const ext  = (selectedFile.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `cards/${form.cardNumber}_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('card-photos')
        .upload(path, selectedFile, { upsert: true });
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('card-photos').getPublicUrl(path);
        photoUrl = publicUrl;
      }
    }

    const { ok } = await savePool({ ...form, photo: photoUrl, cardNumber: Number(form.cardNumber) });

    saving = false;
    if (ok) {
      saved = '✅ קלף נשמר לבריכה!';
      selectedFile = null;
      editMode = true;
    } else {
      saved = '❌ שגיאה בשמירה';
    }
    setTimeout(() => (saved = ''), 3000);
  }

  function resetForm() {
    form = { cardNumber: '', effect: 'holo', title: 'שם הקלף', description: 'תיאור קצר...', date: '2015', rarityTier: 'rare', isFlat: false, photo: '/pack-image.png', showFrame: false, frameColor: '#f5c451' };
    selectedFile = null;
    editMode = false;
    previewKey++;
  }

  $: canSave = !!form.cardNumber && !!form.title.trim();
</script>

<svelte:head><title>עורך קלפים — עשור של אהבה</title></svelte:head>

<div class="page editor-page">

  <div class="page-header">
    <div class="header-start">
      <a href="/admin/card-pool" class="back-link">← בריכת הקלפים</a>
      <h1>{editMode ? 'עריכת קלף' : 'קלף חדש'}</h1>
    </div>
    <button class="btn btn-ghost btn-sm" on:click={resetForm}>איפוס</button>
  </div>

  <div class="editor-grid">

    <div class="form-col">

      <section class="card-section surface">
        <p class="sec-title">פרטי הקלף</p>
        <div class="row-2">
          <div class="input-wrap">
            <label class="input-label" for="f-num">מספר קלף *</label>
            <input id="f-num" class="input" type="number" min="1" max="100" bind:value={form.cardNumber}
                   placeholder="1 – 100" on:input={bump} />
          </div>
          <div class="input-wrap">
            <label class="input-label" for="f-date">שנה / תאריך</label>
            <input id="f-date" class="input" bind:value={form.date} placeholder="2015" on:input={bump} />
          </div>
        </div>

        <div class="input-wrap mt-3">
          <label class="input-label" for="f-title">כותרת *</label>
          <input id="f-title" class="input" bind:value={form.title} placeholder="שם הקלף" on:input={bump} />
        </div>

        <div class="input-wrap mt-3">
          <label class="input-label" for="f-desc">תיאור</label>
          <textarea id="f-desc" class="input" rows="3" bind:value={form.description}
                    placeholder="תיאור קצר..." on:input={bump}></textarea>
        </div>
      </section>

      <section class="card-section surface">
        <p class="sec-title">תמונה לקלף</p>
        <div
          class="drop-zone"
          class:drag-over={isDragging}
          class:has-photo={form.photo !== '/pack-image.png'}
          on:dragover|preventDefault={() => (isDragging = true)}
          on:dragleave|preventDefault={() => (isDragging = false)}
          on:drop|preventDefault={handleDrop}
          role="button" tabindex="0"
          aria-label="העלה תמונה"
          on:keydown={(e) => e.key === 'Enter' && fileInput.click()}
          on:click={() => fileInput.click()}
        >
          {#if form.photo && form.photo !== '/pack-image.png'}
            <img src={form.photo} class="photo-thumb" alt="תמונה שנבחרה" />
            <div class="photo-overlay"><span>החלף תמונה</span></div>
          {:else}
            <div class="drop-idle">
              <span class="drop-icon">🖼</span>
              <span class="drop-label">גרור תמונה לכאן</span>
              <span class="drop-sub">או לחץ לבחירה</span>
            </div>
          {/if}
        </div>
        <input bind:this={fileInput} type="file" accept="image/*" class="file-input-hidden"
               on:change={handleFileChange} />

        <div class="input-wrap mt-3">
          <label class="input-label" for="f-photo">או הכנס URL</label>
          <div class="url-row">
            <input id="f-photo" class="input" bind:value={form.photo} placeholder="/pack-image.png" on:input={bump} />
            {#if form.photo !== '/pack-image.png'}
              <button class="clear-btn" on:click={clearPhoto} aria-label="נקה">✕</button>
            {/if}
          </div>
        </div>
      </section>

      <section class="card-section surface">
        <p class="sec-title">אפקט הקלף</p>
        {#each TIERS as tier}
          <div class="tier-group">
            <span class="tier-heading" style="color:{TIER_COLORS[tier]}">{TIER_LABELS[tier]}</span>
            <div class="chips">
              {#each effectsByTier[tier] ?? [] as ef}
                <button class="chip" class:active={form.effect === ef.id} on:click={() => pickEffect(ef.id)}>{ef.label}</button>
              {/each}
            </div>
          </div>
        {/each}
      </section>

      <section class="card-section surface">
        <p class="sec-title">נדירות ופורמט</p>
        <div class="input-wrap">
          <label class="input-label">סוג הקלף</label>
          <div class="chips">
            {#each TIERS as t}
              <button
                class="chip"
                class:active={form.rarityTier === t}
                style={form.rarityTier === t ? `border-color:${TIER_COLORS[t]};` : ''}
                on:click={() => { form.rarityTier = t; bump(); }}
              >{TIER_LABELS[t]}</button>
            {/each}
          </div>
        </div>
        <label class="toggle-row mt-3">
          <input type="checkbox" bind:checked={form.isFlat} on:change={bump} style="accent-color:var(--gold)" />
          <span class="toggle-text">קלף שטוח (isFlat) — ללא אפקטי 3D</span>
        </label>

        <div class="input-wrap mt-4">
          <label class="toggle-row">
            <input type="checkbox" bind:checked={form.showFrame} on:change={bump} style="accent-color:var(--gold)" />
            <span class="toggle-text">מסגרת TCG — מסגרת סביב התמונה</span>
          </label>

          {#if form.showFrame}
            <div class="frame-swatches">
              {#each FRAME_COLORS as fc}
                <button
                  type="button"
                  class="swatch"
                  class:swatch-active={form.frameColor === fc.value}
                  style="background:{fc.value};"
                  title={fc.label}
                  aria-label="מסגרת {fc.label}"
                  on:click={() => { form.frameColor = fc.value; bump(); }}
                ></button>
              {/each}
            </div>
          {/if}
        </div>
      </section>

      <div class="save-spacer"></div>
    </div>

    <div class="preview-col">
      <p class="sec-title">תצוגה מקדימה</p>
      <div class="preview-frame">
        {#key previewKey}
          <CardFront
            effect={form.effect}
            photo={form.photo}
            title={form.title}
            date={form.date}
            description={form.description}
            rarityTier={form.rarityTier}
            isFlat={form.isFlat}
            showFrame={form.showFrame}
            frameColor={form.frameColor}
            back="/pack-images.png"
          />
        {/key}
      </div>
      <div class="preview-badges">
        <span class="badge" style="border-color:{TIER_COLORS[form.rarityTier]}; color:{TIER_COLORS[form.rarityTier]}">{TIER_LABELS[form.rarityTier]}</span>
        <span class="badge">{EFFECTS[form.effect]?.label ?? form.effect}</span>
        {#if form.cardNumber}<span class="badge">#{form.cardNumber}</span>{/if}
      </div>
    </div>

  </div>
</div>

<div class="save-bar">
  <div class="save-bar-inner">
    {#if saved}
      <span class="saved-msg">{saved}</span>
    {:else}
      <span class="save-hint">{canSave ? 'מוכן לשמירה' : 'יש למלא מספר קלף וכותרת'}</span>
    {/if}
    <button class="btn btn-gold save-btn" disabled={!canSave || saving} on:click={saveCard}>
      {saving ? 'שומר...' : (editMode ? '💾 עדכן בריכה' : '💾 שמור לבריכה')}
    </button>
  </div>
</div>

<style>
  .editor-page { max-width: 1040px; padding-bottom: 0; }

  .page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--sp-4);
    margin-bottom: var(--sp-6);
    padding-bottom: var(--sp-4);
    border-bottom: 1px solid var(--glass-border);
  }
  .header-start { display: flex; flex-direction: column; gap: 2px; }
  .header-start h1 { margin: 0; font-size: var(--text-2xl); }
  .back-link { font-size: var(--text-xs); color: var(--gold-dim); text-decoration: none; }
  .back-link:hover { color: var(--gold); }

  .editor-grid { display: grid; grid-template-columns: 1fr 340px; gap: var(--sp-6); align-items: start; }
  @media (max-width: 820px) { .editor-grid { grid-template-columns: 1fr; } .preview-col { order: -1; } }

  .form-col { display: flex; flex-direction: column; gap: var(--sp-4); counter-reset: sec; }

  /* Modern, numbered section cards */
  .card-section {
    position: relative;
    padding: var(--sp-5);
    border-radius: var(--r-xl);
    background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.018));
    border: 1px solid var(--glass-border);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
    transition: border-color 0.2s ease;
  }
  .card-section:focus-within { border-color: var(--gold-muted); }
  .form-col .card-section { counter-increment: sec; }

  .sec-title {
    display: flex;
    align-items: center;
    gap: 0.6em;
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--ink);
    margin: 0 0 var(--sp-4);
  }
  .form-col .sec-title::before {
    content: counter(sec);
    display: grid;
    place-items: center;
    width: 1.65em;
    height: 1.65em;
    flex-shrink: 0;
    border-radius: 50%;
    background: var(--glass-gold);
    border: 1px solid var(--glass-gold-border);
    color: var(--gold);
    font-size: 0.82em;
    font-weight: 800;
  }
  .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: var(--sp-3); }
  @media (max-width: 500px) { .row-2 { grid-template-columns: 1fr; } }
  .mt-3 { margin-top: var(--sp-3); }

  /* Gold focus ring on inputs */
  .input:focus {
    outline: none;
    border-color: var(--gold-muted);
    box-shadow: 0 0 0 3px rgba(245, 196, 81, 0.12);
  }

  .drop-zone { position: relative; width: 100%; min-height: 120px; border: 2px dashed var(--glass-border); border-radius: var(--r-lg); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: border-color 0.18s ease, background 0.18s ease; overflow: hidden; }
  .drop-zone:hover, .drop-zone.drag-over { border-color: var(--gold-muted); background: var(--glass-gold); }
  .drop-zone.has-photo { min-height: 160px; }
  .drop-idle { display: flex; flex-direction: column; align-items: center; gap: var(--sp-1); pointer-events: none; }
  .drop-icon  { font-size: 2rem; opacity: 0.5; }
  .drop-label { font-size: var(--text-sm); font-weight: 600; color: var(--ink-dim); }
  .drop-sub   { font-size: var(--text-xs); color: var(--ink-faint); }
  .photo-thumb { width: 100%; height: 160px; object-fit: cover; display: block; }
  .photo-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.18s ease; font-size: var(--text-sm); font-weight: 600; color: #fff; }
  .drop-zone:hover .photo-overlay { opacity: 1; }
  .file-input-hidden { display: none; }
  .url-row { display: flex; gap: var(--sp-2); align-items: center; }
  .url-row .input { flex: 1; }
  .clear-btn { flex-shrink: 0; width: 34px; height: 34px; display: grid; place-items: center; border-radius: 50%; border: 1px solid var(--glass-border); background: var(--glass); color: var(--ink-dim); font-size: 0.75rem; cursor: pointer; transition: all 0.15s ease; }
  .clear-btn:hover { border-color: var(--danger); color: var(--danger); }

  .tier-group { margin-bottom: var(--sp-4); }
  .tier-group:last-child { margin-bottom: 0; }
  .tier-heading { display: block; font-size: var(--text-xs); font-weight: 700; letter-spacing: 0.06em; margin-bottom: var(--sp-2); }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .chip { padding: 0.25em 0.75em; border-radius: var(--r-pill); border: 1px solid var(--glass-border); background: var(--glass); color: var(--ink-dim); font: inherit; font-size: var(--text-xs); cursor: pointer; transition: all 0.15s ease; white-space: nowrap; }
  .chip:hover  { border-color: var(--gold-muted); color: var(--ink); }
  .chip.active { border-color: var(--gold); background: var(--glass-gold); color: var(--ink); }

  .toggle-row { display: flex; align-items: center; gap: var(--sp-2); cursor: pointer; }
  .toggle-text { font-size: var(--text-sm); color: var(--ink-dim); }
  .mt-4 { margin-top: var(--sp-4); }

  /* Frame colour swatches */
  .frame-swatches {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: var(--sp-3);
    padding: var(--sp-3);
    border-radius: var(--r-lg);
    background: rgba(255,255,255,0.03);
    border: 1px solid var(--glass-border);
  }
  .swatch {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 2px solid transparent;
    cursor: pointer;
    transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
    outline: none;
    flex-shrink: 0;
  }
  .swatch:hover { transform: scale(1.18); box-shadow: 0 2px 8px rgba(0,0,0,0.5); }
  .swatch-active {
    border-color: var(--gold);
    box-shadow: 0 0 0 2px rgba(245,196,81,0.4), 0 2px 8px rgba(0,0,0,0.5);
    transform: scale(1.12);
  }

  .save-spacer { height: calc(var(--nav-bot-h) + 64px + var(--sp-4)); }

  /* ── Preview stage ───────────────────────────────────────────── */
  .preview-col {
    position: sticky;
    top: calc(var(--nav-top-h) + var(--sp-4));
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--sp-4);
    padding: var(--sp-6) var(--sp-5);
    border-radius: var(--r-xl);
    background:
      radial-gradient(135% 70% at 50% -8%, rgba(245,196,81,0.13), transparent 56%),
      linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.018));
    border: 1px solid var(--glass-border);
  }
  .preview-col .sec-title {
    align-self: center;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.09em;
    font-size: var(--text-xs);
    color: var(--ink-dim);
  }
  @media (max-width: 820px) {
    .preview-col { position: static; flex-direction: row; align-items: center; gap: var(--sp-5); padding: var(--sp-4); }
    .preview-col .sec-title { display: none; }
  }
  .preview-frame { position: relative; width: min(280px, 80vw); aspect-ratio: 0.718; border-radius: 14px; box-shadow: 0 24px 60px rgba(0,0,0,0.75), 0 0 0 1px rgba(245,196,81,0.2); animation: fadeUp 0.22s var(--ease-out) both; }
  @media (max-width: 820px) { .preview-frame { width: min(150px, 40vw); } }
  :global(.preview-frame .card.active) { z-index: var(--z-modal); }
  .preview-badges { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; }
  @media (max-width: 820px) { .preview-badges { flex-direction: column; align-items: flex-start; } }
  .badge { font-size: var(--text-xs); font-weight: 600; padding: 0.25em 0.7em; border-radius: var(--r-pill); border: 1px solid var(--glass-border); background: var(--glass); color: var(--ink-dim); }

  /* ── Save bar ────────────────────────────────────────────────── */
  .save-bar {
    position: fixed;
    bottom: var(--nav-bot-h);
    left: 0; right: 0;
    z-index: var(--z-float);
    padding: var(--sp-3) var(--sp-4);
    background: rgba(10,8,25,0.9);
    border-top: 1px solid rgba(245,196,81,0.15);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
  }
  /* desktop hides the bottom tab bar, so the save bar sits flush */
  @media (min-width: 768px) { .save-bar { bottom: 0; } }
  .save-bar-inner {
    max-width: 1040px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-4);
  }
  .save-hint { font-size: var(--text-xs); color: var(--ink-dim); }
  .saved-msg { font-size: var(--text-sm); font-weight: 600; color: var(--success); }
  .save-btn { min-width: 150px; }
</style>
