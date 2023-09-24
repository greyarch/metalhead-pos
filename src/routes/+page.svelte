<script>
	import CategorySidebar from '$lib/components/CategorySidebar.svelte';
	import ShoppingCart from '../lib/components/ShoppingCart.svelte';
	import cart from '$lib/stores/cart.js';
	import products from '$lib/stores/products.js';

	$: selectedCategory = categories[0] ?? '';

	$: categories = Object.keys($products) ?? [];

	$: items = $products[selectedCategory] ?? [];

	function addItemToCart(item, variant) {
		return () => {
			cart.add({
				name: item.name,
				quantity: 1,
				...variant
			});
		};
	}

	function selectCategory(e) {
		selectedCategory = e.detail.category;
	}
</script>

<div class="w-full p-8 flex">
	<div class="w-32 mr-4 border-r pr-3">
		<CategorySidebar {categories} {selectedCategory} on:select={selectCategory} />
	</div>

	<div class="flex-1 mr-4">
		<h2 class="text-2xl mb-2 font-semibold">{selectedCategory}</h2>
		<hr class="mb-2" />
		{#each items as item}
			<div class="mb-6">
				<h2 class="text-xl mb-2 font-semibold">{item.name}</h2>
				<div>
					{#each item.variants as variant}
						<button
							class="mr-2 p-2 rounded-md border border-gray-300 hover:bg-gray-100"
							on:click={addItemToCart(item, variant)}
						>
							{variant.variant ? `${variant.variant} - ` : ''}{variant.price} лв.
						</button>
					{/each}
				</div>
			</div>
		{/each}
	</div>

	<!-- Shopping Cart -->
	<div class="w-96 border-l pl-4">
		<ShoppingCart />
	</div>
</div>
