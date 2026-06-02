import { createServerClient } from '@supabase/ssr';
import { redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

const PUBLIC_PATHS = ['/login'];

const handleSupabase = async ({ event, resolve }) => {
  event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => event.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) =>
          event.cookies.set(name, value, { ...options, path: '/' })
        );
      }
    }
  });

  event.locals.safeGetSession = async () => {
    const { data: { session } } = await event.locals.supabase.auth.getSession();
    if (!session) return { session: null, user: null, profile: null };

    const { data: { user }, error } = await event.locals.supabase.auth.getUser();
    if (error) return { session: null, user: null, profile: null };

    const { data: profile } = await event.locals.supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return { session, user, profile };
  };

  return resolve(event, {
    filterSerializedResponseHeaders: (name) =>
      name === 'content-range' || name === 'x-supabase-api-version'
  });
};

const handleAuth = async ({ event, resolve }) => {
  const path = event.url.pathname;
  if (PUBLIC_PATHS.some((p) => path.startsWith(p))) return resolve(event);

  const { session } = await event.locals.safeGetSession();
  if (!session) throw redirect(303, '/login');

  return resolve(event);
};

export const handle = sequence(handleSupabase, handleAuth);
