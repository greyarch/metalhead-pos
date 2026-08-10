<script>
	import { untrack } from 'svelte';
	import { pb } from '$lib/pb.js';
	import X from '$lib/icons/X.svelte';
	import Trash from '$lib/icons/Trash.svelte';
	import ChevronUp from '$lib/icons/ChevronUp.svelte';
	import ChevronDown from '$lib/icons/ChevronDown.svelte';

	/**
	 * @type {{
	 *   categories?: {id: string, name: string, sort?: number}[],
	 *   categoryId?: string,
	 *   product?: {id: string, name: string, variants: any[]} | null,
	 *   onsaved: (detail: {record: any, categoryId: string|null, created: boolean}) => void,
	 *   onclose: () => void
	 * }}
	 */
	let { categories = [], categoryId = '', product = null, onsaved, onclose } = $props();

	const NEW_CATEGORY = '__new';
	const editing = untrack(() => !!product);

	let name = $state(untrack(() => product?.name ?? ''));
	let newCategory = $state('');
	// 'default' is how an only-one-way-to-buy-it product is stored; staff see a
	// blank box rather than the word.
	let variants = $state(
		untrack(() =>
			product?.variants?.length
				? product.variants.map((v) => ({
						name: v.name === 'default' ? '' : v.name,
						price: String(v.price),
						category: v.category ?? categoryId,
						active: v.active !== false
					}))
				: [{ name: '', price: '', category: categoryId, active: true }]
		)
	);
	let error = $state('');
	let busy = $state(false);

	let addedCategories = $state([]);
	let allCategories = $derived([...categories, ...addedCategories]);
	let addingCategory = $derived(variants.some((v) => v.category === NEW_CATEGORY));
	let byId = $derived(Object.fromEntries(allCategories.map((c) => [c.id, c.name])));

	// Staff type on a numeric keypad where the decimal key may be a comma.
	const toPrice = (raw) => Number(String(raw).replace(',', '.').trim());

	function addVariant() {
		const last = variants[variants.length - 1];
		variants = [
			...variants,
			{ name: '', price: '', category: last?.category ?? categoryId, active: true }
		];
	}

	function removeVariant(i) {
		variants = variants.filter((_, j) => j !== i);
	}

	/** Order here is the order of the price buttons on the sale screen. */
	function moveVariant(i, delta) {
		const to = i + delta;
		if (to < 0 || to >= variants.length) return;
		const next = [...variants];
		[next[i], next[to]] = [next[to], next[i]];
		variants = next;
	}

	async function save() {
		error = '';

		// Every row counts. Blanking a price used to delete that variant silently,
		// so clearing one to retype it lost it — the bin is how you remove a row.
		const blank = variants.some((v) => String(v.price).trim() === '');
		const clean = variants.map((v) => ({
			name: v.name.trim() || 'default',
			price: toPrice(v.price),
			category: v.category,
			active: v.active
		}));

		if (!name.trim()) return (error = 'Въведи име на продукта.');
		if (!clean.length) return (error = 'Въведи поне една цена.');
		if (clean.some((v) => !v.category)) return (error = 'Всеки ред иска категория.');
		if (addingCategory && !newCategory.trim()) return (error = 'Въведи име на новата категория.');
		if (
			addingCategory &&
			allCategories.some((c) => c.name.toLowerCase() === newCategory.trim().toLowerCase())
		)
			return (error = 'Вече има категория с това име.');
		if (blank) return (error = 'Всеки ред иска цена. Празен ред се маха с кошчето.');
		if (clean.some((v) => !Number.isFinite(v.price) || v.price <= 0))
			return (error = 'Цената трябва да е число по-голямо от нула.');
		if (new Set(clean.map((v) => v.name)).size !== clean.length)
			return (error = 'Има два реда с еднакво име.');

		// Nothing to write, and an unchanged save would still land in the audit log.
		if (editing && name.trim() === product.name && sameVariants(clean, product.variants)) {
			return onclose();
		}

		busy = true;
		try {
			if (addingCategory) {
				const sort = Math.max(0, ...allCategories.map((c) => c.sort ?? 0)) + 1;
				const created = await pb
					.collection('categories')
					.create({ name: newCategory.trim(), sort });
				// Staff cannot delete categories that are in use, so if the product below
				// fails, point the rows at the one that now exists rather than making a
				// second on retry.
				for (const v of clean) if (v.category === NEW_CATEGORY) v.category = created.id;
				for (const v of variants) if (v.category === NEW_CATEGORY) v.category = created.id;
				addedCategories.push(created);
				newCategory = '';
			}

			const fields = { name: name.trim(), variants: clean };
			const record = editing
				? await pb.collection('products').update(product.id, fields)
				: await pb.collection('products').create(fields);

			onsaved({ record, categoryId: clean[0].category, created: !editing });
		} catch (e) {
			console.error(e);
			error = `Не беше запазено. ${e.message ?? ''}`;
		}
		busy = false;
	}

	// Past sales keep their own copy of the name and price (see order_items), so
	// this takes the product off the menu without touching the books.
	async function remove() {
		const where = [...new Set((product.variants ?? []).map((v) => byId[v.category]))]
			.filter(Boolean)
			.join(', ');
		const answer = confirm(
			`Да изтрия ли „${product.name}“?\n\n` +
				`Изчезва от ${where || 'менюто'} заедно с всичките си цени.\n` +
				`Ако просто е свършил, махни отметката „Показвай“ вместо това.`
		);
		if (!answer) return;

		busy = true;
		try {
			await pb.collection('products').delete(product.id);
			onsaved({ record: null, categoryId: null, created: false });
		} catch (e) {
			console.error(e);
			error = `Не беше изтрит. ${e.message ?? ''}`;
			busy = false;
		}
	}

	function sameVariants(a, b) {
		const norm = (list) =>
			JSON.stringify((list ?? []).map((v) => [v.name, v.price, v.category, v.active !== false]));
		return norm(a) === norm(b);
	}
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && onclose()} />

