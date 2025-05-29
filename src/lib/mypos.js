export async function mypos(payload) {
	const myposUrl = localStorage.getItem('myposUrl')
	const posRes = await fetch(myposUrl, {
		method: 'POST',
		body: JSON.stringify(payload)
	});
	const posResult = await posRes.json();
	if ('error' in posResult) throw posResult.error
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
					text: `${opText}: ${amount} лв.`
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
