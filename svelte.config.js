import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/kit/vite';
/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// SPA, served by PocketBase itself out of pb_public/
		adapter: adapter({ pages: 'pb_public', assets: 'pb_public', fallback: 'index.html' })
	}
};
export default config;
