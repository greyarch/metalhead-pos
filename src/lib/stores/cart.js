import { writable } from 'svelte/store';

const cart = writable({ items: [], total: 0 });

const getTotalPrice = (items) =>
	items.reduce((acc, item) => acc + item.variant.price * item.quantity, 0);

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
