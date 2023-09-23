<script>
	import CategorySidebar from '$lib/components/CategorySidebar.svelte';
	import cart from '$lib/stores/cart.js';

	let categories = ['Category 1', 'Category 2', 'Category 3', 'Category 4', 'Category 5'];

	let items = [
		{
			name: 'test',
			variants: [
				{
					variant: '0.33L',
					price: 10
				},
				{
					variant: '0.50L',
					price: 20
				},
				{
					variant: '1.0L',
					price: 30
				}
			]
		},
		{
			name: 'test2',
			variants: [
				{
					variant: '0.33L',
					price: 10
				},
				{
					variant: '0.50L',
					price: 20
				},
				{
					variant: '1.0L',
					price: 30
				}
			]
		}
	];

	function addItemToCart(item, variant) {
		return () => {
			cart.add({
				name: item.name,
				quantity: 1,
				...variant
			});
		};
	}

	function removeVariantFromCart(item) {
		return () => {
			cart.removeAll(item);
		};
	}
</script>

<div class="w-full p-8 flex">
	<CategorySidebar {categories} />

	<div class="flex-1 mr-8">
		{#each items as item}
			<div class="mb-6">
				<h2 class="text-xl mb-2 font-semibold">{item.name}</h2>
				<div>
					{#each item.variants as variant}
						<button
							class="mr-2 p-2 rounded-md border border-gray-300 hover:bg-gray-100"
							on:click={addItemToCart(item, variant)}
						>
							{variant.variant} - {variant.price}
						</button>
					{/each}
				</div>
			</div>
		{/each}
	</div>

	<!-- Shopping Cart -->
	<div class="w-80 border-l pl-6">
		<h2 class="text-2xl font-bold mb-4">Сметка</h2>

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
						{cartItem.name} ({cartItem.variant})
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
	</div>
</div>
