<script>
	import CategorySidebar from '$lib/components/CategorySidebar.svelte';
	import SettingsSidebar from '$lib/components/SettingsSidebar.svelte';
	import Cart from '$lib/components/Cart.svelte';
	import Item from '$lib/components/Item.svelte';
	import IconButton from '$lib/components/IconButton.svelte';
	import cart from '$lib/stores/cart.js';
	import Check from '$lib/icons/Check.svelte';
	// import Cog from '$lib/icons/Cog.svelte';
	import List from '$lib/icons/List.svelte';
	import X from '$lib/icons/X.svelte';
	// import Plus from '$lib/icons/Plus.svelte';

	import { page } from '$app/stores';
	import { onMount } from 'svelte';

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

	function loadProducts() {
		$page.data.supabase
			?.from('products_variants')
			.select(
				'price, products ( id, name, active, categories ( id, name ) ), variants ( id, name )'
			)
			.then(({ data }) => {
				for (const { price, products, variants } of data) {
					const cat = products.categories.name;
					const id = products.id;
					const name = products.name;
					if (!prdts[cat]) prdts[cat] = [];
					const existingProduct = prdts[cat].find((p) => p.name === name);
					if (existingProduct) {
						existingProduct.variants.push({
							id: variants.id,
							name: variants.name,
							price,
							active: products.active
						});
					} else {
						prdts[cat].push({
							id,
							name,
							variants: [{ id: variants.id, name: variants.name, price }],
							active: products.active
						});
					}
				}
				categories = Object.keys(prdts);
				selectedCategory = categories[0];
			});
	}

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

	function updateProductsVisibility() {
		items.map(async ({ id, active }) => {
			const { error } = await $page.data.supabase.from('products').update({ active }).eq('id', id);
			if (error) {
				console.error(error);
				alert(error);
			}
		});
	}

	function handleConfirmEdit() {
		editMode = false;
		updateProductsVisibility();
	}

	let editMode = false;

	onMount(() => {
		loadProducts();
	});

</script>

<div class="w-full p-2 flex h-screen -mb-4">
	<div class="w-32 mr-4 border-r pr-2 pt-4">
		<CategorySidebar {categories} {selectedCategory} on:select={selectCategory} />

		<hr class="mt-48 mb-4" />

		<SettingsSidebar />
	</div>

	<div class="flex-1 mr-4">
		<h2 class="text-2xl mb-2 font-semibold">
			<span class="text-orange-300">{selectedCategory}</span>
			{#if editMode}
				<!-- <IconButton borderColor="red-300" on:click={() => (editMode = false)}><X /></IconButton> -->
				<!-- <IconButton on:click={addItem}><Plus /></IconButton> -->
				<IconButton on:click={() => (editMode = false)} class="border-red-300"><X /></IconButton>
				<IconButton on:click={handleConfirmEdit} class="border-green-300"><Check /></IconButton>
			{:else}
				<!-- <IconButton on:click={corsCheck}><Cog /></IconButton> -->
				<IconButton on:click={() => (editMode = true)}><List /></IconButton>
			{/if}
		</h2>
		<hr class="mb-2" />
		{#if editMode}
			{#each items as item, i}
				<div class="mb-2">
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
				</div>
			{/each}
		{:else}
			{#each items.filter((item) => item.active) as item, i}
				<div class="m-2 {i % 2 == 0 ? 'bg-slate-800' : ''}">
					<Item {item} handleClick={addItemToCart} />
				</div>
			{/each}
		{/if}
	</div>

	<div class="w-96 border-l pl-4">
		<Cart />
	</div>
</div>
