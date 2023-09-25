<script>
	import cart from '$lib/stores/cart.js';

	function removeVariantFromCart(item) {
		return () => {
			cart.removeAll(item);
		};
	}
</script>

<h2 class="text-2xl font-semibold mb-2">Сметка
	<button
		class="mr-1 p-1 text-lg rounded-md border border-gray-300 hover:bg-gray-100 float-right"
		on:click={cart.reset}>X
	</button>
</h2>
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

<div class="flex justify-between border-t pt-4 mt-4">
	<button class="mr-2 p-2 rounded-md border border-gray-300 hover:bg-gray-100">В брой</button>
	<button class="mr-2 p-2 rounded-md border border-gray-300 hover:bg-gray-100">С карта</button>
	<button class="mr-2 p-2 rounded-md border border-gray-300 hover:bg-gray-100">Каса</button>
</div>
