<script>
	import cart from '$lib/stores/cart.js';

	function removeVariantFromCart(item) {
		return () => {
			cart.removeAll(item);
		};
	}
</script>

<h2 class="text-2xl font-semibold mb-2">Сметка</h2>
<hr class="pb-4" />

<!-- Cart Items -->
{#each $cart.items as cartItem}
	<div class="mb-4">
		<div class="flex justify-between">
			<span class="font-medium">
				<button
					class="mr-1 p-1 rounded-md border border-gray-300 hover:bg-gray-100"
					on:click={removeVariantFromCart(cartItem)}
				>
					X
				</button>
				{cartItem.name}{cartItem.variant ? ` (${cartItem.variant})` : ''}
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
