<script>
  import { enhance } from '$app/forms';
  export let form;
  let loading = false;
</script>

<svelte:head><title>כניסה — עשור של אהבה</title></svelte:head>

<div class="wrap">
  <div class="card">

    <div class="brand">
      <span class="brand-decade">עשור</span>
      <span class="brand-of">של</span>
      <span class="brand-love">אהבה</span>
    </div>
    <p class="sub">ברוכים הבאים — כנסו לחגוג 💛</p>

    <form method="POST" use:enhance={() => {
      loading = true;
      return async ({ update }) => { loading = false; update(); };
    }}>
      {#if form?.error}
        <p class="err">{form.error}</p>
      {/if}

      <div class="field">
        <label for="email">אימייל</label>
        <input id="email" name="email" type="email" dir="ltr"
               placeholder="your@email.com" required autocomplete="email" />
      </div>

      <div class="field">
        <label for="password">סיסמה</label>
        <input id="password" name="password" type="password" dir="ltr"
               placeholder="••••••••" required autocomplete="current-password" />
      </div>

      <button type="submit" class="btn btn-gold submit-btn" disabled={loading}>
        {loading ? 'מתחבר...' : 'כניסה'}
      </button>
    </form>
  </div>
</div>

<style>
  .wrap {
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: var(--sp-4);
    background: var(--bg-0);
  }

  .card {
    width: 100%;
    max-width: 380px;
    background: var(--bg-2);
    border: 1px solid var(--glass-gold-border);
    border-radius: var(--r-xl);
    padding: var(--sp-8) var(--sp-6);
    box-shadow: 0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(245,196,81,0.06);
    display: flex;
    flex-direction: column;
    gap: var(--sp-5);
    animation: fadeUp 0.4s var(--ease-out);
  }

  .brand {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 0.3rem;
    font-family: 'Frank Ruhl Libre', serif;
    font-size: var(--text-3xl);
    font-weight: 700;
  }
  .brand-decade { color: var(--gold); }
  .brand-of     { color: var(--ink-dim); font-weight: 400; font-size: var(--text-lg); }
  .brand-love   { color: var(--silver); }

  .sub {
    text-align: center;
    color: var(--ink-dim);
    font-size: var(--text-sm);
    margin: 0;
    margin-top: calc(-1 * var(--sp-3));
  }

  form {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
  }

  .err {
    margin: 0;
    padding: var(--sp-3);
    border-radius: var(--r-md);
    background: rgba(248,113,113,0.1);
    border: 1px solid rgba(248,113,113,0.3);
    color: var(--danger);
    font-size: var(--text-sm);
    text-align: center;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--sp-1);
  }
  .field label {
    font-size: var(--text-xs);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--ink-dim);
  }
  .field input {
    width: 100%;
    padding: 0.65em 1em;
    border-radius: var(--r-md);
    border: 1px solid var(--glass-border);
    background: var(--bg-1);
    color: var(--ink);
    font: inherit;
    font-size: var(--text-sm);
    transition: border-color 0.15s ease;
    box-sizing: border-box;
  }
  .field input:focus {
    outline: none;
    border-color: var(--gold-muted);
  }

  .submit-btn {
    width: 100%;
    margin-top: var(--sp-2);
    padding: 0.75em;
    font-size: var(--text-base);
  }
</style>
