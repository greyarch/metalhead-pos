<script>
    export let categories = [];
</script>

<div class="w-32 mr-8 border-r pr-3">
    <ul>
        {#each categories as category}
        <li class="mb-8">
            <span class="text-white hover:underline cursor-pointer">{category}</span>
        </li>
        {/each}
    </ul>
</div>