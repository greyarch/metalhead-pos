import { writable } from 'svelte/store';

const products = writable({
	Бира: [
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
			name: 'Metalworks: Pale Ale, Dragon & Lotus',
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
		}
	],
	Коктейли: [
		{
			name: 'Gin & Tonic',
			variants: [
				{
					variant: '',
					price: 6
				}
			]
		},
		{
			name: 'Mojito',
			variants: [
				{
					variant: '',
					price: 6
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
