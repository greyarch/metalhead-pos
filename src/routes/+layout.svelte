<script>
	// The ordering of these imports is critical to your app working properly
	import '@skeletonlabs/skeleton/themes/theme-skeleton.css';
	// If you have source.organizeImports set to true in VSCode, then it will auto change this ordering
	import '@skeletonlabs/skeleton/styles/skeleton.css';
	// Most of your app wide CSS should be put in this file
	import '../app.postcss';

	import { AppShell } from '@skeletonlabs/skeleton';

	import { authed } from '$lib/pb.js';
	import Login from '../lib/components/Login.svelte';
</script>

<AppShell>
	<!-- Router Slot -->
	{#if $authed}
		<slot />
	{:else}
		<Login />
	{/if}
</AppShell>
