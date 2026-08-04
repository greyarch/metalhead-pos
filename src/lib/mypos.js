import { findActiveServices } from '$lib/scan.js';

const URL_KEY = 'myposUrl';

/** Address of the fiscal device this till last found on the LAN. */
export function getDeviceUrl() {
	return localStorage.getItem(URL_KEY);
}

/** Point this till at a device by hand, when the scan cannot find it. */
export function setDeviceUrl(url) {
	localStorage.setItem(URL_KEY, url);
}

/** Scan the LAN and remember the first device found. Returns its URL, or null. */
export async function findDevice() {
	const services = await findActiveServices();
	if (!services.length) return null;
	localStorage.setItem(URL_KEY, services[0].url);
	return services[0].url;
}

export async function mypos(payload) {
	const myposUrl = getDeviceUrl();
	if (!myposUrl) throw new Error('Няма намерено myPOS устройство.');

	let posRes;
	try {
		posRes = await fetch(myposUrl, {
			method: 'POST',
			body: JSON.stringify(payload)
		});
	} catch (e) {
		// A browser network failure reads as "Failed to fetch", which tells the bar
		// staff nothing. The address is the useful part — it is usually stale.
		console.error(e);
		throw new Error(`Устройството на ${myposUrl} не отговаря. Провери адреса в настройките.`);
	}

	const posResult = await posRes.json();
	if ('error' in posResult) throw posResult.error;
	return posResult;
}

export function toReceipt(orderId, cart, paymentType) {
	const items = cart.items.map((item) => ({
		department: 0,
		name: item.variant.name === 'default' ? item.name : `${item.name} (${item.variant.name})`,
		price: item.variant.price,
		quantity: item.quantity,
		type: 'ITEM',
		vat: 'B'
	}));

	return {
		id: orderId,
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

export async function cashIn(amount) {
	return await mypos(cashOp('CashIn', 100));
}

export async function cashOut(amount) {
	return await mypos(cashOp('CashOut', 100));
}

export async function diagnostic() {
	return await mypos({
		id: 1,
		jsonrpc: '2.0',
		method: 'Diagnostic'
	});
}

export async function printAgain() {
	return await mypos({
		id: 1,
		jsonrpc: '2.0',
		method: 'PrintAgain'
	});
}

export async function readFiscalNumbers() {
	return await mypos({
		id: 1,
		jsonrpc: '2.0',
		method: 'ReadFiscalNumbers'
	});
}
