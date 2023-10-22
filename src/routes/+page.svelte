<script>
	import CategorySidebar from '$lib/components/CategorySidebar.svelte';
	import Cart from '../lib/components/Cart.svelte';
	import cart from '$lib/stores/cart.js';
	import Check from '$lib/icons/Check.svelte';
	// import Xmark from '$lib/icons/X.svelte';
	import Cog from '$lib/icons/Cog.svelte';
	import { page } from '$app/stores';

	let prdts = {};

	let categories = [];
	let selectedCategory = '';

	$page.data.supabase
		?.from('products_variants')
		.select('price, products ( id, name, categories ( id, name ) ), variants ( id, name )')
		.then(({ data }) => {
			// console.log(JSON.stringify(data, null, 2));
			for (const { price, products, variants } of data) {
				const cat = products.categories.name;
				const id = products.id;
				const name = products.name;
				// console.log(cat, id, name, variants, price);
				if (!prdts[cat]) prdts[cat] = [];
				const existingProduct = prdts[cat].find((p) => p.name === name);
				if (existingProduct) {
					existingProduct.variants.push({ id: variants.id, name: variants.name, price });
				} else {
					prdts[cat].push({
						id,
						name,
						variants: [{ id: variants.id, name: variants.name, price }],
						active: true
					});
				}
			}
			// console.log(JSON.stringify(prdts, null, 2));
			categories = Object.keys(prdts);
			selectedCategory = categories[0];
			// items = products[categories[0]];
		});

	$: console.log($cart);
	$: items = prdts[selectedCategory] ?? [];
	// $: console.log(selectedCategory, items);

	function addItemToCart(item, variant) {
		return () => {
			console.log('addItemToCart', item, variant);
			cart.add({
				id: item.id,
				name: item.name,
				quantity: 1,
				variant
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
				<!-- <button
					class="mr-1 p-1 text-lg rounded-md border border-red-300 hover:bg-red-100 float-right"
					on:click={() => (editMode = false)}
					><Xmark />
				</button> -->
				<button
					class="mr-1 p-1 text-lg rounded-md border border-green-300 hover:bg-green-100 float-right"
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
							<input
								class="mr-2 leading-tight h-4 w-4"
								type="checkbox"
								bind:checked={item.active}
							/>
							<span class="text-xl"> {item.name} </span>
						</label>
					</div>
				{:else if item.active}
					{#if item.variants?.length > 1}
						<h2 class="text-xl mb-2 font-semibold">{item.name}</h2>
						<div>
							{#each item.variants as variant}
								<button
									class="mr-2 p-1 rounded-md border border-gray-300 hover:bg-gray-100"
									on:click={addItemToCart(item, variant)}
								>
									{variant.name !== 'default' ? `${variant.name} - ` : ''}{variant.price} лв.
								</button>
							{/each}
						</div>
					{:else}
						<button
							class="text-xl font-semibold mr-2 p-1 rounded-md border border-gray-300 hover:bg-gray-100"
							on:click={addItemToCart(item, item.variants[0])}
						>
							{item.name} - {item.variants[0].price} лв.
						</button>
					{/if}
					<hr class="mt-2" />
				{/if}
			</div>
		{/each}
	</div>

	<div class="w-96 border-l pl-4">
		<Cart />
	</div>
</div>
