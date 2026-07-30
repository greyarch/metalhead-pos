<script>
	import cart from '$lib/stores/cart.js';
	import { stats } from '$lib/stores/stats.js';
	import Trash from '$lib/icons/Trash.svelte';
	import { pb } from '$lib/pb.js';
	import { mypos, toReceipt } from '$lib/mypos.js';
	import Calc from '$lib/components/Calc.svelte';

	updateStats();

	function removeVariantFromCart(item) {
		return () => {
			cart.removeAll(item);
		};
	}

	let busy = false;

	async function submitOrder(orderType) {
		let order;
		busy = true;
		try {
			order = await pb.collection('orders').create({
				total_price: $cart.total,
				payment_type: orderType,
				created_by: pb.authStore.record?.id
			});
			for (const item of $cart.items) {
				await pb.collection('order_items').create({
					order: order.id,
					product: item.id,
					// snapshot: editing a product later must not rewrite past sales
					product_name: item.name,
					variant_name: item.variant.name,
					quantity: item.quantity,
					unit_price: item.variant.price
				});
			}
			if (orderType !== 'register') {
				// the fiscal device wants a numeric JSON-RPC id; PocketBase ids are strings
				const receipt = toReceipt(Date.now(), $cart, orderType);
				await mypos(receipt);
			}
			cart.reset();
		} catch (e) {
			console.error(e);
			// cascade delete drops the order_items with it
			if (order) await pb.collection('orders').delete(order.id).catch(console.error);
			alert(`Грешка при изпращане на поръчката!\n\n${e.message}`);
		}
		busy = false;
	}

	async function updateStats() {
		try {
			const today = await pb.collection('today_totals').getFirstListItem('');
			$stats.todayTotal = today.total;
			$stats.todayRegister = today.register;
		} catch (error) {
			console.error(error);
		}
	}

	function handleSubmit(orderType) {
		return async () => {
			await submitOrder(orderType);
			await updateStats();
		};
	}
</script>

<div class={busy ? 'opacity-50 pointer-events-none' : ''}>
	<h2 class="text-2xl font-semibold mb-2">
		<span class="text-orange-300">Сметка</span>
		{#if $cart.items.length}
			<button class="float-right" on:click={cart.reset}>
				<Trash />
			</button>
		{:else}
			<span class="text-gray-400 float-right"
				>Днес: €{$stats.todayTotal.toFixed(2)}</span
			>
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
				<!-- <span>x{cartItem.quantity}</span> -->
				<input
					type="number"
					bind:value={cartItem.quantity}
					on:input={(e) => cart.update(cartItem, e.target.value)}
					on:focus={(e) => e.target.select()}
					min="1"
					class="w-16 text-right border rounded px-2 py-1 text-black"
				/>
			</div>
			<div class="text-right text-gray-400">€{cartItem.variant.price * cartItem.quantity}</div>
		</div>
	{/each}

	<!-- Total Price -->
	<div class="border-t pt-4">
		<div class="flex justify-between">
			<span class="font-bold text-xl">Общо:</span>
			<span class="text-xl">€{$cart.total.toFixed(2)}</span>
		</div>
	</div>

	{#if $cart.items.length}
		<div class="flex justify-between border-t pt-4 mt-4">
			<button
				on:click={handleSubmit('cash')}
				class="mr-2 p-2 rounded-md border border-gray-300 hover:bg-gray-100">В брой</button
			>
			<button
				on:click={handleSubmit('card')}
				class="mr-2 p-2 rounded-md border border-gray-300 hover:bg-gray-100">С карта</button
			>
			<!-- <button
				on:click={handleSubmit('register')}
				class="mr-2 p-2 rounded-md border border-gray-300 hover:bg-gray-100">Каса</button
			> -->
		</div>
		<br />
		<Calc />
	{/if}
</div>

<style>
	/* Remove spinner buttons from number input */
	input[type='number']::-webkit-inner-spin-button,
	input[type='number']::-webkit-outer-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
	input[type='number'] {
		-moz-appearance: textfield;
	}
</style>
