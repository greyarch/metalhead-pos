import { findActiveServices } from '$lib/scan.js';
import { env } from '$env/dynamic/public';

const URL_KEY = 'myposUrl';

// The device is genuinely slow — a Diagnostic measured 14s — and a wedged one can
// go quiet altogether, which would leave the till spinning. Override per site with
// PUBLIC_POS_TIMEOUT_MS when a device is slower than this.
const TIMEOUT_MS = Number(env.PUBLIC_POS_TIMEOUT_MS) || 45000;

/** Address of the fiscal device this till last found on the LAN. */
export function getDeviceUrl() {
	return localStorage.getItem(URL_KEY);
}

/** Point this till at a device by hand, when the scan cannot find it. */
export function setDeviceUrl(url) {
	localStorage.setItem(URL_KEY, url);
}

/**
 * Can the device sell right now? Returns null when it can, or the reason it
 * cannot, ready to put on screen.
 *
 * ReadFiscalNumbers is the cheapest question in the protocol that still goes
 * through the fiscal service (p.7): no parameters, nothing printed, and it is
 * refused with a proper error code when the device is in no state to trade —
 * "Изтощена батерия" (33002), "Край на хартия" (35201), "Устройството е в
 * състояние на блокада" (37010). A bare GET, by contrast, is answered by the
 * HTTP layer whatever shape the fiscal side is in.
 */
export async function checkDevice() {
	const url = getDeviceUrl();
	if (!url) return 'Няма настроено фискално устройство';
	try {
		await readFiscalNumbers();
		return null;
	} catch (e) {
		// mypos() throws the device's own error object for a refusal, and an Error
		// for anything that stopped the request getting there.
		if (typeof e?.code !== 'number') return 'Няма връзка с фискалното устройство';
		// message is optional in the protocol, so fall back to the bare code
		// rather than an empty warning strip.
		return e.message || `Грешка от устройството (${e.code})`;
	}
}

/** Scan the LAN and remember the first device found. Returns its URL, or null. */
export async function findDevice() {
	const services = await findActiveServices();
	if (!services.length) return null;
	localStorage.setItem(URL_KEY, services[0].url);
	return services[0].url;
}

// The device sends no CORS headers, so a stock browser refuses to hand us the
// reply even though the request lands and the device answers it. Each till needs
// an extension that relaxes CORS; without one, every call here fails.
//
// No Content-Type on purpose: the browser then sends text/plain, which the
// device accepts. application/json would add a preflight, and the device answers
// OPTIONS with a 404.
export async function mypos(payload) {
	const myposUrl = getDeviceUrl();
	if (!myposUrl) throw new Error('Няма намерено myPOS устройство.');

	let posRes;
	try {
		posRes = await fetch(myposUrl, {
			method: 'POST',
			body: JSON.stringify(payload),
			signal: AbortSignal.timeout(TIMEOUT_MS)
		});
	} catch (e) {
		// A browser network failure reads as "Failed to fetch", which tells the bar
		// staff nothing. The address is the useful part — it is usually stale. The
		// original goes on `cause` so the console still has the real reason.
		console.error(e);
		throw new Error(`Устройството на ${myposUrl} не отговаря. Провери адреса в настройките.`, {
			cause: e
		});
	}

	const posResult = await posRes.json();
	if ('error' in posResult) throw posResult.error;
	return posResult;
}

// The id is JSON-RPC bookkeeping, not the order number: the device parses it as
// a 32-bit int and answers "Invalid Request" for anything larger, so there is
// nothing to gain by passing one of ours through. Every other call sends 1 too.
export function toReceipt(cart, paymentType) {
	const items = cart.items.map((item) => ({
		department: 0,
		name: item.variant.name === 'default' ? item.name : `${item.name} (${item.variant.name})`,
		price: item.variant.price,
		quantity: item.quantity,
		type: 'ITEM',
		vat: 'B'
	}));

	return {
		id: 1,
		jsonrpc: '2.0',
		method: 'PrintReceipt',
		params: {
			beginFiscalReceiptInput: {
				cashDesk: 1,
				operatorName: 'Оператор 1',
				operatorNumber: 1
			},
			invoiceData: null,
			items,
			payments: [
				{
					amount: cart.total,
					type: paymentType === 'cash' ? 'PAYMENT_CASH' : 'PAYMENT_CARD'
				}
			],
			stornoData: null
		}
	};
}

function cashOp(operation, amount) {
	const opText = operation === 'CashIn' ? 'Внасяне' : 'Изтегляне';
	return {
		jsonrpc: '2.0',
		id: 1,
		method: operation,
		params: {
			operatorName: 'Оператор 1',
			operatorNumber: 1,
			cashDesk: 1,
			amount,
			text: [
				{
					text: `${opText}: €${amount}`
				}
			]
		}
	};
}

export async function cashIn() {
	return await mypos(cashOp('CashIn', 100));
}

export async function cashOut() {
	return await mypos(cashOp('CashOut', 100));
}

export async function diagnostic() {
	return await mypos({
		id: 1,
		jsonrpc: '2.0',
		method: 'Diagnostic'
	});
}

/** Serial numbers of the device and its fiscal memory. Used as the health check. */
export async function readFiscalNumbers() {
	return await mypos({
		id: 1,
		jsonrpc: '2.0',
		method: 'ReadFiscalNumbers'
	});
}

export async function printAgain() {
	return await mypos({
		id: 1,
		jsonrpc: '2.0',
		method: 'PrintAgain'
	});
}
