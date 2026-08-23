/// <reference path="../pb_data/types.d.ts" />

// Hardening pass, all of it settings that only ever lived in the admin UI and so
// would come up wrong on a fresh deploy.
//
// 1. users.createRule was "" — an empty string is "anyone", not "nobody", so the
//    signup endpoint was open. A stranger who found the URL could register and
//    then read the whole menu, every order and the audit log, and ring up sales.
//    Till operators are created by a superuser in the admin UI, so nothing in the
//    app posts to that endpoint.
// 2. The rate limiter was off. Password auth on a public host needs it; the
//    default rules (2 auth attempts / 3s, 3 batches / 1s, 300 requests / 10s) are
//    already sensible for one till and are left as they are.
// 3. No backup schedule. pb_data is the only thing worth keeping and nothing was
//    copying it.
// 4. The batch endpoint was off, which the order submit now needs: an order and
//    its lines go over in one transaction instead of 1 + N separate creates.
migrate(
	(app) => {
		const users = app.findCollectionByNameOrId('users');
		users.createRule = null;
		app.save(users);

		const s = app.settings();
		s.rateLimits.enabled = true;
		s.backups.cron = '0 3 * * *'; // daily, keeping the 3 most recent
		s.batch.enabled = true;
		s.meta.appName = 'Metalhead POS';
		app.save(s);
	},
	(app) => {
		const users = app.findCollectionByNameOrId('users');
		users.createRule = '';
		app.save(users);

		const s = app.settings();
		s.rateLimits.enabled = false;
		s.backups.cron = '';
		s.batch.enabled = false;
		s.meta.appName = 'Acme';
		app.save(s);
	}
);
