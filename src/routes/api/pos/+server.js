import { PRIVATE_POS_URL, PRIVATE_POS_API_KEY } from '$env/static/private';

export async function POST({ request, fetch }) {
	const body = await request.text();
	try {
		const res = await fetch(PRIVATE_POS_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-API-Key': PRIVATE_POS_API_KEY
			},
			body
		});
		const data = await res.text();
		return new Response(data)
	} catch (e) {
		return {
			status: 500,
			body: e
		};
	}
}
