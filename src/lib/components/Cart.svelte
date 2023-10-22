<script>
	import cart from '$lib/stores/cart.js';
	import Trash from '$lib/icons/Trash.svelte';
	import { page } from '$app/stores';

	const db = $page.data.supabase;
	const session = $page.data.session;

	function removeVariantFromCart(item) {
		return () => {
			cart.removeAll(item);
		};
	}

	let busy = false;

	function submitOrder(orderType) {
		return async () => {
			console.log('submitOrder::cart', $cart);
			busy = true;
			const order = await db
				.from('orders')
				.insert([
					{
						total_price: $cart.total,
						payment_type: orderType,
						created_by: session.user.id
					}
				])
				.select('id');
			await db.from('order_items').insert(
				$cart.items.map((item) => ({
					order_id: order.data[0].id,
					product_id: item.id,
					variant_id: item.variant.id,
					quantity: item.quantity,
					unit_price: item.variant.price
				}))
			);
			cart.reset();
			busy = false;
		};
	}
</script>

<div class={busy ? 'opacity-50 pointer-events-none' : ''}>
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
						{cartItem.name}{cartItem.variant.name !== 'default'
							? ` (${cartItem.variant.name})`
							: ''}
					</span>
				</span>
				<span>x{cartItem.quantity}</span>
			</div>
			<div class="text-right text-gray-400">{cartItem.variant.price * cartItem.quantity} лв.</div>
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
				on:click={submitOrder('cash')}
				class="mr-2 p-2 rounded-md border border-gray-300 hover:bg-gray-100">В брой</button
			>
			<button
				on:click={submitOrder('card')}
				class="mr-2 p-2 rounded-md border border-gray-300 hover:bg-gray-100">С карта</button
			>
			<button
				on:click={submitOrder('register')}
				class="mr-2 p-2 rounded-md border border-gray-300 hover:bg-gray-100">Каса</button
			>
		</div>
	{/if}
</div>
