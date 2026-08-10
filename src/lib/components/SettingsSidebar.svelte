<script>
	import { cashIn, cashOut } from '$lib/mypos.js';
	import { notify } from '$lib/stores/notice.svelte.js';

	// Rare and consequential (each prints on the fiscal device), so they sit at the
	// bottom of the rail, smaller and quieter than anything used during a sale.
	// Diagnostics and reprint live in the settings dialog behind the cog.
	const actions = [
		{ label: '+ €100', run: cashIn },
		{ label: '- €100', run: cashOut }
	];

	async function run(label, action) {
		try {
			await action();
			// Nothing else on screen changes when this works, so say so — otherwise
			// the only way to tell it printed is to look at the till roll.
			notify(`${label} — готово.`, 'ok');
		} catch (e) {
			console.error(e);
			notify(`${label} не мина. ${e?.message ?? e}`);
		}
	}
</script>

<div class="eyebrow mb-3 px-1">Каса</div>
<div class="flex flex-col gap-3">
	{#each actions as { label, run: action } (label)}
		<button
			class="touch min-h-[56px] justify-start px-4 text-base text-muted hover:text-[color:var(--text)]"
			onclick={() => run(label, action)}
		>
			{label}
		</button>
	{/each}
</div>
