import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const KEY = 'cart';
// A half-rung bill should survive a stray refresh or a browser crash. One left
// over from an earlier shift should not quietly reappear and get charged.
const MAX_AGE_MS = 12 * 60 * 60 * 1000;

const getTotalPrice = (items) =>
	items.reduce((acc, item) => acc + item.variant.price * item.quantity, 0);

function restore() {
	if (!browser) return { items: [], total: 0 };
	try {
		const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
		if (!saved?.items?.length) return { items: [], total: 0 };
		if (!saved.savedAt || Date.now() - saved.savedAt > MAX_AGE_MS) return { items: [], total: 0 };
		// Recompute rather than trust a stored total: it is the number someone pays.
		return { items: saved.items, savedAt: saved.savedAt, total: getTotalPrice(saved.items) };
	} catch {
		return { items: [], total: 0 };
	}
}

const cart = writable(restore());

if (browser) {
	cart.subscribe((c) => {
		// Age is measured from when the bill was started, not from the last write,
		// so repeatedly reloading the page cannot keep an old one alive forever.
		const savedAt = c.items.length ? (c.savedAt ??= Date.now()) : null;
		localStorage.setItem(KEY, JSON.stringify({ items: c.items, savedAt }));
	});
}

function add(item) {
	cart.update((cart) => {
		const existingItem = cart.items.find((i) => i.name === item.name && i.variant === item.variant);
		if (existingItem) {
			existingItem.quantity += item.quantity;
		} else {
			cart.items.push({ ...item, quantity: 1 });
		}

		cart.total = getTotalPrice(cart.items);
		return cart;
	});
}

/** One less of this line. At one, the line goes away. */
function remove(item) {
	cart.update((cart) => {
		const existingItem = cart.items.find((i) => i.name === item.name && i.variant === item.variant);
		if (!existingItem) return cart;

		if (existingItem.quantity > 1) {
			existingItem.quantity -= 1;
		} else {
			cart.items = cart.items.filter((i) => i !== existingItem);
		}
		cart.total = getTotalPrice(cart.items);
		return cart;
	});
}

function removeAll(item) {
	cart.update((cart) => {
		cart.items = cart.items.filter((i) => !(i.name === item.name && i.variant === item.variant));
		cart.total = getTotalPrice(cart.items);
		return cart;
	});
}

function reset() {
	cart.update((cart) => {
		cart = { items: [], total: 0 };
		return cart;
	});
}

function update(item, newQuantity) {
	cart.update((cart) => {
		const existingItem = cart.items.find((i) => i.name === item.name && i.variant === item.variant);
		if (existingItem) {
			// the quantity field hands back a string; without this the total concatenates
			existingItem.quantity = Math.max(1, Math.floor(Number(newQuantity) || 1));
			cart.total = getTotalPrice(cart.items);
		}
		return cart;
	});
}

export default { ...cart, add, remove, removeAll, reset, update };
