<script>
	import CategorySidebar from '$lib/components/CategorySidebar.svelte';
	import SettingsSidebar from '$lib/components/SettingsSidebar.svelte';
	import Cart from '$lib/components/Cart.svelte';
	import Item from '$lib/components/Item.svelte';
	import IconButton from '$lib/components/IconButton.svelte';
	import cart from '$lib/stores/cart.js';
	import Check from '$lib/icons/Check.svelte';
	import Cog from '$lib/icons/Cog.svelte';
	import List from '$lib/icons/List.svelte';
	import X from '$lib/icons/X.svelte';
	// import Plus from '$lib/icons/Plus.svelte';

	import { env } from '$env/dynamic/public';
	import { findActiveServices } from '$lib/scan.js';
	import { pb } from '$lib/pb.js';

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

	async function loadProducts() {
		const [cats, products] = await Promise.all([
			pb.collection('categories').getFullList({ sort: 'sort,name' }),
			pb.collection('products').getFullList()
		]);

		const catName = Object.fromEntries(cats.map((c) => [c.id, c.name]));
		prdts = Object.fromEntries(cats.map((c) => [c.name, []]));
		for (const { id, name, active, category, variants } of products) {
			prdts[catName[category]]?.push({ id, name, active, variants });
		}

		categories = cats.map((c) => c.name);
		selectedCategory = categories[0];
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

	async function updateProductsVisibility() {
		try {
			await Promise.all(
				items.map(({ id, active }) => pb.collection('products').update(id, { active }))
			);
		} catch (error) {
			console.error(error);
			alert(error);
		}
	}

	async function handleConfirmEdit() {
		editMode = false;
		await updateProductsVisibility();
	}

	let editMode = false;

	onMount(() => {
		localStorage.getItem('myposUrl') || localStorage.setItem('myposUrl', env.PUBLIC_POS_URL);
		myposCheck();
		loadProducts();
	});

	async function myposCheck() {
		console.log('Scanning for active myPOS devices...');

		try {
			const activeServices = await findActiveServices();

			if (activeServices.length) {
				console.log(`Found ${activeServices.length} active myPOS devices:`);
				console.log(activeServices);
				localStorage.setItem('myposUrl', activeServices[0].url);
			} else {
				console.error('No myPOS devices found!');
				alert("Не намирам myPOS устройства!");
			}

			return activeServices;
		} catch (error) {
			console.error('Error during scan:', error);
			return [];
		}
	}
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
				<IconButton on:click={myposCheck}><Cog /></IconButton>
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
