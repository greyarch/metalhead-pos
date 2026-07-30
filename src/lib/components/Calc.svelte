<script>
	import cart from '$lib/stores/cart.js';

	let input = '';
	$: result = Number(input) - $cart.total;
	$: short = Number(input) > 0 && result < 0;

	function handleClick(value) {
		if (value === 'C') {
			input = 0;
		} else {
			input ? (input += value) : (input = value);
		}
	}
</script>

<div class="mt-3 rounded-[3px] border border-rule bg-ink p-3">
	<div class="mb-3 flex items-center gap-3">
		<input
			type="text"
			inputmode="decimal"
			class="h-12 w-28 rounded-[3px] border border-rule bg-raised px-3 text-right text-lg font-semibold"
			placeholder="Дадени"
			aria-label="Дадени пари"
			bind:value={input}
		/>
		<div class="min-w-0 flex-1 text-right">
			<div class="eyebrow">Ресто</div>
			<div
				class="display text-3xl leading-none {short
					? 'text-[color:var(--danger)]'
					: 'text-[color:var(--text)]'}"
			>
				{input ? `€${result.toFixed(2)}` : '—'}
			</div>
		</div>
	</div>

	<div class="grid grid-cols-3 gap-1.5">
		{#each ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '.', 'C'] as button}
			<button
				class="touch min-h-[48px] text-lg {button === 'C' ? 'touch-danger text-muted' : ''}"
				on:click={() => handleClick(button)}>{button}</button
			>
		{/each}
	</div>
</div>
