<script>
	import cart from '$lib/stores/cart.js';
	import { stats } from '$lib/stores/stats.js';
	import Trash from '$lib/icons/Trash.svelte';
	import { page } from '$app/stores';
	import { toReceipt } from '$lib/mypos.js';
	import Calc from '$lib/components/Calc.svelte';

	const db = $page.data.supabase;
	const session = $page.data.session;
	updateStats();

	function removeVariantFromCart(item) {
		return () => {
			cart.removeAll(item);
		};
	}

	let busy = false;

	async function submitOrder(orderType) {
		let orderId = 0;
		busy = true;
		try {
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
			orderId = order.data[0].id;
			await db.from('order_items').insert(
				$cart.items.map((item) => ({
					order_id: orderId,
					product_id: item.id,
					variant_id: item.variant.id,
					quantity: item.quantity,
					unit_price: item.variant.price
				}))
			);
			if (orderType !== 'register') {
				const receipt = toReceipt(orderId, $cart, orderType);
				const posRes = await fetch('/api/pos', {
					method: 'POST',
					body: JSON.stringify(receipt)
				});
				const posResult = await posRes.json();
				if ('error' in posResult) throw posResult.error;
			}
			cart.reset();
		} catch (e) {
			console.error(e);
			const { error } = await db.from('orders').delete().eq('id', orderId);
			if (error) console.error(error);
			alert(`Грешка при изпращане на поръчката!\n\n${e.message}`);
		}
		busy = false;
	}

	async function updateStats() {
		const { data, error } = await db.rpc('get_today_order_sums');
		if (error) {
			console.error(error);
		} else {
			$stats.todayTotal = data[0].total_sum;
			$stats.todayRegister = data[0].register_sum;
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
				>Днес: {$stats.todayTotal} / {$stats.todayRegister}лв.</span
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
			<div class="text-right text-gray-400">{cartItem.variant.price * cartItem.quantity} лв.</div>
		</div>
	{/each}

	<!-- Total Price -->
	<div class="border-t pt-4">
		<div class="flex justify-between">
			<span class="font-bold text-xl">Общо:</span>
			<span class="text-xl">{$cart.total.toFixed(2)} лв.</span>
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
			<button
				on:click={handleSubmit('register')}
				class="mr-2 p-2 rounded-md border border-gray-300 hover:bg-gray-100">Каса</button
			>
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
