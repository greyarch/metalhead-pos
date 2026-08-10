<script>
	import '../app.css';

	import { auth } from '$lib/stores/auth.svelte.js';
	import Login from '$lib/components/Login.svelte';

	let { children } = $props();
</script>

{#if auth.ok}
	{@render children()}
{:else}
	<Login />
{/if}
