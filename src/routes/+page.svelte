<script>
	import CategorySidebar from '$lib/components/CategorySidebar.svelte';
	import SettingsSidebar from '$lib/components/SettingsSidebar.svelte';
	import Cart from '$lib/components/Cart.svelte';
	import Item from '$lib/components/Item.svelte';
	import IconButton from '$lib/components/IconButton.svelte';
	import { cart } from '$lib/stores/cart.svelte.js';
	import Check from '$lib/icons/Check.svelte';
	import Cog from '$lib/icons/Cog.svelte';
	import List from '$lib/icons/List.svelte';
	import X from '$lib/icons/X.svelte';
	import Plus from '$lib/icons/Plus.svelte';
	import Pencil from '$lib/icons/Pencil.svelte';
	import Trash from '$lib/icons/Trash.svelte';
	import ProductForm from '$lib/components/ProductForm.svelte';
	import ChevronDown from '$lib/icons/ChevronDown.svelte';
	import { fly } from 'svelte/transition';

	import { env } from '$env/dynamic/public';
	import { findDevice, checkDevice } from '$lib/mypos.js';
	import { notice, notify, clearNotice } from '$lib/stores/notice.svelte.js';
	import { pb } from '$lib/pb.js';
	import SettingsDialog from '$lib/components/SettingsDialog.svelte';

	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	const LAST_CATEGORY = 'lastCategory';

	let prdts = $state({});

	let catRecords = $state([]);
	let selectedCategory = $state('');

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
			// eslint-disable-next-line svelte/prefer-svelte-reactivity -- scratch map, thrown away before anything renders
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

	$effect(() => {
		if (selectedCategory) localStorage.setItem(LAST_CATEGORY, selectedCategory);
	});

	// The rail follows catRecords, so reordering that reorders the menu on screen.
	let categories = $derived(catRecords.map((c) => c.name));
	let selectedCategoryId = $derived(catRecords.find((c) => c.name === selectedCategory)?.id ?? '');

	async function handleProductSaved({ categoryId, created }) {
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

	let items = $derived([...(prdts[selectedCategory] ?? [])].sort(sortByName));

	// On the sale screen a product shows only its visible variants, and disappears
	// entirely once none of them are on.
	let visibleItems = $derived(
		items
			.map((item) => ({ ...item, variants: item.variants.filter((v) => v.active !== false) }))
			.filter((item) => item.variants.length)
	);

	// Edit mode lists one row per variant, which runs to a couple of hundred in a
	// category like Наливно — too many to thumb through without a filter.
	let editFilter = $state('');
	/** 'all' | 'shown' | 'hidden' */
	let editShow = $state('all');

	let editRows = $derived(
		items.flatMap((item) => item.variants.map((variant) => ({ item, variant })))
	);
	let shownRows = $derived(
		editRows.filter(({ item, variant }) => {
			const q = editFilter.trim().toLowerCase();
			if (
				q &&
				!item.name.toLowerCase().includes(q) &&
				!String(variant.name).toLowerCase().includes(q)
			)
				return false;
			// Deliberately the saved state, not the pending one: filtering on the tick
			// itself would make a row vanish the moment you ticked it, which is no use
			// when the job is working through a list of hidden things.
			if (editShow === 'shown') return variant.active !== false;
			if (editShow === 'hidden') return variant.active === false;
			return true;
		})
	);

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

	function selectCategory(category) {
		selectedCategory = category;
		showRail = false;
	}

	/**
	 * Visibility changes waiting behind the tick, keyed product+variant. Only
	 * differences live here, so cancelling is just throwing the map away.
	 */
	let pendingActive = $state({});
	let orderSnapshot = [];

	const variantKey = (productId, variant) => `${productId}|${variant.name}`;
	const isShown = (productId, variant) =>
		pendingActive[variantKey(productId, variant)] ?? variant.active !== false;

	function toggleVariant(productId, variant) {
		const key = variantKey(productId, variant);
		const next = !isShown(productId, variant);
		if (next === (variant.active !== false)) delete pendingActive[key];
		else pendingActive[key] = next;
	}

	function startEdit() {
		pendingActive = {};
		editFilter = '';
		editShow = 'all';
		orderSnapshot = catRecords.map((c) => c.id);
		editMode = true;
	}

	function cancelEdit() {
		pendingActive = {};
		editFilter = '';
		editShow = 'all';
		catRecords = orderSnapshot.map((id) => catRecords.find((c) => c.id === id)).filter(Boolean);
		editMode = false;
	}

	function moveCategory({ from, to }) {
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
			pendingActive = {};
		} catch (error) {
			console.error(error);
			notify(`Промените не бяха запазени. ${error?.message ?? error}`);
		}
	}

	async function handleConfirmEdit() {
		editMode = false;
		editFilter = '';
		editShow = 'all';
		await saveEdits();
	}

	// Deleting happens straight away rather than waiting behind the tick: it is
	// destructive, it is confirmed, and there is nothing sensible to undo it with.
	async function deleteCategory() {
		const cat = catRecords.find((c) => c.name === selectedCategory);
		if (!cat) return;

		if (items.length) {
			notify(`„${cat.name}“ не е празна — премести или изтрий продуктите ѝ първо.`);
			return;
		}

		if (!confirm(`Да изтрия ли категорията „${cat.name}“?`)) return;

		try {
			await pb.collection('categories').delete(cat.id);
		} catch (error) {
			console.error(error);
			notify(`Категорията не беше изтрита. ${error?.message ?? error}`);
			return;
		}

		delete prdts[cat.name];
		catRecords = catRecords.filter((c) => c.id !== cat.id);
		orderSnapshot = orderSnapshot.filter((id) => id !== cat.id);
		selectedCategory = catRecords[0]?.name ?? '';
	}

	let editMode = $state(false);
	let showProductForm = $state(false);
	/** Narrow screens only: below lg the rail is a drawer, below md the bill is a sheet. */
	let showRail = $state(false);
	let showCart = $state(false);
	let cartCount = $derived(cart.items.reduce((n, i) => n + i.quantity, 0));
	const money = (n) => `€${Number(n).toFixed(2)}`;

	// Which panes fit at this width. Each of the rail and the bill is mounted in
	// one place only — a second copy parked behind `hidden` would run its own
	// stats request and sit on its own stale total.
	const RAIL_FITS = '(min-width: 1024px)'; // lg
	const BILL_FITS = '(min-width: 768px)'; // md
	let railFits = $state(browser && window.matchMedia(RAIL_FITS).matches);
	let billFits = $state(browser && window.matchMedia(BILL_FITS).matches);

	onMount(() => {
		const watch = (query, set) => {
			const mq = window.matchMedia(query);
			const sync = () => set(mq.matches);
			mq.addEventListener('change', sync);
			return () => mq.removeEventListener('change', sync);
		};
		// Turning a tablet brings the pane itself back, so whatever was standing in
		// for it goes at that moment rather than being left open underneath it.
		const stop = [
			watch(RAIL_FITS, (v) => {
				railFits = v;
				if (v) showRail = false;
			}),
			watch(BILL_FITS, (v) => {
				billFits = v;
				if (v) showCart = false;
			})
		];
		return () => stop.forEach((off) => off());
	});
	let showSettings = $state(false);
	/** Product being edited, or null when the form is adding a new one. */
	let editProduct = $state(null);

	/** Why the device cannot sell, or null. Starts clear so a good one never flashes red. */
	let deviceFault = $state(null);
	const refreshDevice = async () => (deviceFault = await checkDevice());

	let banner = $derived(notice.flash ?? (deviceFault ? { text: deviceFault, tone: 'bad' } : null));

	onMount(() => {
		localStorage.getItem('myposUrl') || localStorage.setItem('myposUrl', env.PUBLIC_POS_URL);
		loadProducts();

		// The device going quiet mid-shift is the failure worth catching, so keep
		// asking rather than reporting once at load and never again.
		myposCheck().then(refreshDevice);
		const timer = setInterval(refreshDevice, 30_000);
		return () => clearInterval(timer);
	});

	// Startup scan only. A manual re-scan, with progress, lives in the settings
	// dialog. Finding nothing is not worth interrupting anyone over — the header
	// says so, and keeps saying so until the device answers.
	async function myposCheck() {
		try {
			await findDevice();
		} catch (error) {
			console.error('Error during scan:', error);
		}
	}
