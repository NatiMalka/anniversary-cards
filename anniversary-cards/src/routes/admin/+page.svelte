<script>
  // Admin guard is enforced server-side by admin/+layout.server.js
</script>

<div class="page">
  <h1>ניהול</h1>
  <div class="admin-grid">
    <a href="/admin/tasks" class="admin-card surface">
      <span class="admin-icon">✅</span>
      <h3>ניהול משימות</h3>
      <p>יצירה, עריכה, ומחיקה של משימות</p>
    </a>
    <a href="/admin/card-editor" class="admin-card surface">
      <span class="admin-icon">🎴</span>
      <h3>עורך קלפים</h3>
      <p>יצירת קלפים חדשים ושמירה לבריכה</p>
    </a>
    <a href="/admin/card-pool" class="admin-card surface">
      <span class="admin-icon">🗂</span>
      <h3>בריכת הקלפים</h3>
      <p>צפייה, עריכה ומחיקה של קלפים שנוצרו</p>
    </a>
    <a href="/album" class="admin-card surface">
      <span class="admin-icon">📚</span>
      <h3>האלבום</h3>
      <p>ניהול האוסף ומחיקת קלפים</p>
    </a>
    <a href="/admin/cleanup" class="admin-card surface admin-card--danger">
      <span class="admin-icon">🗑</span>
      <h3>ניקוי נתונים</h3>
      <p>איפוס ארנקים, אוספים ומשימות לכל משתמש</p>
    </a>
  </div>
</div>

<style>
  .admin-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--sp-4);
  }
  .admin-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--sp-3);
    padding: var(--sp-8) var(--sp-4);
    border-radius: var(--r-xl);
    text-decoration: none;
    text-align: center;
    color: var(--ink);
    transition: transform 0.2s var(--ease-out), border-color 0.2s ease;
  }
  .admin-card:hover { transform: translateY(-4px); border-color: var(--gold-muted); }
  .admin-card--danger:hover { border-color: rgba(248,113,113,0.4); }
  .admin-icon { font-size: 2.5rem; }
  .admin-card h3 { margin: 0; }
  .admin-card p  { margin: 0; color: var(--ink-dim); font-size: var(--text-sm); }
</style>
