<script>
	import { pb } from '$lib/pb.js';

	let today = { total: 0, cash: 0, card: 0, register: 0 };

	async function getStats() {
		try {
			today = await pb.collection('today_totals').getFirstListItem('');
		} catch (error) {
			console.error(error);
		}
	}

	getStats();
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
				<td class="border px-4 py-2">{today.total.toFixed(2)}</td>
				<td class="border px-4 py-2">{today.cash.toFixed(2)}</td>
				<td class="border px-4 py-2">{today.card.toFixed(2)}</td>
				<td class="border px-4 py-2">{today.register.toFixed(2)}</td>
			</tr>
		</tbody>
	</table>
</div>
