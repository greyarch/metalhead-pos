<script>
	import { cashIn, cashOut } from '$lib/mypos.js';

	// Rare and consequential (each prints on the fiscal device), so they sit at the
	// bottom of the rail, smaller and quieter than anything used during a sale.
	// Diagnostics and reprint live in the settings dialog behind the cog.
	const actions = [
		{ label: '+ €100', run: cashIn },
		{ label: '- €100', run: cashOut }
	];

	async function run(action) {
		try {
			await action();
		} catch (e) {
			console.error(e);
			alert(`Операцията не мина.\n\n${e?.message ?? e}`);
		}
	}
</script>

<div class="eyebrow mb-3 px-1">Каса</div>
<div class="flex flex-col gap-3">
	{#each actions as { label, run: action }}
		<button
			class="touch min-h-[56px] justify-start px-4 text-base text-muted hover:text-[color:var(--text)]"
			on:click={() => run(action)}
		>
			{label}
		</button>
	{/each}
</div>
