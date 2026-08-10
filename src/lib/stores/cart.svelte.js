import { browser } from '$app/environment';

const KEY = 'cart';
// A half-rung bill should survive a stray refresh or a browser crash. One left
// over from an earlier shift should not quietly reappear and get charged.
const MAX_AGE_MS = 12 * 60 * 60 * 1000;

/** Lines are the same line when they are the same product sold the same way. */
const same = (a, b) => a.name === b.name && a.variant.name === b.variant.name;

function restore() {
	if (!browser) return null;
	try {
		const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
		if (!saved?.items?.length) return null;
		if (!saved.savedAt || Date.now() - saved.savedAt > MAX_AGE_MS) return null;
		return saved;
	} catch {
		return null;
	}
}

class Cart {
	items = $state([]);
	/** When this bill was started. Plain field: nothing on screen reads it. */
	savedAt = null;

	// Derived, not bookkept. The old store recalculated the total in five places
	// and any missed one would have shown a price nobody was charged.
	total = $derived(this.items.reduce((sum, i) => sum + i.variant.price * i.quantity, 0));

	constructor() {
		const saved = restore();
		if (saved) {
			this.items = saved.items;
			this.savedAt = saved.savedAt;
		}
		if (browser) this.#persist();
	}

	#persist() {
		// Outside a component, so the effect needs its own root. It lives as long as
		// the page does, which is the point — the bill outlives every screen.
		$effect.root(() => {
			$effect(() => {
				// Age is measured from when the bill was started, not from the last
				// write, so reloading the page cannot keep an old one alive forever.
				this.savedAt = this.items.length ? (this.savedAt ?? Date.now()) : null;
				localStorage.setItem(KEY, JSON.stringify({ items: this.items, savedAt: this.savedAt }));
			});
		});
	}

	add(item) {
		const existing = this.items.find((i) => same(i, item));
		if (existing) existing.quantity += item.quantity;
		else this.items.push({ ...item, quantity: 1 });
	}

	/** One less of this line. At one, the line goes away. */
	remove(item) {
		const existing = this.items.find((i) => same(i, item));
		if (!existing) return;
		if (existing.quantity > 1) existing.quantity -= 1;
		else this.items = this.items.filter((i) => i !== existing);
	}

	removeAll(item) {
		this.items = this.items.filter((i) => !same(i, item));
	}

	reset() {
		this.items = [];
	}

	setQuantity(item, quantity) {
		const existing = this.items.find((i) => same(i, item));
		// the quantity field hands back a string; without this the total concatenates
		if (existing) existing.quantity = Math.max(1, Math.floor(Number(quantity) || 1));
	}
}

export const cart = new Cart();
