export async function findActiveServices(
	method = 'GET',
	baseIP = '192.168.8',
	startRange = 100,
	endRange = 110,
	port = 8080,
	endpoint = '/jsonrpc',
	timeout = 3000,
	payload = { id: 1, jsonrpc: '2.0', method: 'ReadFiscalNumbers' }
) {
	const promises = [];

	for (let i = startRange; i <= endRange; i++) {
		const ip = `${baseIP}.${i}`;
		const url = `http://${ip}:${port}${endpoint}`;

		const requestPromise = checkService(method, url, payload, timeout)
			.then((responseInfo) => ({ ip, url, active: true, ...responseInfo }))
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
			method,
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(payload),
			signal: controller.signal
		});

		clearTimeout(timeoutId);

		// Return info about the response - any response means service is active
		return {
			status: response.status,
			statusText: response.statusText,
			respondedAt: new Date().toISOString()
		};
	} catch (error) {
		clearTimeout(timeoutId);
		// Network errors, timeouts, etc. mean no service
		throw error;
	}
}
