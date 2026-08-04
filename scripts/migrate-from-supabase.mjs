#!/usr/bin/env node
// One-off: copy the catalogue out of Supabase into PocketBase.
//
//   SUPABASE_URL=https://xxx.supabase.co \
//   SUPABASE_KEY=<service_role key> \
//   PB_URL=http://127.0.0.1:8090 \
//   PB_EMAIL=admin@example.com PB_PASSWORD=... \
//   node scripts/migrate-from-supabase.mjs --dry-run
//
// Drop --dry-run to write. Safe to re-run: anything already there by name is
// left alone, so a half-finished run can simply be repeated.
//
// Orders are not copied. They are a different shape (order_items snapshots the
// name and price at sale time) and the till starts its books fresh.

const {
	SUPABASE_URL,
	SUPABASE_KEY,
	SUPABASE_EMAIL,
	SUPABASE_PASSWORD,
	PB_URL = 'http://127.0.0.1:8090',
	PB_EMAIL,
	PB_PASSWORD
} = process.env;

const DRY = process.argv.includes('--dry-run');

function need(name, value) {
	if (!value) {
		console.error(`Missing ${name}. See the header of this file.`);
		process.exit(1);
	}
	return value;
}

need('SUPABASE_URL', SUPABASE_URL);
need('SUPABASE_KEY', SUPABASE_KEY);
if (!DRY) {
	need('PB_EMAIL', PB_EMAIL);
	need('PB_PASSWORD', PB_PASSWORD);
}

async function json(res, what) {
	const body = await res.text();
	if (!res.ok) throw new Error(`${what} failed (${res.status}): ${body.slice(0, 300)}`);
	return body ? JSON.parse(body) : null;
}

// ---- read Supabase -------------------------------------------------------

async function supabaseToken() {
	// A service_role key needs no login and ignores RLS. An anon key does need
	// one, because the old app only ever read these tables while signed in.
	if (!SUPABASE_EMAIL) return SUPABASE_KEY;
	const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
		method: 'POST',
		headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
		body: JSON.stringify({ email: SUPABASE_EMAIL, password: SUPABASE_PASSWORD })
	});
	return (await json(res, 'Supabase login')).access_token;
}

async function readCatalogue() {
	const token = await supabaseToken();
	// The same shape the old till asked for.
	const select = 'price,products(id,name,active,categories(id,name)),variants(id,name)';
	const res = await fetch(
		`${SUPABASE_URL}/rest/v1/products_variants?select=${encodeURIComponent(select)}`,
		{ headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` } }
	);
	return json(res, 'Supabase read');
}

// ---- reshape -------------------------------------------------------------

/** Flatten the join table into one record per product, variants nested. */
export function reshape(rows) {
	const categories = new Map(); // name -> { name, products: Map }
	const skipped = [];

	for (const row of rows) {
		const product = row.products;
		const category = product?.categories;
		if (!product || !category) {
			skipped.push(row);
			continue;
		}

		if (!categories.has(category.name)) {
			categories.set(category.name, { name: category.name, products: new Map() });
		}
		const bucket = categories.get(category.name).products;

		if (!bucket.has(product.id)) {
			bucket.set(product.id, {
				name: product.name,
				active: product.active ?? true,
				variants: []
			});
		}
		bucket.get(product.id).variants.push({
			name: row.variants?.name ?? 'default',
			price: Number(row.price)
		});
	}

	// Cheapest first, so 0.3 lands before 0.5 the way the old menu read.
	for (const c of categories.values()) {
		for (const p of c.products.values()) p.variants.sort((a, b) => a.price - b.price);
	}

	return { categories: [...categories.values()], skipped };
}

// ---- write PocketBase ----------------------------------------------------

async function pbToken() {
	const res = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ identity: PB_EMAIL, password: PB_PASSWORD })
	});
	return (await json(res, 'PocketBase login')).token;
}

async function pbList(token, collection) {
	const res = await fetch(`${PB_URL}/api/collections/${collection}/records?perPage=500`, {
		headers: { Authorization: token }
	});
	return (await json(res, `read ${collection}`)).items;
}

async function pbCreate(token, collection, body) {
	const res = await fetch(`${PB_URL}/api/collections/${collection}/records`, {
		method: 'POST',
		headers: { Authorization: token, 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});
	return json(res, `create ${collection}`);
}

// ---- run -----------------------------------------------------------------

const rows = await readCatalogue();

if (!rows.length) {
	// Reading nothing is not success. RLS hides these tables from an anon key,
	// so without a login the read comes back empty and the import would happily
	// report "wrote 0 products" as though it had worked.
	console.error(
		'Supabase returned no rows.\n' +
			(SUPABASE_EMAIL
				? 'Signed in, but nothing came back — check the tables still hold data.'
				: 'The anon key cannot read these tables on its own. Either set SUPABASE_EMAIL\n' +
				  'and SUPABASE_PASSWORD for a till user, or use the service_role key, which\n' +
				  'ignores RLS and needs no login.')
	);
	process.exit(1);
}

const { categories, skipped } = reshape(rows);

const totalProducts = categories.reduce((n, c) => n + c.products.size, 0);
const totalPrices = categories.reduce(
	(n, c) => n + [...c.products.values()].reduce((m, p) => m + p.variants.length, 0),
	0
);

console.log(`Supabase: ${rows.length} price rows`);
console.log(
	`  -> ${categories.length} categories, ${totalProducts} products, ${totalPrices} prices`
);
if (skipped.length) {
	console.log(`  !! ${skipped.length} rows skipped (no product or no category attached)`);
}
for (const c of categories) {
	console.log(`\n  ${c.name}`);
	for (const p of c.products.values()) {
		const sizes = p.variants.map((v) => `${v.name} €${v.price.toFixed(2)}`).join(', ');
		console.log(`    ${p.active ? ' ' : '·'} ${p.name}: ${sizes}`);
	}
}

if (DRY) {
	console.log('\nDry run, nothing written. Drop --dry-run to import.');
	process.exit(0);
}

const token = await pbToken();
const existingCats = new Map((await pbList(token, 'categories')).map((c) => [c.name, c]));
const existingProds = new Set(
	(await pbList(token, 'products')).map((p) => `${p.category}|${p.name}`)
);

let madeCats = 0;
let madeProds = 0;
let skippedProds = 0;

for (const [i, c] of categories.entries()) {
	let cat = existingCats.get(c.name);
	if (!cat) {
		cat = await pbCreate(token, 'categories', { name: c.name, sort: existingCats.size + i });
		existingCats.set(c.name, cat);
		madeCats++;
	}

	for (const p of c.products.values()) {
		if (existingProds.has(`${cat.id}|${p.name}`)) {
			skippedProds++;
			continue;
		}
		await pbCreate(token, 'products', {
			name: p.name,
			category: cat.id,
			active: p.active,
			variants: p.variants
		});
		madeProds++;
	}
}

console.log(
	`\nWrote ${madeCats} categories and ${madeProds} products` +
		(skippedProds ? `, left ${skippedProds} already-present products alone.` : '.')
);
console.log('Check the order of the categories in the till and drag them into place.');
