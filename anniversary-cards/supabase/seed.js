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

async function findUserByEmail(email) {
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const user = data.users.find((u) => u.email === email);
    if (user) return user;
    if (data.users.length < 200) return null;
    page++;
  }
}

async function syncProfile(userId, metadata) {
  const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
    user_metadata: metadata
  });
  if (authError) throw authError;

  const { error: profileError } = await supabase.from('profiles').upsert(
    {
      id: userId,
      name: metadata.name,
      role: metadata.role,
      avatar: metadata.avatar
    },
    { onConflict: 'id' }
  );
  if (profileError) throw profileError;
}

async function createUser(email, password, metadata) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata
  });
  if (error) {
    if (error.message.includes('already been registered')) {
      console.log(`  ℹ  ${email} already exists — syncing profile`);
      try {
        const existing = await findUserByEmail(email);
        if (!existing) {
          console.error(`  ✗  ${email}: could not find auth user to sync`);
          return null;
        }
        await syncProfile(existing.id, metadata);
        console.log(`  ✓  ${email} synced (${metadata.role})`);
        return existing;
      } catch (syncError) {
        console.error(`  ✗  ${email} sync:`, syncError.message);
        return null;
      }
    }
    console.error(`  ✗  ${email}: ${error.message}`);
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
