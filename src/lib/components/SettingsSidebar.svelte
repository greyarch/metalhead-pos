<script>
	import { cashIn, cashOut, printAgain, diagnostic } from '$lib/mypos.js';
</script>

<ul>
	<li class="mb-8">
		<span class="text-white hover:underline cursor-pointer p-4 rounded-md" on:click={cashIn}
			>+ 100лв.</span
		>
	</li>
	<li class="mb-8">
		<span class="text-white hover:underline cursor-pointer p-4 rounded-md" on:click={cashOut}
			>- 100лв.</span
		>
	</li>
	<li class="mb-8">
		<span class="text-white hover:underline cursor-pointer p-4 rounded-md" on:click={printAgain}
			>Ре-печат</span
		>
	</li>
	<li class="mb-8">
		<span class="text-white hover:underline cursor-pointer p-4 rounded-md" on:click={diagnostic}
			>Диагностика</span
		>
	</li>
</ul>
