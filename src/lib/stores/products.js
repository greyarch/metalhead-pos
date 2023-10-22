import { readable } from 'svelte/store';

const products = readable({
	Наливно: [
		{
			name: 'Metalingus',
			active: true,
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
		},
		{
			name: 'Wrong Side of Heaven',
			active: true,
			variants: [
				{
					variant: '0.33L',
					price: 6.5
				},
				{
					variant: '0.50L',
					price: 7.5
				},
				{
					variant: '1.0L',
					price: 14
				}
			]
		},
		{
			name: 'Hot Smoke and Heavy Blues',
			active: true,
			variants: [
				{
					variant: '0.33L',
					price: 6.5
				},
				{
					variant: '0.50L',
					price: 7.5
				},
				{
					variant: '1.0L',
					price: 14
				}
			]
		},
		{
			name: 'Sweet Stout of Mine',
			active: true,
			variants: [
				{
					variant: '0.33L',
					price: 6.5
				},
				{
					variant: '0.50L',
					price: 7.5
				},
				{
					variant: '1.0L',
					price: 14
				}
			]
		},
		{
			name: 'River Runs Red',
			active: true,
			variants: [
				{
					variant: '0.33L',
					price: 6.5
				},
				{
					variant: '0.50L',
					price: 7.5
				},
				{
					variant: '1.0L',
					price: 14
				}
			]
		},
		{
			name: 'Metalworks: Farmhouse Ale',
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
			name: 'Metalworks: DDH Galacy, El Dorado & Phantasm',
			active: true,
			variants: [
				{
					variant: '0.33L',
					price: 7
				},
				{
					variant: '0.50L',
					price: 8
				},
				{
					variant: '1.0L',
					price: 15
				}
			]
		},
		{
			name: 'Metalworks: Kolschish',
			active: true,
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
		},
		{
			name: 'Metalworks: Helles',
			active: true,
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
		},
		{
			name: 'Metalworks: Sour Classic Cola',
			active: true,
			variants: [
				{
					variant: '0.33L',
					price: 6.5
				},
				{
					variant: '0.50L',
					price: 7.5
				},
				{
					variant: '1.0L',
					price: 14
				}
			]
		},
		{
			name: 'Тестер',
			active: true,
			price: 14
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
