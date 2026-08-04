import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Per-till preferences. localStorage, not the database: how a given screen is
// set up is a property of that screen, same as the fiscal device address.
function persisted(key, fallback) {
	const stored = browser ? localStorage.getItem(key) : null;
	const store = writable(stored === null ? fallback : stored === 'true');
	if (browser) store.subscribe((on) => localStorage.setItem(key, String(on)));
	return store;
}

export const showCalcByDefault = persisted('showCalcByDefault', false);

/** The "Каса" payment button — a sale rung up without printing a fiscal receipt. */
export const showRegisterButton = persisted('showRegisterButton', false);
