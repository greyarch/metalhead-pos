<script>
	import CategorySidebar from '$lib/components/CategorySidebar.svelte';
	import Cart from '$lib/components/Cart.svelte';
	import Item from '$lib/components/Item.svelte';
	import cart from '$lib/stores/cart.js';
	import Check from '$lib/icons/Check.svelte';
	// import Xmark from '$lib/icons/X.svelte';
	import Cog from '$lib/icons/Cog.svelte';
	import { page } from '$app/stores';

	let prdts = {};

	let categories = [];
	let selectedCategory = '';

	const sortByName = (a, b) => {
		const nameA = a.name.toUpperCase();
		const nameB = b.name.toUpperCase();
		if (nameA < nameB) {
			return -1;
		}
		if (nameA > nameB) {
			return 1;
		}
		return 0;
	};

	$page.data.supabase
		?.from('products_variants')
		.select('price, products ( id, name, categories ( id, name ) ), variants ( id, name )')
		.then(({ data }) => {
			for (const { price, products, variants } of data) {
				const cat = products.categories.name;
				const id = products.id;
				const name = products.name;
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
			categories = Object.keys(prdts);
			selectedCategory = categories[0];
		});

	$: items = (prdts[selectedCategory] ?? []).sort(sortByName);

	function addItemToCart(item, variant) {
		return () => {
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

<div class="w-full p-2 flex">
	<div class="w-32 mr-4 border-r pr-2 pt-4">
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
					<Item {item} handleClick={addItemToCart} />
				{/if}
			</div>
		{/each}
	</div>

	<div class="w-96 border-l pl-4">
		<Cart />
	</div>
</div>
