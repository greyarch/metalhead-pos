<script>
	import { resolve } from '$app/paths';
	import { pb } from '$lib/pb.js';

	let today = $state({ total: 0, cash: 0, card: 0, register: 0 });

	async function getStats() {
		try {
			today = await pb.collection('today_totals').getFirstListItem('');
		} catch (error) {
			console.error(error);
		}
	}

	getStats();

	const money = (n) => `€${Number(n).toFixed(2)}`;
	let split = $derived([
		{ label: 'В брой', value: today.cash },
		{ label: 'Карта', value: today.card },
		{ label: 'Каса', value: today.register }
	]);
</script>

<main class="h-screen bg-ink p-8">
	<a href={resolve('/')} class="eyebrow mb-8 inline-block hover:text-[color:var(--text)]"
		>← Към касата</a
	>

	<h1 class="eyebrow mb-1">Оборот днес</h1>
	<p class="display mb-10 text-7xl leading-none text-amber">{money(today.total)}</p>

	<div class="grid max-w-2xl grid-cols-3 gap-px bg-rule">
		{#each split as { label, value } (label)}
			<div class="bg-panel px-5 py-4">
				<div class="eyebrow mb-1">{label}</div>
				<div class="display text-3xl leading-none">{money(value)}</div>
			</div>
		{/each}
	</div>
</main>
