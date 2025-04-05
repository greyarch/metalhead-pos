import { env } from '$env/dynamic/public';
import { createSupabaseLoadClient } from '@supabase/auth-helpers-sveltekit';

export const ssr = false;
export const csr = true;

export const load = async ({ fetch, data, depends }) => {
	try {
		depends('supabase:auth');

		const supabase = createSupabaseLoadClient({
			supabaseUrl: env.PUBLIC_SUPABASE_URL,
			supabaseKey: env.PUBLIC_SUPABASE_ANON_KEY,
			event: { fetch },
			serverSession: data.session
		});

		const {
			data: { session }
		} = await supabase.auth.getSession();

		return { supabase, session };
	} catch (error) {
		console.error("Exception when getting a session, signing out.", error)
		await supabase.auth.signOut();
	}
};
