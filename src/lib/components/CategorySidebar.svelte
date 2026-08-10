<script>
	import Grip from '$lib/icons/Grip.svelte';

	/** `editMode`: the rail can be reordered by dragging. */
	let { categories = [], selectedCategory = '', editMode = false, onselect, onmove } = $props();

	const GAP = 4; // matches gap-1 below
	const THRESHOLD = 8; // px before a press counts as a drag rather than a tap

	let rows = $state([]);
	let dragIndex = $state(-1);
	let dragging = $state(false);
	let startY = 0;
	let rowHeight = 0;
	// A drag ends in a click event too; this stops that click selecting a category.
	let justDragged = false;

	// Pointer events, not the HTML5 drag API: that one never fires on a touchscreen.
	function down(e, i) {
		if (!editMode) return;
		dragIndex = i;
		startY = e.clientY;
		dragging = false;
		rowHeight = (rows[i]?.offsetHeight ?? 56) + GAP;
		e.currentTarget.setPointerCapture(e.pointerId);
	}

	function move(e) {
		if (dragIndex < 0) return;

		const dy = e.clientY - startY;
		if (!dragging && Math.abs(dy) < THRESHOLD) return;
		dragging = true;

		const steps = Math.round(dy / rowHeight);
		if (steps === 0) return;

		const to = Math.max(0, Math.min(categories.length - 1, dragIndex + steps));
		if (to === dragIndex) return;

		onmove?.({ from: dragIndex, to });
		// Rebase so the next step is measured from the row's new home.
		startY += (to - dragIndex) * rowHeight;
		dragIndex = to;
	}

	function up() {
		justDragged = dragging;
		dragIndex = -1;
		dragging = false;
	}

	function select(category) {
		if (justDragged) {
			justDragged = false;
			return;
		}
		onselect?.(category);
	}

	// Dragging is mouse and touch only, so keep a keyboard route to the same thing.
	function key(e, i) {
		if (!editMode || !e.altKey) return;
		const to = e.key === 'ArrowUp' ? i - 1 : e.key === 'ArrowDown' ? i + 1 : -1;
		if (to < 0 || to >= categories.length) return;
		e.preventDefault();
		onmove?.({ from: i, to });
	}
</script>

<nav class="flex flex-col gap-1">
	{#each categories as category, i (category)}
		<button
			bind:this={rows[i]}
			class="touch display relative justify-start px-4 text-lg
				{selectedCategory === category ? 'is-active' : ''}
				{editMode ? 'draggable' : ''}
				{dragging && dragIndex === i ? 'is-dragging' : ''}"
			aria-current={selectedCategory === category}
			title={editMode ? 'Влачи, за да преместиш категорията' : category}
			onpointerdown={(e) => down(e, i)}
			onpointermove={move}
			onpointerup={up}
			onpointercancel={up}
			onkeydown={(e) => key(e, i)}
			onclick={() => select(category)}
		>
			<span class="flex-1 text-left">{category}</span>
			{#if editMode}
				<span class="ml-2 text-muted" aria-hidden="true"><Grip /></span>
			{/if}
		</button>
	{/each}
</nav>

<style>
	/* The active category carries the accent as a bar, not a fill, so it does not
	   compete with the amber payment buttons on the other side of the screen. */
	.is-active {
		background: var(--raised-hi);
		color: var(--amber);
	}
	.is-active::before {
		content: '';
		position: absolute;
		inset: -1px auto -1px -1px;
		width: 4px;
		background: var(--amber);
	}

	/* Without this the browser pans the page instead of letting us drag. */
	.draggable {
		touch-action: none;
		cursor: grab;
	}

	.is-dragging {
		cursor: grabbing;
		border-color: var(--amber);
		box-shadow: 0 8px 20px rgb(0 0 0 / 0.45);
		transform: scale(1.03);
		z-index: 10;
	}
</style>
