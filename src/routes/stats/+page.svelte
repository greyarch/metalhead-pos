<script>
    import { page } from '$app/stores';
    const db = $page.data.supabase;

    let today = {}

	async function getStats() {
		const { data, error } = await db.rpc('get_stats');
		if (error) {
			console.error(error);
		} else {
			today = data[0]
		}
	}

    getStats()

</script>

<div class="px-4 py-4">

	<table class="table-auto bg-gray-800 rounded-md shadow-md">
		<thead>
			<tr>
				<th class="px-4 py-2"></th>
				<th class="px-4 py-2">Общо</th>
				<th class="px-4 py-2">В брой</th>
				<th class="px-4 py-2">Карта</th>
				<th class="px-4 py-2">Каса</th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<th class="border px-4 py-2 text-left" scope="row">Днес</th>
				<td class="border px-4 py-2">{today.total_today}</td>
				<td class="border px-4 py-2">{today.cash_today}</td>
				<td class="border px-4 py-2">{today.card_today}</td>
				<td class="border px-4 py-2">{today.register_today}</td>
			</tr>
		</tbody>
	</table>
</div>
