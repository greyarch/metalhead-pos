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
	import Plus from '$lib/icons/Plus.svelte';
	import Pencil from '$lib/icons/Pencil.svelte';
	import Trash from '$lib/icons/Trash.svelte';
	import ProductForm from '$lib/components/ProductForm.svelte';

	import { env } from '$env/dynamic/public';
	import { findDevice } from '$lib/mypos.js';
	import { pb } from '$lib/pb.js';
	import SettingsDialog from '$lib/components/SettingsDialog.svelte';

	import { onMount } from 'svelte';

	const LAST_CATEGORY = 'lastCategory';

	let prdts = {};

	let catRecords = [];
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

		// A product appears in every category its variants point at, carrying only
		// the variants that belong there — draught sizes under Наливно, the can
		// under Кенчета, one product, one price list.
		const catName = Object.fromEntries(cats.map((c) => [c.id, c.name]));
		prdts = Object.fromEntries(cats.map((c) => [c.name, []]));
		for (const { id, name, variants } of products) {
			const byCategory = new Map();
			for (const v of variants ?? []) {
				if (!byCategory.has(v.category)) byCategory.set(v.category, []);
				byCategory.get(v.category).push(v);
			}
			for (const [categoryId, own] of byCategory) {
				// a variant left pointing at a deleted category has nowhere to show
				if (!catName[categoryId]) continue;
				prdts[catName[categoryId]].push({ id, name, variants: own, all: variants });
			}
		}

		catRecords = cats;
		// Keep the current pick across a reload, then fall back to the one this till
		// was last left on. '' rather than undefined when there is nothing at all,
		// or the heading prints the word "undefined".
		const known = (name) => cats.some((c) => c.name === name);
		selectedCategory =
			[selectedCategory, localStorage.getItem(LAST_CATEGORY)].find(known) ?? cats[0]?.name ?? '';
	}

	$: if (selectedCategory) localStorage.setItem(LAST_CATEGORY, selectedCategory);

	// The rail follows catRecords, so reordering that reorders the menu on screen.
	$: categories = catRecords.map((c) => c.name);
	$: selectedCategoryId = catRecords.find((c) => c.name === selectedCategory)?.id ?? '';

	async function handleProductSaved(e) {
		const { categoryId, created } = e.detail;
		showProductForm = false;
		editProduct = null;

		// A saved product can land in several categories at once, so rebuild rather
		// than trying to splice it into place. Pending visibility toggles live in
		// their own map and survive the reload.
		await loadProducts();
		if (created) {
			const saved = catRecords.find((c) => c.id === categoryId);
			if (saved) selectedCategory = saved.name;
		}
	}

	$: items = (prdts[selectedCategory] ?? []).sort(sortByName);

	// On the sale screen a product shows only its visible variants, and disappears
	// entirely once none of them are on.
	$: visibleItems = items
		.map((item) => ({ ...item, variants: item.variants.filter((v) => v.active !== false) }))
		.filter((item) => item.variants.length);

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

	/**
	 * Visibility changes waiting behind the tick, keyed product+variant. Only
	 * differences live here, so cancelling is just throwing the map away.
	 */
	let pendingActive = {};
	let orderSnapshot = [];

	const variantKey = (productId, variant) => `${productId}|${variant.name}`;
	const isShown = (productId, variant) =>
		pendingActive[variantKey(productId, variant)] ?? variant.active !== false;

	function toggleVariant(productId, variant) {
		const key = variantKey(productId, variant);
		const next = !isShown(productId, variant);
		if (next === (variant.active !== false)) delete pendingActive[key];
		else pendingActive[key] = next;
		pendingActive = pendingActive;
	}

	function startEdit() {
		pendingActive = {};
		orderSnapshot = catRecords.map((c) => c.id);
		editMode = true;
	}

	function cancelEdit() {
		pendingActive = {};
		catRecords = orderSnapshot.map((id) => catRecords.find((c) => c.id === id)).filter(Boolean);
		editMode = false;
	}

	function moveCategory(e) {
		const { from, to } = e.detail;
		if (from === to || to < 0 || to >= catRecords.length) return;
		const next = [...catRecords];
		const [moved] = next.splice(from, 1);
		next.splice(to, 0, moved);
		catRecords = next;
	}

	async function saveEdits() {
		// Only what actually changed: writing everything put no-op rows in the audit
		// log, and toggles made before switching category were never saved at all.
		const touched = new Set(Object.keys(pendingActive).map((k) => k.split('|')[0]));
		const cats = catRecords.filter((c, i) => orderSnapshot[i] !== c.id);
		if (!touched.size && !cats.length) return;

		// Visibility lives inside the product's variants, so a change rewrites that
		// product's whole list with the pending flags applied.
		const products = [];
		for (const id of touched) {
			const slice = Object.values(prdts)
				.flat()
				.find((p) => p.id === id);
			if (!slice) continue;
			products.push({
				id,
				variants: slice.all.map((v) => ({ ...v, active: isShown(id, v) }))
			});
		}

		try {
			await Promise.all([
				...products.map(({ id, variants }) => pb.collection('products').update(id, { variants })),
				// sort is the position itself, so the saved order is what is on screen
				...cats.map((c) =>
					pb.collection('categories').update(c.id, { sort: catRecords.indexOf(c) })
				)
			]);
			for (const c of cats) c.sort = catRecords.indexOf(c);
			for (const { id, variants } of products) {
				for (const slice of Object.values(prdts).flat()) {
					if (slice.id !== id) continue;
					slice.all = variants;
					slice.variants = variants.filter((v) => slice.variants.some((o) => o.name === v.name));
				}
			}
			prdts = prdts;
			pendingActive = {};
		} catch (error) {
			console.error(error);
			alert(error);
		}
	}

	async function handleConfirmEdit() {
		editMode = false;
		await saveEdits();
	}

	// Deleting happens straight away rather than waiting behind the tick: it is
	// destructive, it is confirmed, and there is nothing sensible to undo it with.
	async function deleteCategory() {
		const cat = catRecords.find((c) => c.name === selectedCategory);
		if (!cat) return;

		if (items.length) {
			// Staff cannot delete products, only move them, so say that rather than
			// leaving a dead button they cannot explain.
			alert(
				`Категорията „${cat.name}“ не е празна.\n\n` +
					`Премести цените ѝ в друга категория (моливчето до всеки ред), после я изтрий.`
			);
			return;
		}

		if (!confirm(`Да изтрия ли категорията „${cat.name}“?`)) return;

		try {
			await pb.collection('categories').delete(cat.id);
		} catch (error) {
			console.error(error);
			alert(`Категорията не беше изтрита.\n\n${error?.message ?? error}`);
			return;
		}

		delete prdts[cat.name];
		prdts = prdts;
		catRecords = catRecords.filter((c) => c.id !== cat.id);
		orderSnapshot = orderSnapshot.filter((id) => id !== cat.id);
		selectedCategory = catRecords[0]?.name ?? '';
	}

	let editMode = false;
	let showProductForm = false;
	let showSettings = false;
	/** Product being edited, or null when the form is adding a new one. */
	let editProduct = null;

	onMount(() => {
		localStorage.getItem('myposUrl') || localStorage.setItem('myposUrl', env.PUBLIC_POS_URL);
		myposCheck();
		loadProducts();
	});

	// Startup scan only. A manual re-scan, with progress, lives in the settings dialog.
	async function myposCheck() {
		try {
			if (!(await findDevice())) {
				console.error('No myPOS devices found!');
				alert('Не намирам myPOS устройства!');
			}
		} catch (error) {
			console.error('Error during scan:', error);
		}
	}
