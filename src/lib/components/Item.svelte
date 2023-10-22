<script>
	export let item;
	export let handleClick;
</script>

{#if item.variants?.length > 1}
	<h2 class="text-xl mb-2 font-semibold float-left w-7/12">{item.name}</h2>
	<div>
		{#each item.variants as variant}
			<button
				class="mr-2 p-1 rounded-md border border-gray-300 hover:bg-gray-100"
				on:click={handleClick(item, variant)}
			>
				{variant.name !== 'default' ? `${variant.name} - ` : ''}{variant.price}лв.
			</button>
		{/each}
	</div>
{:else}
	<button
		class="text-xl font-semibold mr-2 p-1 rounded-md border border-gray-300 hover:bg-gray-100"
		on:click={handleClick(item, item.variants[0])}
	>
		{item.name} - {item.variants[0].price}лв.
	</button>
{/if}
<hr class="mt-2" />
