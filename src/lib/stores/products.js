import { readable } from 'svelte/store';

const products = readable({
	Бира: [
		{
			name: 'Wrong Side of Heaven',
			active: true,
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
			active: true,
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
			active: true,
			variants: [
				{
					variant: '',
					price: 6
				}
			]
		},
		{
			name: 'Mojito',
			active: true,
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
			active: true,
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
			active: true,
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
			active: true,
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
