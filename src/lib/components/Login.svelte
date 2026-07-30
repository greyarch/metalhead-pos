<script>
	import { pb } from '$lib/pb.js';

	let loginError = false;
	let busy = false;
	let email = '';
	let password = '';

	const login = async () => {
		busy = true;
		try {
			await pb.collection('users').authWithPassword(email, password);
			loginError = false;
		} catch (error) {
			console.error('LOGIN ERROR', error);
			loginError = true;
		}
		busy = false;
	};
</script>

<div class="flex h-screen items-center justify-center bg-ink p-6">
	<form class="w-[22rem]" on:submit|preventDefault={login}>
		<h1 class="display mb-1 text-4xl text-amber">Металхед</h1>
		<p class="eyebrow mb-6">Каса</p>

		<label class="mb-2 block">
			<span class="sr-only">Потребител</span>
			<input
				class="h-14 w-full rounded-[3px] border border-rule bg-raised px-4"
				type="email"
				placeholder="Потребител"
				autocomplete="username"
				required
				bind:value={email}
			/>
		</label>
		<label class="mb-4 block">
			<span class="sr-only">Парола</span>
			<input
				class="h-14 w-full rounded-[3px] border border-rule bg-raised px-4"
				type="password"
				placeholder="Парола"
				autocomplete="current-password"
				required
				bind:value={password}
			/>
		</label>

		<button class="touch touch-accent h-14 w-full text-lg" type="submit" disabled={busy}>
			{busy ? 'Момент…' : 'Влез'}
		</button>

		{#if loginError}
			<p
				class="mt-4 border-l-2 border-[color:var(--danger)] py-1 pl-3 text-sm text-[color:var(--danger)]"
			>
				Грешен потребител или парола.
			</p>
		{/if}
	</form>
</div>
