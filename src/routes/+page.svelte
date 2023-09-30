<script>
	import CategorySidebar from '$lib/components/CategorySidebar.svelte';
	import Cart from '../lib/components/Cart.svelte';
	import cart from '$lib/stores/cart.js';
	import products from '$lib/stores/products.js';
	import Check from '$lib/icons/Check.svelte';
	import Xmark from '$lib/icons/X.svelte';
	import Cog from '$lib/icons/Cog.svelte';

	let categories = Object.keys($products) ?? [];
	let selectedCategory = categories[0] ?? '';
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

	let editMode = false;
</script>

<div class="w-full p-8 flex">
	<div class="w-32 mr-4 border-r pr-3">
		<CategorySidebar {categories} {selectedCategory} on:select={selectCategory} />
	</div>

	<div class="flex-1 mr-4">
		<h2 class="text-2xl mb-2 font-semibold">
			{selectedCategory}
			{#if editMode}
				<button
					class="mr-1 p-1 text-lg rounded-md border border-red-300 hover:bg-red-100 float-right"
					on:click={() => (editMode = false)}
					><Xmark />
				</button>
				<button
					class="mr-5 p-1 text-lg rounded-md border border-green-300 hover:bg-green-100 float-right"
					on:click={() => (editMode = false)}
					><Check />
				</button>
			{:else}
				<button
					class="mr-1 p-1 text-lg rounded-md border border-gray-300 hover:bg-gray-100 float-right"
					on:click={() => (editMode = true)}
					><Cog />
				</button>
			{/if}
		</h2>
		<hr class="mb-2" />
		{#each items as item}
			<div class="mb-2">
				{#if editMode}
					<div class="md:flex md:items-center mb-2">
						<label class="block text-white-500 font-bold">
							<input class="mr-2 leading-tight h-4 w-4" type="checkbox" bind:checked={item.active}/>
							<span class="text-xl"> {item.name} </span>
						</label>
					</div>
				{:else if item.active}
					<h2 class="text-xl mb-2 font-semibold">{item.name}</h2>
					<div>
						{#each item.variants as variant}
							<button
								class="mr-2 p-1 rounded-md border border-gray-300 hover:bg-gray-100"
								on:click={addItemToCart(item, variant)}
							>
								{variant.variant ? `${variant.variant} - ` : ''}{variant.price} лв.
							</button>
						{/each}
					</div>
				{/if}
			</div>
		{/each}
	</div>

	<div class="w-96 border-l pl-4">
		<Cart />
	</div>
</div>
