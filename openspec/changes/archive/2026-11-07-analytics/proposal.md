# Proposal

## Why

`/analytics` is still a placeholder, although the backend already serves price statistics
(`/analytics/summary`, `/analytics/timeseries`) and the shared filter layer is ready. Users cannot see
how the price per m² moves over time or how deals split by rooms and floor. This is the first of the
data-heavy screens and it fixes the chart conventions the later screens follow.

## What Changes

- Replace the placeholder at `/analytics` with the analytics page: the shared filter panel and active
  filter chips, a required period, KPI cards, a monthly price chart and two distribution charts.
- The period (`date_from`, `date_to`) is always present in the URL. A visit without a period gets the last
  12 months ending today; quick presets (3 months, 6 months, 12 months, 3 years) and a custom range set it.
- Filters that do not apply are hidden and never sent: "Rows" (`exclusion_reason`), `address`, `run_id`.
  The backend counts clean transactions only. A visit without any filters starts with `function=mieszkalna`
  as a removable chip, so garages and offices do not skew the median.
- Four KPI cards: median price per m², number of clean transactions, change against the same dates a year
  earlier (`n/a` when unknown), previous-year median.
- A Recharts composed chart by month: median line, p25–p75 band, count bars on a second axis, tooltip with
  all values, and a "View as table" toggle.
- Two bar charts, by rooms and by floor, each with a chart/table toggle; the table sorts on the client by
  group or by count. A missing group is labelled "Unknown".
- Loading skeletons, "No data for this period" and a per-section error with retry. A note states that only
  clean transactions are counted. The page header keeps an empty slot for the export button.
- Add the `recharts` dependency; the charts are loaded lazily so the transactions page bundle does not grow.

## Capabilities

### New Capabilities
- `analytics-page`: the `/analytics` page: layout, required period and presets, default filters, which filter
  fields it offers, the data requests, section states and the clean-only note.
- `analytics-kpis`: the four KPI cards and how each value, including missing ones, is shown.
- `price-trend-chart`: the monthly median / p25–p75 / count chart, its tooltip and table alternative.
- `distribution-charts`: the rooms and floor distribution charts with chart/table toggle and client sorting.

### Modified Capabilities
- `app-shell`: `/analytics` is no longer a placeholder page.

## Impact

- Code: new `src/features/analytics/`; `src/app/pages.tsx` loses `AnalyticsPage`; `src/app/routes.tsx` points
  `analytics` at the new page; chart colour tokens are added to `src/index.css`.
- API: read-only use of `GET /analytics/summary` and `GET /analytics/timeseries`. Neither takes `sort`, `order`,
  `limit`, `after_*` or `exclusion_reason` from the UI (strict query, extra keys give 422).
- Dependencies: `recharts` (one new package).
- Specs: four new capabilities, one modified (`app-shell`).
