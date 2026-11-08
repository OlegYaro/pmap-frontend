# Design

## Context

- The filter layer is ready: `useFilters` keeps filters in the URL, `FilterPanel` takes a `fields` prop and edits a
  draft that is applied on "Search", and `ActiveFilterChips` takes the same `fields`. `TransactionFilters` is checked
  at compile time against the timeseries query type, so it can be passed to the analytics requests as it is.
- `GET /analytics/summary` needs `date_from` and `date_to`; `GET /analytics/timeseries` has them optional. Both are
  strict (an unknown query key gives 422) and count clean transactions only, replacing `exclusion_reason` themselves.
  `change_pct` is already a percent with one decimal (`10.0` means +10 %), checked in `pmap-backend`.
- The gateway allows 20 requests/s; a search sends two requests, so no debounce is needed beyond the panel's
  search-on-submit.
- The transactions page (`TransactionsPage`) is the pattern for page structure and states: `EmptyState`, `ErrorState`
  (with retry), `Skeleton`, `PageHeader` with an `actions` slot.
- Recharts is not installed yet. Tailwind v4 theme tokens live in `src/index.css`; there are no chart colours yet.

## Goals / Non-Goals

**Goals:**
- One page that reads everything from the URL, so a link reproduces the view.
- Charts whose data goes through plain, tested functions (series building, distribution ordering, formatting) so
  the Recharts layer stays thin.
- No chart code in the main bundle.

**Non-Goals:**
- Export (next change), a server-side `group_by` or sorting of distributions, comparing two periods.
- Storing toggle state (chart/table, table sort) in the URL.

## Decisions

**Period and defaults are written into the URL, once.** A small hook `useAnalyticsFilters` wraps `useFilters`. In an
effect it normalises the URL with `history: 'replace'`: it adds the missing end of the period, adds
`function=mieszkalna` only when the query was completely empty, and drops `exclusion_reason`, `address`, `run_id`.
The queries are `enabled` only when the URL already has both dates, so the first render sends nothing incomplete.
Alternative: compute defaults at read time and leave the URL bare. Rejected: the chip for the default function would
not be removable (removing a value that is not in the URL does nothing) and a shared link could change meaning with
the day it is opened. Writing them in makes the state explicit and removable. Removing the dates chip or "Reset all"
empties the URL, so the effect writes the default period (and function) again; that is the intended "reset to
defaults" and is stated in the spec.

**Presets are links to a date pair, not state.** `periodPreset(today, months)` returns `{date_from, date_to}`; the
selected preset is derived by comparing the URL period with each preset computed for today. Months are subtracted by
calendar, clamping the day to the target month's length (31 Aug − 6 months = 28 Feb). Dates are built and compared as
`YYYY-MM-DD` strings in UTC like `formatIsoDate`, so the result does not depend on the time zone. "Today" comes from
one function that tests can stub (`vi.setSystemTime`). Presets push a history entry and apply at once, because they
are a discrete choice. "Custom" is a selected state for non-matching periods and moves focus to the "From" input.
Alternative: a select. Rejected: five fixed options read faster as a segmented group (`radiogroup` semantics through
buttons with `aria-pressed`).

**Fields shown.** `fields = FILTER_FIELDS` without `rows` and `address`, one constant shared by `FilterPanel` and
`ActiveFilterChips`. The chips builder shows `run_id` regardless of fields, which is why the URL is normalised.

**Data layer.** `useSummary(filters)` and `useTimeseries(filters)` are two `useQuery` calls. The query key is built from
`serializeFilters(filters).toString()` like the transactions list, so equal filters share a cache entry; `staleTime`
5 minutes, no refetch on focus. The request query is the filters only (the type is a subset of the generated query, so
`sort` or `limit` cannot be added by mistake; a test asserts the exact query keys). Failures are `ApiError`s (the client
throws them), shown through `ErrorState`.

**Section composition.** `AnalyticsPage` renders four sections; KPIs and both distributions read the same summary query
and show the same state (skeleton / empty / error), the trend chart reads the timeseries query. Empty means summary
`count === 0` with no distribution rows, and a timeseries with no usable month.

**Charts are lazy.** Everything that imports `recharts` lives in `AnalyticsCharts.tsx` (trend and distribution charts)
and is loaded with `React.lazy` + `Suspense` (fallback: the same skeleton). The tables, formatting, series and ordering
functions do not import Recharts and stay in the main page chunk, so the table view and unit tests never need the
library.

**Trend chart.** Series are built by `buildTrend(points)`: drop points with a `null` month, sort by month, key by
`YYYY-MM`, band as `[p25, p75]` when both exist. A `ComposedChart` draws `Area` (band, low opacity, no stroke), `Line`
(median, `connectNulls={false}`) on the left axis and `Bar` (count, lower opacity) on a right axis `yAxisId="count"`.
The bars are drawn first so the line stays on top. The tooltip is a custom component that uses the same formatters as
the KPIs. Keyboard access is given by the table toggle (Recharts' own focus handling is not relied on); the chart
container is `role="img"` with a computed `aria-label`.

**Distribution.** `buildDistribution(rows)` maps `null` to "Unknown" and orders numbers ascending, other strings
alphabetically after them, "Unknown" last. `sortDistribution(rows, key, direction)` is the table's client sort, a pure
function with its own tests; a header cycles ascending → descending → ascending. Bars show the count as a label so the
value does not rely on the axis.

**Colours.** CSS variables `--chart-median`, `--chart-band`, `--chart-count`, `--chart-grid`, `--chart-axis` defined for
light and dark in `index.css` and read by the charts through `var(...)`. The palette is checked with the `dataviz` skill
(contrast ≥ 3:1 against the card background, colour-blind-safe pair for median vs count, differences in opacity and
shape as a second cue). Up/down arrows in the KPI use text and icon as well as colour.

**Formatting** goes through `src/lib/format.ts` (`formatNumber`, `formatPln`) with new small helpers added there:
`formatPlnPerM2` (whole złoty, "PLN/m²"), `formatPercent` (sign, ≤ 1 decimal) and a month label in UTC.

**Files** (under `src/features/analytics/`): `AnalyticsPage.tsx`, `useAnalyticsFilters.ts`, `period.ts`,
`PeriodPresets.tsx`, `useAnalyticsData.ts`, `KpiCards.tsx`, `TrendSection.tsx`, `TrendTable.tsx`, `trend.ts`,
`DistributionSection.tsx`, `distribution.ts`, `AnalyticsCharts.tsx` (the only Recharts importer), each with tests.

## Risks / Trade-offs

- [Effect rewrites the URL on load] → it uses `replace`, runs only while the URL is not normalised, and a test checks
  that it settles in one step and that Back leaves the page.
- [Recharts in jsdom has no layout, so `ResponsiveContainer` renders nothing] → tests assert the data functions and the
  table view; the chart component is tested with a stubbed `ResponsiveContainer` size, and the bundle split is checked
  by the build output.
- [The default function filter is invisible to anyone who opens a link without it] → the chip is always shown when the
  filter is set and the spec keeps shared links untouched.
- [`month` format is not documented in the schema] → parsed defensively from the first `YYYY-MM-DD`/`YYYY-MM` prefix;
  anything that does not parse is dropped like a `null` month.
- [Bundle size] → lazy chunk; `npm run build` output is checked and the main chunk must not contain Recharts.
