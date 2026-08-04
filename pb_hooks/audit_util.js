// Helpers for audit.pb.js.
//
// These live in a required module because PocketBase runs each hook handler in
// its own goja context — a handler cannot see functions defined at the top of
// the hook file, only what it requires inside itself.

function snapshot(record) {
	try {
		if (!record) return null;
		// publicExport drops hidden and system fields (password hashes, tokens).
		const data = record.publicExport();
		delete data.collectionId;
		delete data.collectionName;
		return data;
	} catch (err) {
		return { __snapshotError: String(err) };
	}
}

function write(e, action, before, after) {
	try {
		const log = new Record($app.findCollectionByNameOrId('audit'));
		log.set('collection', e.record.collection().name);
		log.set('record', e.record.id);
		log.set('action', action);
		log.set('actor', e.auth ? e.auth.getString('email') : 'superuser');
		if (e.auth && e.auth.collection().name === 'users') {
			log.set('user', e.auth.id);
		}
		log.set('before', before);
		log.set('after', after);
		$app.save(log);
	} catch (err) {
		// An audit failure must never block a sale or an edit.
		$app.logger().error('audit write failed', 'action', action, 'error', String(err));
	}
}

module.exports = { snapshot, write };
