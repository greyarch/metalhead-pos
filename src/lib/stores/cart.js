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

function remove(item) {
	cart.update((cart) => {
		const existingItem = cart.items.find((i) => i.name === item.name && i.variant === item.variant);
		if (existingItem) {
			if (existingItem.quantity > 1) {
				existingItem.quantity -= item.quantity;
			}
			if (existingItem.quantity === 1) {
				cart.items.pop(item);
			}
			cart.total = getTotalPrice(cart.items);
			return cart;
		}
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
			existingItem.quantity = newQuantity;
			cart.total = getTotalPrice(cart.items);
		}
		return cart;
	});
}

export default { ...cart, add, remove, removeAll, reset, update };
