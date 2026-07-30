<script>
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let categories = [];
	export let selectedCategory = '';
</script>

<nav class="flex flex-col gap-1">
	{#each categories as category}
		<button
			class="touch display relative justify-start px-4 text-lg
				{selectedCategory === category ? 'is-active' : ''}"
			aria-current={selectedCategory === category}
			on:click={() => dispatch('select', { category })}
		>
			{category}
		</button>
	{/each}
</nav>

<style>
	/* The active category carries the accent as a bar, not a fill, so it does not
	   compete with the amber payment buttons on the other side of the screen. */
	.is-active {
		background: var(--raised-hi);
		color: var(--amber);
	}
	.is-active::before {
		content: '';
		position: absolute;
		inset: -1px auto -1px -1px;
		width: 4px;
		background: var(--amber);
	}
</style>
