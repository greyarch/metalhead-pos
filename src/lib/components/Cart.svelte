<script>
	import { cart } from '$lib/stores/cart.svelte.js';
	import Trash from '$lib/icons/Trash.svelte';
	import { pb } from '$lib/pb.js';
	import { mypos, toReceipt } from '$lib/mypos.js';
	import Calc from '$lib/components/Calc.svelte';
	import { fly } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { settings } from '$lib/stores/settings.svelte.js';
	import { notify } from '$lib/stores/notice.svelte.js';

	/** Takings so far today, for the corner of the header. */
	let todayTotal = $state(0);
	updateStats();

	// The total counts up rather than snapping, so a mis-tap is visible as movement.
	const shownTotal = Tween.of(() => cart.total, { duration: 220, easing: cubicOut });

	const money = (n) => `€${Number(n).toFixed(2)}`;
	const lineLabel = (i) =>
		i.variant.name === 'default' ? i.name : `${i.name} (${i.variant.name})`;
	const lineKey = (i) => `${i.name}|${i.variant.name}`;

	function removeVariantFromCart(item) {
		return () => {
			cart.removeAll(item);
		};
	}

	let busy = $state(false);
	// Follows the setting (including a change made while this is on screen), but a
	// manual toggle still wins until the setting itself changes again.
	let showCalc = $state(false);
	$effect(() => (showCalc = settings.showCalcByDefault));

	// PocketBase ids are exactly 15 chars of [a-z0-9]. getRandomValues rather than
	// randomUUID: the till is opened over plain http on the LAN often enough, and
	// randomUUID is missing outside a secure context.
	const newOrderId = () =>
		Array.from(crypto.getRandomValues(new Uint8Array(15)), (b) =>
			'abcdefghijklmnopqrstuvwxyz0123456789'.charAt(b % 36)
		).join('');

	async function submitOrder(orderType) {
		let order = null;
		busy = true;
		try {
			// One request, one transaction. An order with half its lines, or lines
			// with no order, is worse than a sale that plainly failed — so the id is
			// generated here and the lines point at it inside the same batch.
			const id = newOrderId();
			const batch = pb.createBatch();
			batch.collection('orders').create({
				id,
				total_price: cart.total,
				payment_type: orderType,
				created_by: pb.authStore.record?.id
			});
			for (const item of cart.items) {
				batch.collection('order_items').create({
					order: id,
					product: item.id,
					// snapshot: editing a product later must not rewrite past sales
					product_name: item.name,
					variant_name: item.variant.name,
					quantity: item.quantity,
					unit_price: item.variant.price
				});
			}
			await batch.send();
			order = id;
			if (orderType !== 'register') {
				const res = await mypos(toReceipt(cart, orderType));
				// The device answers "no error" and still may not have printed: paper
				// out, or a fault it wants retried (printResult, p.20 of the protocol).
				// The sale is registered either way, so the order stands and the retry
				// is PrintAgain — the Ре-печат button in settings.
				const printed = res?.result?.printResult;
				if (printed === 'NO_PAPER') {
					notify('Свърши хартията. Смени я и натисни „Ре-печат“ в настройките.');
				} else if (printed && printed !== 'SUCCESS') {
					notify('Бележката не се отпечата. Опитай „Ре-печат“ в настройките.');
				}
			}
			cart.reset();
		} catch (e) {
			console.error(e);
			// cascade delete drops the order_items with it
			if (order) await pb.collection('orders').delete(order).catch(console.error);
			notify(`Поръчката не мина. ${e.message ?? e}`);
		}
		busy = false;
	}

	async function updateStats() {
		try {
			const today = await pb.collection('period_totals').getOne('today');
			todayTotal = today.total;
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
	<!-- h-[76px] matches the menu's header so the two rules line up across the screen -->
	<header class="flex h-[76px] shrink-0 items-center gap-2 border-b border-rule px-4">
		<h2 class="display flex-1 text-3xl text-amber">Сметка</h2>
		{#if cart.items.length}
			<button
				class="touch touch-danger h-11 min-h-0 w-11 text-muted"
				aria-label="Изчисти сметката"
				title="Изчисти сметката"
				onclick={() => cart.reset()}
			>
				<Trash />
			</button>
		{:else}
			<span class="flex items-baseline gap-2 text-base text-muted">
				Днес
				<span class="display text-2xl text-[color:var(--text)]">{money(todayTotal)}</span>
			</span>
		{/if}
	</header>

	<!-- Lines. The change calculator floats in here rather than in the footer, so
	     nothing tappable ever sits next to the payment buttons. -->
	<div class="relative min-h-0 flex-1">
		{#if showCalc && cart.items.length}
			<div
				class="absolute inset-x-3 bottom-3 z-10 rounded-[3px] border border-rule bg-panel shadow-[0_-8px_24px_rgba(0,0,0,0.5)]"
				transition:fly={{ y: 12, duration: 160 }}
			>
				<Calc />
			</div>
		{/if}

		<div class="h-full overflow-y-auto px-4">
			{#each cart.items as cartItem (lineKey(cartItem))}
				<!-- The name gets the full width of the panel: beer names here run long,
			     and truncating them hid which size had been rung up. -->
				<div
					class="border-b border-rule py-2"
					in:fly={{ y: -8, duration: 160 }}
					animate:flip={{ duration: 180 }}
				>
					<div class="mb-1 font-semibold leading-tight">{lineLabel(cartItem)}</div>

					<div class="flex items-center gap-2">
						<button
							class="touch touch-danger h-10 min-h-0 w-10 shrink-0 text-muted"
							aria-label="Премахни реда от сметката"
							title="Премахни реда от сметката"
							onclick={removeVariantFromCart(cartItem)}
						>
							<Trash />
						</button>

						<button
							class="touch h-10 min-h-0 w-10 shrink-0 text-lg"
							aria-label="Едно по-малко"
							title="Едно по-малко"
							onclick={() => cart.remove(cartItem)}>−</button
						>
						<input
							type="number"
							bind:value={cartItem.quantity}
							oninput={(e) => cart.setQuantity(cartItem, e.currentTarget.value)}
							onfocus={(e) => e.currentTarget.select()}
							min="1"
							aria-label="Количество"
							class="h-10 w-12 shrink-0 rounded-[3px] border border-rule bg-ink text-center font-semibold"
						/>
						<button
							class="touch h-10 min-h-0 w-10 shrink-0 text-lg"
							aria-label="Едно повече"
							title="Едно повече"
							onclick={() => cart.setQuantity(cartItem, cartItem.quantity + 1)}>+</button
						>

						<div class="display flex-1 text-right text-lg">
							{money(cartItem.variant.price * cartItem.quantity)}
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Its own strip under the list: clear of the payment buttons below and of the
	     clear-the-whole-order bin above, both costly to hit by mistake. -->
	{#if cart.items.length}
		<div class="shrink-0 border-t border-rule px-4 py-3">
			<button
				class="touch h-11 min-h-0 w-full text-xs uppercase tracking-widest
					{showCalc ? 'border-amber-dim text-amber' : 'text-muted'}"
				onclick={() => (showCalc = !showCalc)}
			>
				{showCalc ? 'Скрий ресто' : 'Изчисли ресто'}
			</button>
		</div>
	{/if}

	<!-- Total and payment. Paying prints a fiscal receipt, so those buttons sit
	     alone below a rule, with nothing tappable above them but the total and
	     nothing at all below them. -->
	<footer class="shrink-0 border-t border-rule px-4 py-4">
		<div class="flex items-baseline gap-3">
			<span class="eyebrow shrink-0">Общо</span>
			<span class="display flex-1 text-right text-5xl leading-none text-amber">
				{money(shownTotal.current)}
			</span>
		</div>

		{#if cart.items.length}
			<div
				class="mt-4 grid gap-2 border-t border-rule pt-4 {settings.showRegisterButton
					? 'grid-cols-3'
					: 'grid-cols-2'}"
			>
				<button class="touch touch-accent h-16 text-lg" onclick={handleSubmit('cash')}>
					В брой
				</button>
				<button class="touch touch-accent h-16 text-lg" onclick={handleSubmit('card')}>
					С карта
				</button>
				{#if settings.showRegisterButton}
					<!-- No fiscal receipt for this one — see submitOrder. -->
					<button class="touch h-16 text-lg" onclick={handleSubmit('register')}>Каса</button>
				{/if}
			</div>
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
		appearance: textfield;
	}
</style>
