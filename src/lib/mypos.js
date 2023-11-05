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
