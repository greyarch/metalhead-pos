<script>
	import cart from '$lib/stores/cart.js';

	let input = 0;
	$: result = Number(input) - $cart.total;

	function handleClick(value) {
		if (value === 'C') {
			input = 0;
		} else {
			input ? (input += value) : (input = value);
		}
	}
</script>

<div class="p-4 rounded-lg shadow-md">
	<div class="w-full grid grid-cols-3 gap-2 text-center text-lg">
		<input
			type="text"
			id="display"
			class="mb-4 p-2 text-black border border-gray-700 rounded"
			placeholder="0"
			bind:value={input}
		/>
		<span class="p-3">- {$cart.total}</span>
		<span class="p-3">{input ? `= ${result}` : ''}</span>
	</div>
	<div class="grid grid-cols-3 gap-2">
		{#each ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '.', 'C'] as button}
			<button
				class="p-3 text-lg bg-gray-700 hover:bg-gray-500 rounded"
				on:click={() => handleClick(button)}>{button}</button
			>
		{/each}
	</div>
</div>
