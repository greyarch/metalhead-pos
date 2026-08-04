#!/usr/bin/env node
// Copy the menu from one PocketBase to another — normally this laptop to the
// VPS. Categories and products only: orders, the audit log and users belong to
// the instance they happened on.
//
//   SRC_EMAIL=... SRC_PASSWORD=... \
//   DST_URL=https://pos.example.com DST_EMAIL=... DST_PASSWORD=... \
//   node scripts/seed-remote.mjs --dry-run
//
// Drop --dry-run to write. Safe to re-run: anything already there by name is
// left alone unless you pass --overwrite, which also refreshes the variants and
// the category order of what is already there.
//
// Category ids differ between instances and every variant points at one, so the
// ids are remapped by category name on the way over.

const {
	SRC_URL = 'http://127.0.0.1:8090',
	SRC_EMAIL,
	SRC_PASSWORD,
	DST_URL,
	DST_EMAIL,
	DST_PASSWORD
} = process.env;

const DRY = process.argv.includes('--dry-run');
const OVERWRITE = process.argv.includes('--overwrite');

for (const [k, v] of Object.entries({
	SRC_EMAIL,
	SRC_PASSWORD,
	DST_URL,
	DST_EMAIL,
	DST_PASSWORD
})) {
	if (!v) {
		console.error(`Missing ${k}. See the header of this file.`);
		process.exit(1);
	}
}
if (SRC_URL === DST_URL) {
	console.error('SRC_URL and DST_URL are the same instance. Refusing.');
	process.exit(1);
}

async function json(res, what) {
	const body = await res.text();
	if (!res.ok) throw new Error(`${what} failed (${res.status}): ${body.slice(0, 300)}`);
	return body ? JSON.parse(body) : null;
}

async function connect(url, identity, password, label) {
	const auth = await json(
		await fetch(`${url}/api/collections/_superusers/auth-with-password`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ identity, password })
		}),
		`${label} login`
	);
	const headers = { Authorization: auth.token, 'Content-Type': 'application/json' };
	return {
		url,
		label,
		list: async (c, query = '') =>
			(
				await json(
					await fetch(`${url}/api/collections/${c}/records?perPage=500${query}`, { headers }),
					`${label} read ${c}`
				)
			).items,
		create: async (c, body) =>
			json(
				await fetch(`${url}/api/collections/${c}/records`, {
					method: 'POST',
					headers,
					body: JSON.stringify(body)
				}),
				`${label} create ${c}`
			),
		update: async (c, id, body) =>
			json(
				await fetch(`${url}/api/collections/${c}/records/${id}`, {
					method: 'PATCH',
					headers,
					body: JSON.stringify(body)
				}),
				`${label} update ${c}`
			)
	};
}

const key = (s) => s.replace(/\s+/g, ' ').trim().toLowerCase();

const src = await connect(SRC_URL, SRC_EMAIL, SRC_PASSWORD, 'source');
const dst = await connect(DST_URL, DST_EMAIL, DST_PASSWORD, 'target');

const srcCats = await src.list('categories', '&sort=sort');
const srcProducts = await src.list('products');
if (!srcCats.length || !srcProducts.length) {
	console.error(`Source has ${srcCats.length} categories and ${srcProducts.length} products.`);
	console.error('Nothing worth copying — check SRC_URL.');
	process.exit(1);
}

// Products are matched by name, so two source products sharing one would land on
// a single target row and overwrite each other on every sync.
const seen = new Map();
const ambiguous = new Set();
for (const p of srcProducts) {
	if (seen.has(key(p.name))) ambiguous.add(p.name.trim());
	seen.set(key(p.name), p.id);
}
if (ambiguous.size) {
	console.error('Two source products share a name, so they cannot be told apart on the target:');
	for (const n of ambiguous) console.error(`   ${n}`);
	console.error('Rename or merge them first.');
	process.exit(1);
}

const dstCats = await dst.list('categories');
const dstProducts = await dst.list('products');

const srcCatName = Object.fromEntries(srcCats.map((c) => [c.id, c.name]));
const dstByName = new Map(dstCats.map((c) => [key(c.name), c]));
const dstProductNames = new Set(dstProducts.map((p) => key(p.name)));

const newCats = srcCats.filter((c) => !dstByName.has(key(c.name)));
const newProducts = srcProducts.filter((p) => !dstProductNames.has(key(p.name)));
const existingProducts = srcProducts.filter((p) => dstProductNames.has(key(p.name)));

console.log(`source ${SRC_URL}: ${srcCats.length} categories, ${srcProducts.length} products`);
console.log(`target ${DST_URL}: ${dstCats.length} categories, ${dstProducts.length} products`);
console.log(
	`\nwould create ${newCats.length} categories and ${newProducts.length} products` +
		(existingProducts.length
			? `, ${OVERWRITE ? 'refreshing' : 'leaving alone'} ${existingProducts.length} already there`
			: '')
);
for (const c of newCats) console.log(`   + category ${c.name}`);

if (DRY) {
	const sample = newProducts.slice(0, 5);
	for (const p of sample) {
		console.log(`\n   + ${p.name}`);
		for (const v of p.variants ?? []) {
			console.log(
				`        ${String(v.name).padEnd(16)} €${String(v.price).padEnd(7)} ${
					srcCatName[v.category] ?? '?'
				}` + (v.active === false ? '  (hidden)' : '')
			);
		}
	}
	if (newProducts.length > sample.length) {
		console.log(`\n   ...and ${newProducts.length - sample.length} more products`);
	}
	console.log('\nDry run, nothing written. Drop --dry-run to seed.');
	process.exit(0);
}

// ---- write --------------------------------------------------------------

for (const c of newCats) {
	const made = await dst.create('categories', { name: c.name, sort: c.sort ?? 0 });
	dstByName.set(key(c.name), made);
}
if (OVERWRITE) {
	for (const c of srcCats) {
		const there = dstByName.get(key(c.name));
		if (there && there.sort !== c.sort) await dst.update('categories', there.id, { sort: c.sort });
	}
}

/** Point each variant at the target's own id for that category name. */
function remap(product) {
	const missing = [];
	const variants = (product.variants ?? []).map((v) => {
		const name = srcCatName[v.category];
		const there = name && dstByName.get(key(name));
		if (!there) missing.push(name ?? v.category);
		return { ...v, category: there?.id };
	});
	return { variants, missing };
}

let created = 0;
let refreshed = 0;
const problems = [];

for (const p of srcProducts) {
	const { variants, missing } = remap(p);
	if (missing.length) {
		problems.push(`${p.name}: no target category for ${[...new Set(missing)].join(', ')}`);
		continue;
	}

	const existing = dstProducts.find((d) => key(d.name) === key(p.name));
	if (!existing) {
		await dst.create('products', { name: p.name, variants });
		created++;
	} else if (OVERWRITE) {
		// Only when it actually differs: rewriting all of them would put a row per
		// product in the target's audit log on every sync.
		const same =
			existing.name === p.name &&
			JSON.stringify(existing.variants ?? []) === JSON.stringify(variants);
		if (!same) {
			await dst.update('products', existing.id, { name: p.name, variants });
			refreshed++;
		}
	}
}

console.log(
	`\nCreated ${created} products` +
		(refreshed ? `, refreshed ${refreshed}` : '') +
		(problems.length ? `, skipped ${problems.length}` : '') +
		'.'
);
for (const p of problems) console.log(`   ! ${p}`);
console.log('Check the category order on the target and drag it into place if needed.');
