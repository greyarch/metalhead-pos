<script>
	export let item;
	export let handleClick;

	function btn(variant) {
		if (variant.name === 'default') {
			return `${variant.price}лв.`;
		}
		return `${variant.name} - ${variant.price}лв.`;
	}
</script>

{#if item.variants?.length}
	<h2 class="text-xl mb-2 font-semibold float-left w-7/12">{item.name}</h2>
	<div>
		{#each item.variants as variant}
			<button
				class="mr-2 p-1 rounded-md border border-gray-300 hover:bg-gray-100 w-1/6"
				on:click={handleClick(item, variant)}
			>
				{btn(variant)}
			</button>
		{/each}
	</div>
{/if}
<hr class="mt-2" />
