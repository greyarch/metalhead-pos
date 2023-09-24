<script>
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let categories = [];
	export let selectedCategory = '';

	function selectCategory(e) {
		dispatch('select', { category: e.target.innerText });
	}
</script>

<ul>
	{#each categories as category}
		<li class="mb-8">
			<span
				class="text-white hover:underline cursor-pointer p-4 rounded-md
                    {selectedCategory === category ? 'bg-gray-700' : ''}"
				on:click={selectCategory}>{category}</span
			>
		</li>
	{/each}
</ul>
