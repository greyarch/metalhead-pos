import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		// SPA, served by PocketBase itself out of pb_public/
		adapter: adapter({ pages: 'pb_public', assets: 'pb_public', fallback: 'index.html' })
	}
};
export default config;
