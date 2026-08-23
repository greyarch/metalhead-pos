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

<main class="min-h-screen bg-ink p-8">
	<a href={resolve('/')} class="eyebrow mb-8 inline-block hover:text-[color:var(--text)]"
		>← Към касата</a
	>

	{#each PERIODS as { id, label }, i (id)}
		{@const row = totals[id] ?? EMPTY}
		<section class={i === 0 ? 'mb-10' : 'mt-10'}>
			<h2 class="eyebrow mb-1">{label}</h2>
			<p class="display mb-4 leading-none {i === 0 ? 'text-7xl text-amber' : 'text-5xl'}">
				{money(row.total)}
			</p>

			<div class="grid max-w-2xl grid-cols-3 gap-px bg-rule">
				{#each split(row) as { label: cut, value } (cut)}
					<div class="bg-panel px-5 py-4">
						<div class="eyebrow mb-1">{cut}</div>
						<div class="display text-3xl leading-none">{money(value)}</div>
					</div>
				{/each}
			</div>
		</section>
	{/each}
</main>
