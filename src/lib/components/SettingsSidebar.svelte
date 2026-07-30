<script>
	import { cashIn, cashOut, printAgain, diagnostic } from '$lib/mypos.js';

	// Rare and consequential (each prints on the fiscal device), so they sit at the
	// bottom of the rail, smaller and quieter than anything used during a sale.
	const actions = [
		{ label: '+ €100', run: cashIn },
		{ label: '- €100', run: cashOut },
		{ label: 'Ре-печат', run: printAgain },
		{ label: 'Диагностика', run: diagnostic }
	];
</script>

<div class="eyebrow mb-2 px-1">Каса</div>
<div class="flex flex-col gap-1">
	{#each actions as { label, run }}
		<button
			class="touch min-h-[44px] justify-start px-4 text-sm text-muted hover:text-[color:var(--text)]"
			on:click={run}
		>
			{label}
		</button>
	{/each}
</div>