</script>

<!-- Left rail: what to sell, and the till drawer at the bottom. Written once and
     rendered either in place or in the drawer, so the drag-to-reorder rows and
     their pointer handlers cannot fork into two versions. -->
{#snippet rail()}
	<CategorySidebar
		{categories}
		{selectedCategory}
		{editMode}
		onselect={selectCategory}
		onmove={moveCategory}
	/>

	<div class="mt-auto pt-6">
		<SettingsSidebar />
	</div>
{/snippet}

<!-- Three panes for as long as three fit. Below lg the rail folds away into a
     drawer, below md the bill follows into a sheet, and the menu — the thing
     actually being used — keeps the whole width either way.
     h-dvh, not h-screen: a phone's address bar must not push the payment
     buttons under the fold. -->
<div class="flex h-dvh w-full flex-col bg-ink md:flex-row">
	{#if railFits}
		<aside class="flex w-52 shrink-0 flex-col border-r border-rule bg-panel p-3">
			{@render rail()}
		</aside>
	{/if}

	<!-- Centre: the products. Takes whatever is left over, so the rail and the bill
	     keep their widths and the space goes to the menu rather than beside it. -->
	<!-- h-[76px] here and on the bill's header so both rules land on the same line -->
	<main class="flex min-h-0 min-w-0 flex-1 flex-col px-3 pb-3 sm:px-5 sm:pb-5">
		<header
			class="mb-3 flex shrink-0 flex-wrap items-center gap-2 border-b border-rule py-3
				sm:gap-3 md:h-[76px] md:flex-nowrap md:py-0"
		>
			<h2 class="display min-w-0 flex-1 truncate text-2xl text-amber sm:text-3xl">
				{selectedCategory}
			</h2>

			<!-- The way back to the rail once it is a drawer. Next to the category it
			     changes, not off with the edit actions on the right. -->
			{#if !railFits}
				<IconButton onclick={() => (showRail = true)} aria-label="Смени категорията">
					<ChevronDown />
				</IconButton>
			{/if}

			<!-- One strip for everything the till has to say. A message someone raised
			     wins over the standing device warning, which is still true underneath
			     and comes back the moment the message is cleared. -->
			<!-- Below md it takes a line of its own. There is no width to share with
			     the title and the buttons, and a warning cut to one word says nothing. -->
			{#if banner}
				<span
					class="order-last flex w-full min-w-0 items-center gap-2 border px-3 py-1.5
						text-xs uppercase tracking-widest md:order-none md:w-auto md:max-w-[34rem]
						{banner.tone === 'ok'
						? 'border-amber-dim text-amber'
						: 'border-[color:var(--danger)] text-[color:var(--danger)]'}"
					role="status"
					title={banner.text}
				>
					<span
						class="h-2 w-2 shrink-0 rounded-full {banner.tone === 'ok'
							? 'bg-[color:var(--amber)]'
							: 'bg-[color:var(--danger)]'}"
						aria-hidden="true"
					></span>
					<span class="truncate">{banner.text}</span>
					{#if notice.flash}
						<button
							class="-mr-1 shrink-0 px-1 text-base leading-none opacity-70 hover:opacity-100"
							aria-label="Скрий съобщението"
							title="Скрий съобщението"
							onclick={clearNotice}>×</button
						>
					{/if}
				</span>
			{/if}

			{#if editMode}
				<span class="eyebrow hidden sm:block">Подредба и видимост</span>
				<IconButton
					onclick={deleteCategory}
					class={items.length ? '' : 'touch-danger'}
					aria-label="Изтрий категорията"
					title="Изтрий категорията"
				>
					<Trash />
				</IconButton>
				<IconButton onclick={() => (showProductForm = true)} aria-label="Добави нов продукт">
					<Plus />
				</IconButton>
				<IconButton onclick={cancelEdit} class="touch-danger" aria-label="Откажи промените">
					<X />
				</IconButton>
				<IconButton
					onclick={handleConfirmEdit}
					class="touch-accent"
					aria-label="Запази промените"
					title="Запази промените"
				>
					<Check />
				</IconButton>
			{:else}
				<IconButton onclick={() => (showSettings = true)} aria-label="Настройки">
					<Cog />
				</IconButton>
				<IconButton onclick={startEdit} aria-label="Редактирай менюто">
					<List />
				</IconButton>
			{/if}
		</header>

		{#if editMode && editRows.length}
			<div class="mb-3 flex flex-wrap items-center gap-2">
				<!-- Field and its clear button stay together on a line of their own until
				     there is room for them beside the three filters. -->
				<div class="flex w-full min-w-0 items-center gap-2 sm:w-auto sm:flex-1">
					<input
						class="h-12 min-w-0 flex-1 rounded-[3px] border border-rule bg-raised px-4"
						bind:value={editFilter}
						placeholder="Търси по име или размер…"
						aria-label="Търси в списъка"
					/>
					{#if editFilter}
						<button
							class="touch h-12 min-h-0 w-12 shrink-0 text-muted"
							aria-label="Изчисти търсенето"
							title="Изчисти търсенето"
							onclick={() => (editFilter = '')}
						>
							<X />
						</button>
					{/if}
				</div>

				<div class="flex shrink-0 gap-1">
					{#each [['all', 'Всички'], ['shown', 'Показани'], ['hidden', 'Скрити']] as [value, label] (value)}
						<button
							class="touch h-12 min-h-0 px-3 text-sm {editShow === value
								? 'border-amber-dim text-amber'
								: 'text-muted'}"
							aria-pressed={editShow === value}
							onclick={() => (editShow = value)}
						>
							{label}
						</button>
					{/each}
				</div>

				<span class="eyebrow shrink-0 whitespace-nowrap">
					{shownRows.length === editRows.length
						? `${editRows.length} реда`
						: `${shownRows.length} от ${editRows.length}`}
				</span>
			</div>
		{/if}

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
				{#each shownRows as { item, variant } (item.id + '|' + variant.name)}
					<div class="mb-1 flex items-center gap-1">
						<!-- min-w-0, or the row cannot shrink below the name it holds and pushes
						     the pencil off the right edge of a narrow screen. -->
						<label
							class="touch min-h-[52px] min-w-0 flex-1 cursor-pointer justify-start gap-2 px-3
									sm:gap-3 sm:px-4
									{isShown(item.id, variant) ? '' : 'opacity-45'}"
						>
							<input
								type="checkbox"
								class="h-5 w-5 accent-[color:var(--amber)]"
								checked={isShown(item.id, variant)}
								onchange={() => toggleVariant(item.id, variant)}
							/>
							<span class="display truncate text-lg">{item.name}</span>
							{#if variant.name !== 'default'}
								<span class="shrink-0 text-sm text-muted">{variant.name}</span>
							{/if}
							<span class="ml-auto shrink-0 text-sm text-muted">€{variant.price}</span>
						</label>
						<!-- `all`, not the category slice: the form saves the variant list it was
						     given, so handing it one category's worth would delete the rest. -->
						<IconButton
							aria-label="Редактирай „{item.name}“"
							onclick={() => {
								editProduct = { ...item, variants: item.all };
								showProductForm = true;
							}}
						>
							<Pencil />
						</IconButton>
					</div>
				{:else}
					<p class="mt-16 text-center text-muted">
						{editFilter || editShow !== 'all'
							? 'Нищо не съвпада с търсенето.'
							: 'Няма продукти в тази категория.'}
					</p>
				{/each}
			{:else}
				{#each visibleItems as item, i (item.id)}
					<Item {item} alt={i % 2 === 1} handleClick={addItemToCart} />
				{:else}
					<p class="mt-16 text-center text-muted">Няма продукти в тази категория.</p>
				{/each}
			{/if}
		</div>
	</main>

	<!-- Right: the bill -->
	{#if billFits}
		<aside class="flex w-80 shrink-0 flex-col border-l border-rule bg-panel lg:w-[26rem]">
			<Cart />
		</aside>
	{:else}
		<!-- Nowhere to stand beside the menu at this width, so the bill moves into a
		     sheet and this strip is all that is left of it on screen: what is owed,
		     and the way in. -->
		<div class="shrink-0 border-t border-rule bg-panel p-3">
			<button
				class="touch h-14 min-h-0 w-full justify-between px-4 disabled:opacity-50
					{cart.items.length ? 'touch-accent' : 'text-muted'}"
				disabled={!cart.items.length}
				onclick={() => (showCart = true)}
			>
				<span class="text-xs uppercase tracking-widest">
					Сметка{cartCount ? ` · ${cartCount}` : ''}
				</span>
				<span class="display text-2xl leading-none">{money(cart.total)}</span>
			</button>
		</div>
	{/if}
</div>

<svelte:window
	onkeydown={(e) => {
		// The dialogs run their own handler and sit above these, so Escape belongs
		// to whatever is on top rather than closing the lot at once.
		if (e.key !== 'Escape' || showSettings || showProductForm) return;
		showRail = false;
		showCart = false;
	}}
/>

<!-- The rail, once it no longer fits beside the menu. -->
{#if !railFits && showRail}
	<div class="fixed inset-0 z-40 flex">
		<button
			class="absolute inset-0 bg-black/70"
			aria-label="Затвори категориите"
			onclick={() => (showRail = false)}
		></button>
		<aside
			class="relative flex w-64 max-w-[80vw] flex-col overflow-y-auto border-r border-rule bg-panel p-3"
			transition:fly={{ x: -280, duration: 180 }}
		>
			{@render rail()}
		</aside>
	</div>
{/if}

<!-- The bill, likewise. Tall, but short of the full height: the strip of menu
     left showing says what is underneath and is the way back to it. -->
{#if !billFits && showCart}
	<div class="fixed inset-0 z-40 flex flex-col">
		<button
			class="absolute inset-0 bg-black/70"
			aria-label="Затвори сметката"
			onclick={() => (showCart = false)}
		></button>
		<div
			class="relative mt-auto flex h-[88dvh] flex-col border-t border-rule bg-panel"
			transition:fly={{ y: 400, duration: 200 }}
		>
			<button
				class="flex h-8 shrink-0 items-center justify-center"
				aria-label="Затвори сметката"
				title="Затвори сметката"
				onclick={() => (showCart = false)}
			>
				<span class="h-1 w-10 rounded-full bg-rule"></span>
			</button>
			<div class="min-h-0 flex-1">
				<Cart onfinish={() => (showCart = false)} />
			</div>
		</div>
	</div>
{/if}

{#if showSettings}
	<!-- The address can change in there, so re-check rather than leave the warning
	     up for another half minute. -->
	<SettingsDialog
		onclose={() => {
			showSettings = false;
			refreshDevice();
		}}
	/>
{/if}

{#if showProductForm}
	<ProductForm
		categories={catRecords}
		categoryId={editProduct?.category ?? selectedCategoryId}
		product={editProduct}
		onsaved={handleProductSaved}
		onclose={() => {
			showProductForm = false;
			editProduct = null;
		}}
	/>
{/if}
