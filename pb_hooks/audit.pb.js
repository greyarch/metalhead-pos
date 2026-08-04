/// <reference path="../pb_data/types.d.ts" />

// Audit trail for edits made through the app.
//
// This lives in a hook rather than in the frontend on purpose: a client-side
// write can be skipped, forged, or fail silently, which is exactly when an
// audit trail matters. These fire on API requests, so they record what came in
// over the wire and who was signed in at the time.
//
// Catalogue collections (products, categories) are audited for every action.
// Orders are audited on deletion only — a sale is already fully recorded in
// `orders`/`order_items`, but a rolled-back one would otherwise leave no trace.
//
// Every handler must reach e.next(): auditing must never be able to block the
// operation it is recording. Helpers are required inside each handler because
// PocketBase gives each one its own goja context.

onRecordCreateRequest(
	(e) => {
		e.next();
		const audit = require(`${__hooks}/audit_util.js`);
		audit.write(e, 'create', null, audit.snapshot(e.record));
	},
	'products',
	'categories'
);

onRecordUpdateRequest(
	(e) => {
		let before = null;
		try {
			before = require(`${__hooks}/audit_util.js`).snapshot(e.record.original());
		} catch (err) {
			$app.logger().error('audit before-snapshot failed', 'error', String(err));
		}

		e.next();

		const audit = require(`${__hooks}/audit_util.js`);
		audit.write(e, 'update', before, audit.snapshot(e.record));
	},
	'products',
	'categories'
);

onRecordDeleteRequest(
	(e) => {
		let before = null;
		try {
			before = require(`${__hooks}/audit_util.js`).snapshot(e.record);
		} catch (err) {
			$app.logger().error('audit before-snapshot failed', 'error', String(err));
		}

		e.next();

		require(`${__hooks}/audit_util.js`).write(e, 'delete', before, null);
	},
	'products',
	'categories',
	'orders'
);
