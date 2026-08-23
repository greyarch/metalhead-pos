/// <reference path="../pb_data/types.d.ts" />

// The stats page shows turnover for the day, the week, the month and the year,
// so today_totals becomes period_totals and returns one row per period instead
// of one row full stop. Every period is calendar-to-date: the week starts on
// Monday, the month on the 1st, the year on 1 January.
//
// The periods are a subquery joined to orders so the four COALESCE lines are
// written once, and every period ends today, so they share an upper bound.
const PERIOD_TOTALS = `
      SELECT p.id,
        COALESCE(SUM(o.total_price), 0) AS total,
        COALESCE(SUM(CASE WHEN o.payment_type = 'cash' THEN o.total_price END), 0) AS cash,
        COALESCE(SUM(CASE WHEN o.payment_type = 'card' THEN o.total_price END), 0) AS card,
        COALESCE(SUM(CASE WHEN o.payment_type = 'register' THEN o.total_price END), 0) AS register
      FROM (
        SELECT 'today' AS id, date('now', 'localtime') AS start
        UNION ALL SELECT 'week', date('now', 'localtime', 'weekday 0', '-6 days')
        UNION ALL SELECT 'month', date('now', 'localtime', 'start of month')
        UNION ALL SELECT 'year', date('now', 'localtime', 'start of year')
      ) p
      LEFT JOIN orders o
        ON date(o.created, 'localtime') BETWEEN p.start AND date('now', 'localtime')
      GROUP BY p.id
    `;

const TODAY_TOTALS = `
      SELECT 'today' AS id,
        COALESCE(SUM(total_price), 0) AS total,
        COALESCE(SUM(CASE WHEN payment_type = 'cash' THEN total_price END), 0) AS cash,
        COALESCE(SUM(CASE WHEN payment_type = 'card' THEN total_price END), 0) AS card,
        COALESCE(SUM(CASE WHEN payment_type = 'register' THEN total_price END), 0) AS register
      FROM orders
      WHERE date(created, 'localtime') = date('now', 'localtime')
    `;

migrate(
	(app) => {
		const totals = app.findCollectionByNameOrId('today_totals');
		totals.name = 'period_totals';
		totals.viewQuery = PERIOD_TOTALS;
		app.save(totals);
	},
	(app) => {
		const totals = app.findCollectionByNameOrId('period_totals');
		totals.name = 'today_totals';
		totals.viewQuery = TODAY_TOTALS;
		app.save(totals);
	}
);
