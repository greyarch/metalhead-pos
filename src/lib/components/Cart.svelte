<script>
	import cart from '$lib/stores/cart.js';
	import { stats } from '$lib/stores/stats.js';
	import Trash from '$lib/icons/Trash.svelte';
	import { pb } from '$lib/pb.js';
	import { mypos, toReceipt } from '$lib/mypos.js';
	import Calc from '$lib/components/Calc.svelte';
	import { fly } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	updateStats();

	// The total counts up rather than snapping, so a mis-tap is visible as movement.
	const shownTotal = tweened(0, { duration: 220, easing: cubicOut });
	$: shownTotal.set($cart.total);

	const money = (n) => `€${Number(n).toFixed(2)}`;
	const lineLabel = (i) =>
		i.variant.name === 'default' ? i.name : `${i.name} (${i.variant.name})`;
	const lineKey = (i) => `${i.name}|${i.variant.name}`;

	function removeVariantFromCart(item) {
		return () => {
			cart.removeAll(item);
		};
	}

	let busy = false;
	let showCalc = false;

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

<div class="flex h-full flex-col {busy ? 'pointer-events-none opacity-40' : ''}">
	<header class="flex items-center gap-2 border-b border-rule px-4 py-[0.9rem]">
		<h2 class="display flex-1 text-2xl text-amber">Сметка</h2>
		{#if $cart.items.length}
			<button
				class="touch touch-danger h-11 min-h-0 w-11 text-muted"
				aria-label="Изчисти сметката"
				on:click={cart.reset}
			>
				<Trash />
			</button>
		{:else}
			<span class="text-sm text-muted">
				Днес <span class="display ml-1 text-base text-[color:var(--text)]"
					>{money($stats.todayTotal)}</span
				>
			</span>
		{/if}
	</header>

	<!-- Lines -->
	<div class="min-h-0 flex-1 overflow-y-auto px-4">
		{#each $cart.items as cartItem (lineKey(cartItem))}
			<div
				class="flex items-center gap-2 border-b border-rule py-2.5"
				in:fly={{ y: -8, duration: 160 }}
				animate:flip={{ duration: 180 }}
			>
				<div class="min-w-0 flex-1">
					<div class="truncate font-semibold leading-tight">{lineLabel(cartItem)}</div>
					<button
						class="text-xs text-muted hover:text-[color:var(--danger)]"
						on:click={removeVariantFromCart(cartItem)}
					>
						Премахни
					</button>
				</div>

				<div class="flex items-center gap-1">
					<button
						class="touch h-10 min-h-0 w-10 text-lg"
						aria-label="По-малко"
						on:click={() => cart.remove(cartItem)}>−</button
					>
					<input
						type="number"
						bind:value={cartItem.quantity}
						on:input={(e) => cart.update(cartItem, e.target.value)}
						on:focus={(e) => e.target.select()}
						min="1"
						aria-label="Количество"
						class="h-10 w-12 rounded-[3px] border border-rule bg-ink text-center font-semibold"
					/>
					<button
						class="touch h-10 min-h-0 w-10 text-lg"
						aria-label="Още"
						on:click={() => cart.update(cartItem, cartItem.quantity + 1)}>+</button
					>
				</div>

				<div class="display w-20 text-right text-lg">
					{money(cartItem.variant.price * cartItem.quantity)}
				</div>
			</div>
		{/each}
	</div>

	<!-- Total and payment: the part someone reads from a metre away -->
	<footer class="max-h-[70%] shrink-0 overflow-y-auto border-t border-rule px-4 py-4">
		<div class="mb-3 flex items-baseline justify-between">
			<span class="eyebrow">Общо</span>
			<span class="display text-5xl leading-none text-amber">{money($shownTotal)}</span>
		</div>

		{#if $cart.items.length}
			<div class="grid grid-cols-2 gap-2">
				<button class="touch touch-accent h-16 text-lg" on:click={handleSubmit('cash')}>
					В брой
				</button>
				<button class="touch touch-accent h-16 text-lg" on:click={handleSubmit('card')}>
					С карта
				</button>
			</div>

			<button
				class="mt-3 w-full text-xs uppercase tracking-widest text-muted hover:text-[color:var(--text)]"
				on:click={() => (showCalc = !showCalc)}
			>
				{showCalc ? 'Скрий ресто' : 'Изчисли ресто'}
			</button>
			{#if showCalc}
				<div transition:fly={{ y: 12, duration: 160 }}>
					<Calc />
				</div>
			{/if}
		{:else}
			<p class="py-3 text-center text-sm text-muted">Избери продукт, за да започнеш.</p>
		{/if}
	</footer>
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