<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
	role="presentation"
	onclick={(e) => e.target === e.currentTarget && onclose()}
>
	<!-- Only the variant list scrolls. A product with a few variants used to push
	     Запази off the bottom of a 1366x768 till. -->
	<div class="flex max-h-full w-[40rem] flex-col border border-rule bg-panel">
		<header class="flex shrink-0 items-center gap-2 border-b border-rule px-5 py-4">
			<h2 class="display flex-1 text-2xl text-amber">
				{editing ? 'Редакция на продукт' : 'Нов продукт'}
			</h2>
			<button
				class="touch h-11 min-h-0 w-11 text-muted"
				aria-label="Затвори"
				title="Затвори"
				onclick={() => onclose()}
			>
				<X />
			</button>
		</header>

		<div class="min-h-0 flex-1 overflow-y-auto px-5 py-4" oninput={() => (error = '')}>
			<label class="mb-5 block">
				<span class="eyebrow mb-1 block">Име</span>
				<!-- svelte-ignore a11y_autofocus -->
				<input
					class="h-14 w-full rounded-[3px] border border-rule bg-raised px-4 text-lg"
					bind:value={name}
					autofocus
					placeholder="напр. Anywhere Loud"
				/>
			</label>

			<div class="eyebrow mb-2">Варианти, цени и категории</div>
			{#each variants as variant, i (i)}
				<div class="mb-2 rounded-[3px] border border-rule p-2">
					<div class="mb-2 flex items-stretch gap-2">
						<input
							class="h-12 min-w-0 flex-1 rounded-[3px] border border-rule bg-raised px-4"
							bind:value={variant.name}
							placeholder="Вариант (напр. 0.5L, кенче)"
						/>
						<input
							class="h-12 w-24 rounded-[3px] border border-rule bg-raised px-3 text-right text-lg"
							inputmode="decimal"
							bind:value={variant.price}
							placeholder="€"
						/>
						<div class="flex w-9 shrink-0 flex-col gap-1">
							<button
								class="touch min-h-0 flex-1 disabled:pointer-events-none disabled:opacity-25"
								aria-label="Премести реда нагоре"
								title="Премести реда нагоре"
								disabled={i === 0}
								onclick={() => moveVariant(i, -1)}
							>
								<ChevronUp />
							</button>
							<button
								class="touch min-h-0 flex-1 disabled:pointer-events-none disabled:opacity-25"
								aria-label="Премести реда надолу"
								title="Премести реда надолу"
								disabled={i === variants.length - 1}
								onclick={() => moveVariant(i, 1)}
							>
								<ChevronDown />
							</button>
						</div>
						<button
							class="touch touch-danger h-12 w-12 shrink-0 text-muted disabled:pointer-events-none disabled:opacity-30"
							aria-label="Премахни този вариант"
							title="Премахни този вариант"
							disabled={variants.length === 1}
							onclick={() => removeVariant(i)}
						>
							<Trash />
						</button>
					</div>

					<div class="flex items-stretch gap-2">
						<select
							class="h-12 min-w-0 flex-1 rounded-[3px] border border-rule bg-raised px-3"
							bind:value={variant.category}
							aria-label="Категория за този вариант"
						>
							{#each allCategories as category (category.id)}
								<option value={category.id}>{category.name}</option>
							{/each}
							<option value={NEW_CATEGORY}>+ Нова категория…</option>
						</select>
						<label class="touch h-12 min-h-0 w-40 shrink-0 cursor-pointer justify-start gap-2 px-3">
							<input
								type="checkbox"
								class="h-5 w-5 accent-[color:var(--amber)]"
								bind:checked={variant.active}
							/>
							<span class="text-sm">Показвай</span>
						</label>
					</div>
				</div>
			{/each}

			{#if addingCategory}
				<input
					class="mb-2 h-14 w-full rounded-[3px] border border-amber-dim bg-raised px-4 text-lg"
					bind:value={newCategory}
					placeholder="Име на новата категория"
				/>
			{/if}

			<button class="touch mt-1 h-12 w-full text-sm text-muted" onclick={addVariant}>
				+ Още един вариант
			</button>

			<p class="mt-3 text-xs text-muted">
				Един продукт може да се продава в няколко категории — наливно в едната, кенче в другата.
				Остави името празно, ако се продава само по един начин.
			</p>

			{#if error}
				<p
					class="mt-4 border-l-2 border-[color:var(--danger)] py-1 pl-3 text-sm text-[color:var(--danger)]"
				>
					{error}
				</p>
			{/if}
		</div>

		<footer class="flex shrink-0 gap-2 border-t border-rule px-5 py-4">
			{#if editing}
				<!-- Off on its own at the far end: the two buttons anyone presses on a
				     normal edit are together on the right, away from this one. -->
				<button
					class="touch touch-danger h-14 w-14 shrink-0 text-muted"
					aria-label="Изтрий продукта"
					title="Изтрий продукта"
					disabled={busy}
					onclick={remove}
				>
					<Trash />
				</button>
			{/if}
			<div class="ml-auto grid flex-1 grid-cols-2 gap-2">
				<button class="touch h-14" onclick={() => onclose()}>Откажи</button>
				<button class="touch touch-accent h-14 text-lg" disabled={busy} onclick={save}>
					{busy ? 'Запазвам…' : 'Запази'}
				</button>
			</div>
		</footer>
	</div>
</div>
