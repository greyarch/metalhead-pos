import { env } from '$env/dynamic/private';

export async function POST({ request, fetch, locals }) {
	const session = await locals.safeGetSession();
	if (!session) return new Response(401);
	const body = await request.text();
	try {
		const res = await fetch(env.PRIVATE_POS_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-API-Key': env.PRIVATE_POS_API_KEY
			},
			body
		});
		const data = await res.text();
		return new Response(data);
	} catch (e) {
		console.error(e);
		return new Response(500, e);
	}
}
