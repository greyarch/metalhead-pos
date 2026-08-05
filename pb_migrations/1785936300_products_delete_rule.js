/// <reference path="../pb_data/types.d.ts" />

// Staff delete products from the till's edit mode, so the rule has to match the
// other three. Nothing is lost with the record: past sales keep their own copy
// of the name and price in order_items, and the audit hook logs the deletion.
migrate(
	(app) => {
		const products = app.findCollectionByNameOrId('products');
		products.deleteRule = '@request.auth.id != ""';
		app.save(products);
	},
	(app) => {
		const products = app.findCollectionByNameOrId('products');
		products.deleteRule = null;
		app.save(products);
	}
);
