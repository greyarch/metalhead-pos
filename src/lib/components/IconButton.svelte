<script>
	// The label doubles as the tooltip, so one string serves hover help and screen
	// readers and the two cannot drift apart.
	let { disabled = false, class: klass = '', onclick, children, ...rest } = $props();
</script>

<button
	class="touch h-11 min-h-0 w-11 shrink-0 text-muted hover:text-[color:var(--text)]
		disabled:pointer-events-none disabled:opacity-30 {klass}"
	{disabled}
	title={rest['aria-label']}
	{onclick}
	{...rest}
>
	{@render children()}
</button>
