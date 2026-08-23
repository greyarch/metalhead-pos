#!/usr/bin/env bash
# Checks the period_totals view's date boundaries — Monday for the week, the 1st
# for the month, 1 January for the year.
#
#   scripts/check-period-totals.sh [path/to/data.db]
#
# The real view SQL is copied out of the database and replayed in a throwaway
# db against fixture orders, with 'now' pinned to a known date. pb_data is only
# ever read.
set -euo pipefail

DB=${1:-pb_data/data.db}
VIEW=$(sqlite3 "$DB" "SELECT sql FROM sqlite_master WHERE name = 'period_totals';")
[ -n "$VIEW" ] || { echo "no period_totals view in $DB — run ./pb migrate up"; exit 1; }

# Local dates, so the fixtures land where the view's date(created, 'localtime')
# expects them. Prices double per row: any bucket summing the wrong set of rows
# lands on a number no other set can produce.
FIXTURES="
  INSERT INTO orders (id, created, total_price, payment_type) VALUES
    ('a', datetime('2026-08-19 12:00:00', 'utc') || 'Z',   1, 'cash'),
    ('b', datetime('2026-08-19 12:00:00', 'utc') || 'Z',   2, 'card'),
    ('c', datetime('2026-08-17 12:00:00', 'utc') || 'Z',   4, 'register'),
    ('d', datetime('2026-08-16 12:00:00', 'utc') || 'Z',   8, 'cash'),
    ('e', datetime('2026-08-01 12:00:00', 'utc') || 'Z',  16, 'cash'),
    ('f', datetime('2026-07-31 12:00:00', 'utc') || 'Z',  32, 'cash'),
    ('g', datetime('2026-01-01 12:00:00', 'utc') || 'Z',  64, 'cash'),
    ('h', datetime('2025-12-31 12:00:00', 'utc') || 'Z', 128, 'cash');
"

fail=0

# expect <pinned now> <period> <total> <cash> <card> <register>
expect() {
  local pin=$1 period=$2 want="$3|$4|$5|$6" got
  local tmp; tmp=$(mktemp -d)
  got=$(sqlite3 "$tmp/t.db" "
    CREATE TABLE orders (id TEXT PRIMARY KEY, created TEXT, total_price NUMERIC, payment_type TEXT);
    $FIXTURES
    ${VIEW//\'now\'/\'$pin\'};
    SELECT total, cash, card, register FROM period_totals WHERE id = '$period';
  ")
  rm -rf "$tmp"
  if [ "$got" = "$want" ]; then
    echo "ok    $pin $period -> $got"
  else
    echo "FAIL  $pin $period -> $got, wanted $want"
    fail=1
  fi
}

# Wednesday: week runs from Monday the 17th.
expect 2026-08-19 today 3 1 2 0
expect 2026-08-19 week 7 1 2 4
expect 2026-08-19 month 31 25 2 4
expect 2026-08-19 year 127 121 2 4

# Sunday closes the week that started on the 17th, it does not open a new one.
expect 2026-08-23 today 0 0 0 0
expect 2026-08-23 week 7 1 2 4

# Monday opens its own week.
expect 2026-08-17 today 4 0 0 4
expect 2026-08-17 week 4 0 0 4

# Turn of the month and of the year.
expect 2026-08-01 month 16 16 0 0
expect 2026-01-01 year 64 64 0 0

exit $fail
