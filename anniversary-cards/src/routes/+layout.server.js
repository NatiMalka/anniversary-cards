export const load = async ({ locals }) => {
  const { session, user, profile } = await locals.safeGetSession();
  if (!session) return { session: null, profile: null, wallet: null };

  const { data: wallet } = await locals.supabase
    .from('wallets')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return { session, profile, wallet };
};
