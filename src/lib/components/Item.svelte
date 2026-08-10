<script>
	/** `alt`: every other row sits on a lighter band, so the eye keeps its place. */
	let { item, handleClick, alt = false } = $props();

	const money = (n) => `€${Number(n).toFixed(2)}`;
</script>

{#if item.variants?.length}
	<article
		class="flex items-center justify-between gap-4 border-b border-rule py-2.5 pl-3 pr-2
			{alt ? 'bg-band' : ''}"
	>
		<h3 class="display flex-1 text-xl leading-tight">{item.name}</h3>

		<div class="flex flex-wrap justify-end gap-2">
			{#each item.variants as variant (variant.name)}
				<button
					class="touch w-[7.5rem] flex-col gap-0.5 leading-none"
					onclick={handleClick(item, variant)}
				>
					{#if variant.name !== 'default'}
						<span class="text-[0.7rem] uppercase tracking-widest text-amber-muted"
							>{variant.name}</span
						>
					{/if}
					<span class="display text-lg">{money(variant.price)}</span>
				</button>
			{/each}
		</div>
	</article>
{/if}
