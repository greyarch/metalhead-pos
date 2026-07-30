/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			fontFamily: {
				display: ['Oswald', 'sans-serif'],
				sans: ['IBM Plex Sans', 'ui-sans-serif', 'system-ui', 'sans-serif']
			},
			colors: {
				ink: 'var(--ink)',
				panel: 'var(--panel)',
				raised: 'var(--raised)',
				'raised-hi': 'var(--raised-hi)',
				rule: 'var(--rule)',
				muted: 'var(--muted)',
				amber: 'var(--amber)',
				'amber-dim': 'var(--amber-dim)',
				danger: 'var(--danger)'
			}
		}
	},
	plugins: []
};
