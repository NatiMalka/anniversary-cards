import { redirect, fail } from '@sveltejs/kit';

export const load = async ({ locals }) => {
  const { session } = await locals.safeGetSession();
  if (session) throw redirect(303, '/');
};

export const actions = {
  default: async ({ request, locals }) => {
    const data = await request.formData();
    const email    = String(data.get('email')    ?? '');
    const password = String(data.get('password') ?? '');

    const { error } = await locals.supabase.auth.signInWithPassword({ email, password });
    if (error) return fail(400, { error: 'אימייל או סיסמה שגויים' });

    throw redirect(303, '/');
  }
};
