<script>
	import { resolve } from '$app/paths';
	import { pb } from '$lib/pb.js';

	// Order and labels live here, not in the view: the SQL groups by id, so the
	// rows come back alphabetically.
	const PERIODS = [
		{ id: 'today', label: 'Оборот днес' },
		{ id: 'week', label: 'Тази седмица' },
		{ id: 'month', label: 'Този месец' },
		{ id: 'year', label: 'Тази година' }
	];
	const EMPTY = { total: 0, cash: 0, card: 0, register: 0 };

	let totals = $state({});

	async function getStats() {
		try {
			const rows = await pb.collection('period_totals').getFullList();
			totals = Object.fromEntries(rows.map((row) => [row.id, row]));
		} catch (error) {
			console.error(error);
		}
	}

	getStats();

	const money = (n) => `€${Number(n).toFixed(2)}`;
	const split = (row) => [
		{ label: 'В брой', value: row.cash },
		{ label: 'Карта', value: row.card },
		{ label: 'Каса', value: row.register }
	];
</script>

<!-- h-dvh, not h-screen: body is overflow-hidden, so this is the only thing that
     scrolls, and at 100vh its bottom edge sits under a phone's address bar — the
     last period's breakdown could be scrolled to but never seen. Extra room at the
     end so it does not finish flush against the edge either. -->
<main class="h-dvh overflow-y-auto bg-ink p-4 pb-10 sm:p-6 sm:pb-12 lg:p-8 lg:pb-14">
	<a href={resolve('/')} class="eyebrow mb-6 inline-block hover:text-[color:var(--text)] sm:mb-8"
		>← Към касата</a
	>

	{#each PERIODS as { id, label }, i (id)}
		{@const row = totals[id] ?? EMPTY}
		<section class={i === 0 ? 'mb-8 sm:mb-10' : 'mt-8 sm:mt-10'}>
			<h2 class="eyebrow mb-1">{label}</h2>
			<p
				class="display mb-3 leading-none sm:mb-4 {i === 0
					? 'text-5xl text-amber sm:text-6xl lg:text-7xl'
					: 'text-4xl sm:text-5xl'}"
			>
				{money(row.total)}
			</p>

			<div class="grid max-w-2xl grid-cols-1 gap-px bg-rule sm:grid-cols-3">
				{#each split(row) as { label: cut, value } (cut)}
					<div
						class="flex items-baseline justify-between gap-3 bg-panel px-4 py-3 sm:block sm:px-5 sm:py-4"
					>
						<div class="eyebrow sm:mb-1">{cut}</div>
						<div class="display text-2xl leading-none sm:text-3xl">{money(value)}</div>
					</div>
				{/each}
			</div>
		</section>
	{/each}
</main>
