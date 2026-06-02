import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
  const { profile } = await locals.safeGetSession();
  if (!profile || profile.role !== 'admin') throw redirect(303, '/');
};
