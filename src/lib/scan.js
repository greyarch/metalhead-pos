export async function findActiveServices(
	baseIP = '192.168.8',
	startRange = 100,
	endRange = 110,
	port = 8080,
	endpoint = '/jsonrpc',
	timeout = 3000
) {
	const promises = [];

	for (let i = startRange; i <= endRange; i++) {
		const ip = `${baseIP}.${i}`;
		const url = `http://${ip}:${port}${endpoint}`;

		const requestPromise = checkService(url, timeout)
			.then(() => ({ ip, url, active: true }))
			.catch(() => ({ ip, url, active: false })); // Only timeouts

		promises.push(requestPromise);
	}

	const results = await Promise.all(promises);
	return results.filter((result) => result.active);
}

async function checkService(url, timeout) {
	const controller = new AbortController();

	// Only abort on timeout
	const timeoutId = setTimeout(() => {
		controller.abort();
	}, timeout);

	try {
		// Any response (including CORS errors, 404s, etc.) means service is active
		await fetch(url, {
			method: 'GET',
			mode: 'no-cors',
			signal: controller.signal
		});

		clearTimeout(timeoutId);
		return true;
	} catch (error) {
		clearTimeout(timeoutId);

		// Only consider AbortError (timeout) as failure
		if (error.name === 'AbortError') {
			throw error; // This is a timeout - service not active
		}

		// All other errors (CORS, network errors, etc.) mean service responded
		return true;
	}
}
