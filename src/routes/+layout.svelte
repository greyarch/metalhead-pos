<script>
	import '../app.postcss';

	import { authed } from '$lib/pb.js';
	import Login from '../lib/components/Login.svelte';
</script>

{#if $authed}
	<slot />
{:else}
	<Login />
{/if}