</script>

<div class="flex h-screen w-full bg-ink">
	<!-- Left rail: what to sell, and the till drawer at the bottom -->
	<aside class="flex w-52 shrink-0 flex-col border-r border-rule bg-panel p-3">
		<div class="eyebrow mb-2 px-1">Металхед</div>
		<CategorySidebar
			{categories}
			{selectedCategory}
			{editMode}
			on:select={selectCategory}
			on:move={moveCategory}
		/>

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
				<span class="eyebrow hidden sm:block">Подредба и видимост</span>
				<IconButton
					on:click={deleteCategory}
					class={items.length ? '' : 'touch-danger'}
					aria-label="Изтрий категорията"
				>
					<Trash />
				</IconButton>
				<IconButton on:click={() => (showProductForm = true)}><Plus /></IconButton>
				<IconButton on:click={cancelEdit} class="touch-danger"><X /></IconButton>
				<IconButton on:click={handleConfirmEdit} class="touch-accent"><Check /></IconButton>
			{:else}
				<IconButton on:click={() => (showSettings = true)}><Cog /></IconButton>
				<IconButton on:click={startEdit}><List /></IconButton>
			{/if}
		</header>

		<div class="min-h-0 flex-1 overflow-y-auto pr-1">
			{#if !categories.length}
				<p class="mt-16 text-center text-muted">
					Още няма нищо за продан.<br />
					{#if editMode}
						Добави първия продукт с <span class="text-amber">+</span> горе.
					{:else}
						Отвори списъка горе и добави първия продукт.
					{/if}
				</p>
			{:else if editMode}
				<!-- One row per variant: a beer can be on tap here and in a can elsewhere,
				     so each is shown and hidden on its own. -->
				{#each items as item}
					{#each item.variants as variant}
						<div class="mb-1 flex items-center gap-1">
							<label
								class="touch min-h-[52px] flex-1 cursor-pointer justify-start gap-3 px-4
									{isShown(item.id, variant) ? '' : 'opacity-45'}"
							>
								<input
									type="checkbox"
									class="h-5 w-5 accent-[color:var(--amber)]"
									checked={isShown(item.id, variant)}
									on:change={() => toggleVariant(item.id, variant)}
								/>
								<span class="display truncate text-lg">{item.name}</span>
								{#if variant.name !== 'default'}
									<span class="shrink-0 text-sm text-muted">{variant.name}</span>
								{/if}
								<span class="ml-auto shrink-0 text-sm text-muted">€{variant.price}</span>
							</label>
							<IconButton
								on:click={() => {
									editProduct = item;
									showProductForm = true;
								}}
							>
								<Pencil />
							</IconButton>
						</div>
					{/each}
				{/each}
			{:else}
				{#each visibleItems as item, i}
					<Item {item} alt={i % 2 === 1} handleClick={addItemToCart} />
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

{#if showSettings}
	<SettingsDialog on:close={() => (showSettings = false)} />
{/if}

{#if showProductForm}
	<ProductForm
		categories={catRecords}
		categoryId={editProduct?.category ?? selectedCategoryId}
		product={editProduct}
		on:saved={handleProductSaved}
		on:close={() => {
			showProductForm = false;
			editProduct = null;
		}}
	/>
{/if}
