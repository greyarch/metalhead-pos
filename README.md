# Metalhead Brewery POS

SvelteKit SPA + PocketBase. One container: PocketBase serves both the API and the
built app, and stores everything in a single SQLite file under `pb_data/`.

Sales are printed on a myPOS fiscal device over JSON-RPC. The device lives on the
same LAN as the till, and the browser talks to it directly — the app scans
`192.168.8.100-110:8080` on load (see [scan.js](src/lib/scan.js)) and remembers the
hit in `localStorage`.

## Data

| Collection     | Notes                                                        |
| -------------- | ------------------------------------------------------------ |
| `users`        | till operators, auth collection                              |
| `categories`   | sidebar, ordered by `sort` then `name`                       |
| `products`     | `variants` is JSON: `[{ "name": "0.5", "price": 6 }]`        |
| `orders`       | `payment_type`: `cash` \| `card` \| `register`               |
| `order_items`  | snapshots name/variant/price — editing a product never rewrites past sales |
| `today_totals` | view collection, SQL sums for today                          |

Schema lives in [pb_migrations/](pb_migrations/) as one snapshot, applied on
startup. Once there is a deployed database, schema edits made in the admin UI
append further migrations here — commit them.

## Developing

Grab the PocketBase binary (v0.39.10, matching the [Dockerfile](Dockerfile)) from
https://github.com/pocketbase/pocketbase/releases into the project root, named
`pb` — it is gitignored. Not `pocketbase`: that name collides with the npm
package of the same name and vite tries to bundle the binary.

```bash
npm install
cp .env.example .env.local

# terminal 1 — backend on :8090
./pb serve --dir ./pb_data --migrationsDir ./pb_migrations
./pb superuser upsert admin@local.dev <password> --dir ./pb_data   # first run only

# terminal 2 — app on :5173, talks to PUBLIC_PB_URL
npm run dev
```

Add categories, products and till users in the admin UI at http://127.0.0.1:8090/\_/.

## Deploying

```bash
PUBLIC_POS_URL=http://192.168.8.104:8080/jsonrpc docker compose up -d --build
```

`PUBLIC_POS_URL` is a **build** arg: the SPA has no server to read env from at
runtime. It is only the initial fallback anyway — the LAN scan overrides it.

On first deploy, create the superuser inside the container, then add the data:

```bash
docker compose exec metalhead-pos pocketbase superuser upsert you@example.com <password> --dir /pb/pb_data
```

`pb_data` is a named volume. It is the only thing worth backing up.
