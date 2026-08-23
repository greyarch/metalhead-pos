# Metalhead Brewery POS

SvelteKit SPA + PocketBase. One container: PocketBase serves both the API and the
built app, and stores everything in a single SQLite file under `pb_data/`.

Sales are printed on a myPOS fiscal device over JSON-RPC. The device lives on the
same LAN as the till, and the browser talks to it directly — the app scans
`192.168.8.100-110:8080` on load (see [scan.js](src/lib/scan.js)) and remembers the
hit in `localStorage`.

## Data

| Collection      | Notes                                                                                                                    |
| --------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `users`         | till operators, auth collection — signup is closed, a superuser creates them in the admin UI                             |
| `categories`    | sidebar, ordered by `sort` then `name`                                                                                   |
| `products`      | `variants` is JSON: `[{ "name": "0.5", "price": 6 }]`; staff add these from the till, and hide them with the list button |
| `orders`        | `payment_type`: `cash` \| `card` \| `register`                                                                           |
| `order_items`   | snapshots name/variant/price — editing a product never rewrites past sales                                               |
| `period_totals` | view collection, SQL sums for today, this week, this month and this year                                                 |
| `audit`         | who changed what, written by a hook — see below                                                                          |

Schema lives in [pb_migrations/](pb_migrations/) as one snapshot, applied on
startup. Editing collections in the admin UI appends further migrations here —
commit them.

**Until the first production deploy**, those extras can be collapsed back into a
single snapshot whenever they pile up:

```bash
./pb migrate collections --dir ./pb_data --migrationsDir ./pb_migrations
rm pb_migrations/<the files it supersedes>
```

**After that, never again.** A deployed database has already recorded the old
migrations as applied; replacing them makes it and a fresh install build their
schemas from different files. From the first deploy on, migrations only get
appended.

## Seeding the menu onto another instance

[scripts/seed-remote.mjs](scripts/seed-remote.mjs) copies categories and products
from one PocketBase to another — normally this laptop to the VPS. Orders, the
audit log and users are not copied; they belong to the instance they happened on.

```bash
SRC_EMAIL=admin@local.dev SRC_PASSWORD=... \
  DST_URL=https://pos.example.com DST_EMAIL=... DST_PASSWORD=... \
  node scripts/seed-remote.mjs --dry-run     # counts, new categories, a sample

# drop --dry-run to write; add --overwrite to also refresh what is already there
```

Category ids differ between instances and every variant points at one, so the
ids are remapped by category name on the way over. Category order comes across
with them.

Re-running creates nothing. `--overwrite` refreshes only the products that
actually differ, so a sync does not put a row per product in the target's audit
log. Products are matched by name, so the script refuses to run if two source
products share one — they would land on the same target row and overwrite each
other on every sync.

## Audit

[pb_hooks/audit.pb.js](pb_hooks/audit.pb.js) records every catalogue change that
arrives over the API: creating a product or category, editing one, deleting one,
plus order deletions (a rolled-back sale would otherwise leave no trace). Each
row holds the actor, the record, and before/after snapshots.

It is a server hook rather than frontend code so it cannot be skipped or forged
by whatever calls the API. Staff can read the log but not write to it — only the
hook writes, and hooks bypass API rules. Read it in the admin UI under `audit`.

Two things to know when editing the hooks: each handler runs in its own goja
context and cannot see functions defined elsewhere in the file, which is why the
helpers are `require`d inside each one; and every handler must reach `e.next()`,
or auditing would block the very operation it is recording.

## Developing

Grab the PocketBase binary (v0.40.0, matching the [Dockerfile](Dockerfile)) from
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

`npm run check` type-checks the Svelte, `npm run lint` runs prettier and eslint.
Add categories, products and till users in the admin UI at http://127.0.0.1:8090/\_/.

Styling is Tailwind 4 through [@tailwindcss/vite](vite.config.js) — no PostCSS
step and no `tailwind.config`. The palette and the two typefaces are declared in
the `@theme` block at the top of [src/app.css](src/app.css).

## Reactive state

Svelte 5 runes. Shared state lives in `.svelte.js` modules under
[src/lib/stores/](src/lib/stores/) — the folder name is a leftover, there are no
Svelte stores left. Each exports a plain object or class instance:
`cart.items`, `settings.showCalcByDefault`, `notice.flash`, `auth.ok`. Read them
directly, no `$` prefix, no `subscribe`.

The Svelte MCP server and the official Svelte skills are wired up in
[.mcp.json](.mcp.json) and [.claude/skills/](.claude/skills/), so an agent
working here gets Svelte 5 documentation on demand rather than guessing from
Svelte 4 habits.

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

## Hardening

[pb_migrations/1787488100_harden.js](pb_migrations/1787488100_harden.js) carries the
settings that otherwise only ever existed in one admin UI and so came up wrong on a
fresh deploy: signup closed, the rate limiter on, a nightly backup, the batch
endpoint on (the till submits an order and its lines in one transaction).

Two things it deliberately leaves alone:

- Backups land in `pb_data/backups`, on the same disk as the database they protect.
  Three are kept. Copy them off the box if the box itself is what you are afraid of.
- The rate limiter counts per client IP, and behind
  [docker-compose.proxy.yml](docker-compose.proxy.yml) every request arrives from the
  proxy, so the whole world shares one bucket. Fixing that means telling PocketBase
  which forwarded-for header to trust (Settings → Application → trusted proxy), and
  trusting a header that no proxy is actually setting lets a client forge its own IP.
  So it is set by hand, once, when you know what is in front.
