# Tasks

## 1. Setup

- [x] 1.1 Install `recharts` (only that package) and verify `npm run build`, `npm run lint` and `npm test` still pass
- [x] 1.2 Add the chart colour tokens (`--chart-median`, `--chart-band`, `--chart-count`, `--chart-grid`, `--chart-axis`) for light and dark to `src/index.css`, checked against the `dataviz` skill guidance; verify the contrast of each against the card background is at least 3:1 in both themes
- [x] 1.3 Add `formatPlnPerM2`, `formatPercent` (sign, at most one decimal) and a UTC month label to `src/lib/format.ts` with unit tests in `src/lib/format.test.ts` (rounding, signs, `0%`, month name); verify the tests pass

## 2. Period, defaults and data hooks

- [x] 2.1 Create `src/features/analytics/period.ts`: today (stubbable), `periodPreset(today, months)` with month-end clamping, default period, `matchPreset(filters)`; verify with `period.test.ts` (31 Aug − 6 months, leap day, custom period, year boundary)
- [x] 2.2 Create `useAnalyticsFilters.ts`: wrap `useFilters`, normalise the URL by replacing the entry (missing period end, `function=mieszkalna` only on an empty query, drop `exclusion_reason`/`address`/`run_id`), expose `ready`; verify with `useAnalyticsFilters.test.tsx` (fresh visit, one end given, shared link, stray keys, reset returns to defaults, removing the function chip sticks, Back leaves the page)
- [x] 2.3 Create `useAnalyticsData.ts` with `useSummary` and `useTimeseries` (`enabled` only when `ready`, key from serialized filters, 5-minute stale time, no focus refetch); verify with `useAnalyticsData.test.tsx` that the requested query contains the filters and period and none of `sort`, `order`, `limit`, `after_id`, `after_value`, `exclusion_reason`, `address`, `run_id`, and that nothing is requested before the period is set

## 3. KPI cards

- [x] 3.1 Create `KpiCards.tsx` with the four cards, sign/arrow/"n/a" rules and text for the direction; verify with `KpiCards.test.tsx` (positive, negative, zero, null change, null medians, count 0, rounding, order and titles)

## 4. Trend chart

- [x] 4.1 Create `trend.ts` (`buildTrend`: drop null/unparseable months, sort, band, month key) and `TrendTable.tsx`; verify with `trend.test.ts` and `TrendTable.test.tsx` (null month ignored, null median shown as "n/a", ordering)
- [x] 4.2 Create `AnalyticsCharts.tsx` (the only `recharts` importer) with the composed trend chart (band, median line, count bars on the right axis, custom tooltip, `role="img"` label) and `TrendSection.tsx` with the "View as table" toggle, lazy chart and states; verify with `TrendSection.test.tsx` (toggle both ways, empty list, error with retry, tooltip text from the formatter, skeleton while the chunk loads)

## 5. Distribution charts

- [x] 5.1 Create `distribution.ts` (`buildDistribution` with "Unknown" and numeric ordering, `sortDistribution`, three-step header cycle); verify with `distribution.test.ts` (numeric vs string groups, "Unknown" last, both columns and directions)
- [x] 5.2 Create `DistributionSection.tsx` (bar chart from `AnalyticsCharts.tsx` with count labels, per-section Chart/Table toggle, sortable table with `aria-sort` header buttons, empty state); verify with `DistributionSection.test.tsx` (order, toggle one section only, sort by count twice, no request on sort, empty floors)

## 6. Page and routes

- [x] 6.1 Create `PeriodPresets.tsx` (five choices with `aria-pressed`, "Custom" focuses the From input, presets push an entry and apply at once); verify with `PeriodPresets.test.tsx` (3 months from a fixed date, custom period marks "Custom", month-end case)
- [x] 6.2 Create `AnalyticsPage.tsx` (header with the empty export slot `data-slot="export-action"`, presets, `FilterPanel` and `ActiveFilterChips` with the fields without `rows` and `address`, the four sections, the clean-only note, section states); verify with `AnalyticsPage.test.tsx` (layout order, no Rows/Address control, default chip, section skeletons, empty summary, timeseries failing alone, retry repeats only the failed request, searching again requests with new filters)
- [x] 6.3 Remove `AnalyticsPage` from `src/app/pages.tsx`, point the `analytics` route at the new page, and update `src/app/routes.test.tsx` and `src/App.test.tsx` for the new heading; verify `npm test` passes

## 7. Verification

- [x] 7.1 Run `npm run build`, `npm run lint`, `npm test` and `npm run format:check`; verify all pass, and verify in the build output that `recharts` sits in a separate chunk, not in the main one
