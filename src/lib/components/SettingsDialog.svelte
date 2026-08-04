<script>
	import { createEventDispatcher } from 'svelte';
	import { findDevice, getDeviceUrl, diagnostic, printAgain } from '$lib/mypos.js';
	import { showCalcByDefault, showRegisterButton } from '$lib/stores/settings.js';
	import X from '$lib/icons/X.svelte';

	const dispatch = createEventDispatcher();

	let deviceUrl = getDeviceUrl();

	// One action at a time — the device answers one request at a time anyway.
	let running = '';
	/** @type {{ tone: 'ok' | 'bad', text: string } | null} */
	let result = null;

	async function run(job, task) {
		running = job;
		result = null;
		try {
			result = { tone: 'ok', text: await task() };
		} catch (e) {
			console.error(e);
			result = { tone: 'bad', text: String(e?.message ?? e) };
		}
		running = '';
	}

	const scan = () =>
		run('scan', async () => {
			const found = await findDevice();
			deviceUrl = getDeviceUrl();
			if (!found) throw new Error('Не намирам myPOS устройства по мрежата.');
			return `Намерено устройство: ${found}`;
		});

	const check = () =>
		run('diagnostic', async () => {
			await diagnostic();
			return 'Устройството отговори. Диагностиката е отпечатана.';
		});

	const reprint = () =>
		run('reprint', async () => {
			await printAgain();
			return 'Последната бележка беше отпечатана отново.';
		});
</script>

<svelte:window on:keydown={(e) => e.key === 'Escape' && dispatch('close')} />

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
	on:click|self={() => dispatch('close')}
>
	<div class="max-h-full w-[34rem] overflow-y-auto border border-rule bg-panel">
		<header class="flex items-center gap-2 border-b border-rule px-5 py-4">
			<h2 class="display flex-1 text-2xl text-amber">Настройки</h2>
			<button
				class="touch h-11 min-h-0 w-11 text-muted"
				aria-label="Затвори"
				on:click={() => dispatch('close')}
			>
				<X />
			</button>
		</header>

		<div class="px-5 py-4">
			<div class="eyebrow mb-2">Фискално устройство</div>
			<p class="mb-3 truncate text-sm {deviceUrl ? 'text-muted' : 'text-[color:var(--danger)]'}">
				{deviceUrl ?? 'Няма намерено устройство'}
			</p>

			<button class="touch touch-accent h-14 w-full text-lg" disabled={!!running} on:click={scan}>
				{#if running === 'scan'}
					<span class="spinner mr-3" aria-hidden="true" /> Търся по мрежата…
				{:else}
					Търси устройства
				{/if}
			</button>

			<div class="mt-2 grid grid-cols-2 gap-2">
				<button class="touch h-14" disabled={!!running} on:click={check}>
					{running === 'diagnostic' ? 'Изпращам…' : 'Диагностика'}
				</button>
				<button class="touch h-14" disabled={!!running} on:click={reprint}>
					{running === 'reprint' ? 'Печатам…' : 'Ре-печат'}
				</button>
			</div>

			{#if result}
				<p
					class="mt-3 border-l-2 py-1 pl-3 text-sm
						{result.tone === 'ok'
						? 'border-[color:var(--amber)] text-[color:var(--text)]'
						: 'border-[color:var(--danger)] text-[color:var(--danger)]'}"
				>
					{result.text}
				</p>
			{/if}

			<hr class="my-5 border-rule" />

			<div class="eyebrow mb-2">Сметка</div>
			<label class="touch mb-1 min-h-[56px] cursor-pointer justify-start gap-3 px-4">
				<input
					type="checkbox"
					class="h-5 w-5 accent-[color:var(--amber)]"
					bind:checked={$showCalcByDefault}
				/>
				<span>Показвай калкулатора за ресто</span>
			</label>
			<label class="touch min-h-[56px] cursor-pointer justify-start gap-3 px-4">
				<input
					type="checkbox"
					class="h-5 w-5 accent-[color:var(--amber)]"
					bind:checked={$showRegisterButton}
				/>
				<span>Показвай бутона „Каса“</span>
			</label>
			<p class="mt-2 text-xs text-muted">
				Продажба през „Каса“ се записва, но не се печата бележка на фискалното устройство.
			</p>
		</div>

		<footer class="border-t border-rule px-5 py-4">
			<button class="touch h-14 w-full" on:click={() => dispatch('close')}>Затвори</button>
		</footer>
	</div>
</div>

<style>
	.spinner {
		display: inline-block;
		width: 1rem;
		height: 1rem;
		border: 2px solid var(--rule);
		border-top-color: var(--amber);
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.spinner {
			animation-duration: 2s;
		}
	}
</style>
