<script>
	export let disabled = false;
</script>

<button
	class="touch h-11 min-h-0 w-11 shrink-0 text-muted hover:text-[color:var(--text)]
		disabled:pointer-events-none disabled:opacity-30 {$$props['class'] ?? ''}"
	{disabled}
	aria-label={$$props['aria-label']}
	on:click
>
	<slot />
</button>
