<script>
	import cart from '$lib/stores/cart.js';
	import { authUser } from '$lib/stores/auth.js';
	import { db } from '$lib/firebase.js';
	import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
	import Trash from '$lib/icons/Trash.svelte';

	function removeVariantFromCart(item) {
		return () => {
			cart.removeAll(item);
		};
	}

	let inOperation = false;

	function payOrder(orderType) {
		return () => {
			inOperation = true;
			addDoc(collection(db, 'orders'), {
				...$cart,
				createdAt: serverTimestamp(),
				createdBy: $authUser.email,
				payment: orderType
			})
				.then((docRef) => {
					inOperation = false;
					console.log('Order written with ID:', docRef.id);
					cart.reset();
				})
				.catch((error) => {
					inOperation = false;
					console.error('Error adding order:', error);
				});
		};
	}
</script>

<div class={inOperation ? 'opacity-50 pointer-events-none' : ''}>
	<h2 class="text-2xl font-semibold mb-2">
		Сметка
		{#if $cart.items.length}
			<button class="float-right" on:click={cart.reset}>
				<Trash />
			</button>
		{/if}
	</h2>
	<hr class="pb-4" />

	<!-- Cart Items -->
	{#each $cart.items as cartItem}
		<div>
			<div class="flex justify-between">
				<span class="font-medium">
					<button class="text-red-400" on:click={removeVariantFromCart(cartItem)}>
						<Trash />
					</button>
					<span>
						{cartItem.name}{cartItem.variant ? ` (${cartItem.variant})` : ''}
					</span>
				</span>
				<span>x{cartItem.quantity}</span>
			</div>
			<div class="text-right text-gray-400">{cartItem.price * cartItem.quantity} лв.</div>
		</div>
	{/each}

	<!-- Total Price -->
	<div class="border-t pt-4">
		<div class="flex justify-between">
			<span class="font-bold text-xl">Общо:</span>
			<span class="text-xl">{$cart.total} лв.</span>
		</div>
	</div>

	{#if $cart.items.length}
		<div class="flex justify-between border-t pt-4 mt-4">
			<button
				on:click={payOrder('cash')}
				class="mr-2 p-2 rounded-md border border-gray-300 hover:bg-gray-100">В брой</button
			>
			<button
				on:click={payOrder('card')}
				class="mr-2 p-2 rounded-md border border-gray-300 hover:bg-gray-100">С карта</button
			>
			<button
				on:click={payOrder('register')}
				class="mr-2 p-2 rounded-md border border-gray-300 hover:bg-gray-100">Каса</button
			>
		</div>
	{/if}
</div>
