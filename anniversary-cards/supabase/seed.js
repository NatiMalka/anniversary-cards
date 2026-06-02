// Run with: node supabase/seed.js
// Creates both users and seeds the initial tasks.
// Safe to re-run — will report if users already exist.

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ickexgklpntuyidbjsyo.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlja2V4Z2tscG50dXlpZGJqc3lvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM5OTQ3MiwiZXhwIjoyMDk1OTc1NDcyfQ.69zOI-iIMr_s0XY_CRf5Jebu_VmAbhmyEwrIXNbhxoU';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createUser(email, password, metadata) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata
  });
  if (error) {
    if (error.message.includes('already been registered')) {
      console.log(`  ℹ  ${email} already exists — skipping`);
    } else {
      console.error(`  ✗  ${email}: ${error.message}`);
    }
    return null;
  }
  console.log(`  ✓  ${email} created (${data.user.id})`);
  return data.user;
}

async function seed() {
  console.log('\n── Creating users ────────────────────────────────');
  await createUser('netamal3134@gmail.com', 'Nati3134',   { name: 'נתנאל',      role: 'admin', avatar: '👨' });
  await createUser('malkalmog11@gmail.com', 'Almog3134',  { name: 'אלמוג אסתר', role: 'user',  avatar: '👩' });

  console.log('\n── Seeding tasks ─────────────────────────────────');
  const { data: existing } = await supabase.from('tasks').select('id').limit(1);
  if (existing && existing.length > 0) {
    console.log('  ℹ  Tasks already exist — skipping seed tasks');
  } else {
    const { error } = await supabase.from('tasks').insert([
      { title: 'לקחתי את הילד לגן בזמן',       type: 'daily',   reward: 5,  reward_type: 'hearts',    active: true },
      { title: 'אמרתי "אני אוהב אותך" היום',    type: 'daily',   reward: 3,  reward_type: 'hearts',    active: true },
      { title: 'יצאנו לדייט שניים',              description: 'ערב זוגי ללא ילדים 💑',
                                                 type: 'special', reward: 20, reward_type: 'hearts',    active: true },
      { title: '???',                            type: 'secret',  reward: 0,  reward_type: 'free_pack', active: true }
    ]);
    if (error) console.error('  ✗  Tasks seed:', error.message);
    else       console.log('  ✓  4 seed tasks created');
  }

  console.log('\nSeed complete!\n');
}

seed().catch(console.error);
