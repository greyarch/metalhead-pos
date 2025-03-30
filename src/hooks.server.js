import { env } from '$env/dynamic/public';
import { createSupabaseServerClient } from '@supabase/auth-helpers-sveltekit';

export const handle = async ({ event, resolve }) => {
	event.locals.supabase = createSupabaseServerClient({
		supabaseUrl: env.PUBLIC_SUPABASE_URL,
		supabaseKey: env.PUBLIC_SUPABASE_ANON_KEY,
		event
	});

    /**
   * Unlike `supabase.auth.safeGetSession`, which is unsafe on the server because it
   * doesn't validate the JWT, this function validates the JWT by first calling
   * `getUser` and aborts early if the JWT signature is invalid.
   */
    event.locals.safeGetSession = async () => {
      const {
        data: { user },
        error,
      } = await event.locals.supabase.auth.getUser()
      if (error) {
        return { session: null, user: null }
      }
      const {
        data: { session },
      } = await event.locals.supabase.auth.getSession()
      return { session, user }
    }
    return resolve(event, {
      filterSerializedResponseHeaders(name) {
        return name === 'content-range' || name === 'x-supabase-api-version'
      },
    })
};
