import { browser } from '$app/environment';

// Per-till preferences. localStorage, not the database: how a given screen is
// set up is a property of that screen, same as the fiscal device address.
const read = (key, fallback) => {
	const stored = browser ? localStorage.getItem(key) : null;
	return stored === null ? fallback : stored === 'true';
};

export const settings = $state({
	showCalcByDefault: read('showCalcByDefault', false),
	/** The "Каса" payment button — a sale rung up without printing a fiscal receipt. */
	showRegisterButton: read('showRegisterButton', false)
});

if (browser) {
	$effect.root(() => {
		for (const key of Object.keys(settings)) {
			$effect(() => localStorage.setItem(key, String(settings[key])));
		}
	});
}
