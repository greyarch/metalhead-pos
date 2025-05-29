export async function findActiveServices(
	baseIP = '192.168.8',
	startRange = 100,
	endRange = 110,
	port = 8080,
	endpoint = '/jsonrpc',
	timeout = 3000,
) {
	const promises = [];

	for (let i = startRange; i <= endRange; i++) {
		const ip = `${baseIP}.${i}`;
		const url = `http://${ip}:${port}${endpoint}`;

		const requestPromise = checkService(url, timeout)
			.then((info) => ({ ip, url, active: true, ...info }))
			.catch(() => null);

		promises.push(requestPromise);
	}

	const results = await Promise.all(promises);
	return results.filter((result) => result !== null);
}

async function checkService(method, url, payload, timeout) {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeout);

	try {
		const response = await fetch(url, {
			method: 'GET', // GET requests don't trigger preflight
			mode: 'no-cors',
			signal: controller.signal
		});

		clearTimeout(timeoutId);
		return { method: 'GET' };
	} catch (error) {
		clearTimeout(timeoutId);
		throw error;
	}
}
