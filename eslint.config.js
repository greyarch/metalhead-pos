import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import prettier from 'eslint-config-prettier';
import svelteConfig from './svelte.config.js';

export default [
	js.configs.recommended,
	...svelte.configs.recommended,
	prettier,
	...svelte.configs.prettier,
	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node }
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.js'],
		languageOptions: { parserOptions: { svelteConfig } }
	},
	{
		// PocketBase runs these in its own Go-embedded JS engine, with its own globals.
		files: ['pb_hooks/**'],
		languageOptions: {
			globals: {
				require: 'readonly',
				__hooks: 'readonly',
				$app: 'readonly',
				Record: 'readonly',
				onRecordCreateRequest: 'readonly',
				onRecordUpdateRequest: 'readonly',
				onRecordDeleteRequest: 'readonly'
			}
		}
	},
	{
		ignores: ['pb_public/', 'pb_data/', 'pb_migrations/', '.svelte-kit/', 'build/', 'static/']
	}
];
