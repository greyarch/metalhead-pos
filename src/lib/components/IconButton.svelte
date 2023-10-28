<script>
	export let borderColor = 'green-300';
</script>

<button class="mr-1 p-1 text-lg rounded-md border border-{borderColor} float-right" on:click>
	<slot />
</button>
