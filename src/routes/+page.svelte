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
				alert('Не намирам myPOS устройства!');
			}

			return activeServices;
		} catch (error) {
			console.error('Error during scan:', error);
			return [];
		}
	}
</script>

<div class="flex h-screen w-full bg-ink">
	<!-- Left rail: what to sell, and the till drawer at the bottom -->
	<aside class="flex w-52 shrink-0 flex-col border-r border-rule bg-panel p-3">
		<div class="eyebrow mb-2 px-1">Металхед</div>
		<CategorySidebar {categories} {selectedCategory} on:select={selectCategory} />

		<div class="mt-auto pt-6">
			<SettingsSidebar />
		</div>
	</aside>

	<!-- Centre: the products -->
	<!-- max-w keeps name and price from drifting apart on a wide screen -->
	<main class="flex min-w-0 w-full max-w-4xl flex-1 flex-col p-5">
		<header class="mb-3 flex items-center gap-3 border-b border-rule pb-3">
			<h2 class="display flex-1 truncate text-3xl text-amber">{selectedCategory}</h2>
			{#if editMode}
				<span class="eyebrow hidden sm:block">Кои се показват</span>
				<IconButton on:click={() => (editMode = false)} class="touch-danger"><X /></IconButton>
				<IconButton on:click={handleConfirmEdit} class="touch-accent"><Check /></IconButton>
			{:else}
				<IconButton on:click={myposCheck}><Cog /></IconButton>
				<IconButton on:click={() => (editMode = true)}><List /></IconButton>
			{/if}
		</header>

		<div class="min-h-0 flex-1 overflow-y-auto pr-1">
			{#if editMode}
				{#each items as item}
					<label
						class="touch mb-1 min-h-[52px] cursor-pointer justify-start gap-3 px-4
							{item.active ? '' : 'opacity-45'}"
					>
						<input
							type="checkbox"
							class="h-5 w-5 accent-[color:var(--amber)]"
							bind:checked={item.active}
						/>
						<span class="display text-lg">{item.name}</span>
					</label>
				{/each}
			{:else}
				{#each items.filter((item) => item.active) as item}
					<Item {item} handleClick={addItemToCart} />
				{:else}
					<p class="mt-16 text-center text-muted">Няма продукти в тази категория.</p>
				{/each}
			{/if}
		</div>
	</main>

	<!-- Right: the bill -->
	<aside class="flex w-[26rem] shrink-0 flex-col border-l border-rule bg-panel">
		<Cart />
	</aside>
</div>
