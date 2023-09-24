import { writable } from 'svelte/store';

const products = writable({
	Наливно: [
		{
			name: 'Wrong Side of Heaven',
			variants: [
				{
					variant: '0.33L',
					price: 6
				},
				{
					variant: '0.50L',
					price: 7
				},
				{
					variant: '1.0L',
					price: 13
				}
			]
		},
		{
			name: 'Metalworks: Decoction Helles',
			variants: [
				{
					variant: '0.33L',
					price: 5
				},
				{
					variant: '0.50L',
					price: 6
				},
				{
					variant: '1.0L',
					price: 11
				}
			]
		}
	],
	Храни: [
		{
			name: 'Начос',
			variants: [
				{
					variant: '',
					price: 6.5
				}
			]
		}
	],
	Мърч: [
		{
			name: 'Брандирана чаша',
			variants: [
				{
					variant: '0.33L',
					price: 7
				},
				{
					variant: '0.50L',
					price: 8
				}
			]
		},
		{
			name: 'T-shirt',
			variants: [
				{
					variant: '',
					price: 30
				}
			]
		}
	],
	Други: []
});

export default products;
