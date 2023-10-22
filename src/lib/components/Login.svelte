<script>
	import { page } from '$app/stores';

	let loginError = false;
	let email = '';
	let password = '';

	const login = async () => {
		const { error } = await $page.data.supabase.auth.signInWithPassword({
			email,
			password
		});
		if (error) {
			console.error('LOGIN ERROR', error);
			loginError = true;
		}
	};
</script>

<form
	class="mx-auto my-36 flex h-[300px] w-[350px] flex-col border-2 bg-white text-black shadow-xl"
	on:submit|preventDefault={login}
>
	<div class="mx-8 mt-7 mb-1 flex flex-row justify-start space-x-2">
		<div class="w-3 text-center font-sans text-xl font-bold"><h1>Login</h1></div>
	</div>
	<div class="flex flex-col items-center">
		<input
			class="my-2 w-72 border p-2"
			type="email"
			placeholder="email"
			required
			bind:value={email}
		/>
		<input
			class="my-2 w-72 border p-2"
			type="password"
			placeholder="password"
			required
			bind:value={password}
		/>
	</div>
	<div class="my-2 flex justify-center">
		<button class="w-72 border rounded-md bg-primary-500 p-2 font-sans default-action" type="submit"
			>Login</button
		>
	</div>
	{#if loginError}
		<div class="p-2 text-red-500 bg-red-100">There was an error logging in. Please try again.</div>
	{/if}
</form>
