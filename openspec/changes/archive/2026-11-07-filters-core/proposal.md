# Proposal

## Why

The transactions list, the analytics page and export all filter the same backend query (`GET /transactions`,
`/analytics/*` and `POST /exports` accept the same filter parameters), and the plan keeps filter state in the URL
so links can be shared and Back works. Without one shared filter layer every page would parse the URL, build the
territory cascade and render the controls on its own, and small mistakes (an unknown query key, a non-UUID
`run_id`, a request per keystroke) turn into 422 answers or gateway throttling. See `docs/frontend-plan.md`
(section 1 and step 3).

## What Changes

- A typed `TransactionFilters` model whose keys are exactly the shared filter parameters of the generated API
  types (`voivodeship_code`, `powiat_code`, `gmina_code`, `city_name`, `district_name`, `date_from`, `date_to`,
  `price_min/max`, `area_min/max`, `rooms[]`, `floor_min/max`, `market_type`, `function`, `address`,
  `exclusion_reason[]`, `run_id`), with pure `parseFilters(URLSearchParams)` and `serializeFilters(filters)`:
  array keys repeated, empty values dropped, unknown keys and malformed values ignored, codes, numbers, dates and
  UUIDs validated, so only valid known keys ever reach the backend.
- A `useFilters()` hook over React Router's `useSearchParams`: typing replaces the history entry, discrete choices
  push one; any filter change drops page-owned paging params and keeps only a documented list of non-filter keys
  (`sort`, `order`).
- Territory options for the cascade voivodeship -> powiat -> gmina, built from the flat `GET /territories` rows
  (cached for a long time); selecting a parent clears the children, selecting a child fills its parents.
- A `FilterPanel` component with a `fields` prop (so analytics can hide controls): searchable territory selects,
  date range, price range (whole premises price, PLN), area range (m2), rooms (1, 2, 3, 4, 5+), floor range,
  market type and function selects with readable labels, a "Rows" multi-select (clean / exclusion reasons),
  address search (substring) and city / district inputs (exact name). Text and number inputs commit after 400 ms
  of inactivity. The panel collapses behind a "Filters" button on small screens.
- `ActiveFilterChips`: one removable chip per active filter (territory names resolved from the options) and a
  "Reset all" button.
- Shared building blocks: shadcn-style `select`, `popover` and `checkbox` primitives written by hand on the
  existing `radix-ui` package, a `SearchableSelect` (popover with a filter input, no `cmdk`), a tested
  `useDebouncedCallback` hook, and small `Intl` formatting helpers.

Out of scope: fetching transactions or analytics with the filters, any page layout or route change, analytics
defaults (period, `function=mieszkalna`), the export button, backend changes. The `territories-preview` page and
capability stay as they are (they are replaced in `transactions-list`).

## Capabilities

### New Capabilities
- `filter-state`: the filter model, its URL encoding (parse / serialize rules and validation) and the
  `useFilters()` hook (history behaviour, preserved and dropped params, reset).
- `territory-options`: the voivodeship / powiat / gmina option lists built from `GET /territories`, name lookup by
  code, and the cascade rules (parent clears children, child implies parents).
- `filter-panel`: the filter controls, their labels and value mapping, debounced text and number input, the
  `fields` prop, the territory loading and error states, and the mobile collapse.
- `active-filter-chips`: the chip list of active filters, per-chip removal and "Reset all".

### Modified Capabilities
None. `useTerritories()` gets a long cache time but keeps returning the raw rows, so the `territories-preview`
requirements do not change.

## Impact

- Code: new `src/features/filters/` (model, params, `useFilters`, territory options, labels, `FilterPanel` and its
  field components, `ActiveFilterChips`), `src/components/SearchableSelect.tsx`, `src/components/ui/select.tsx`,
  `popover.tsx`, `checkbox.tsx`, `src/hooks/useDebouncedCallback.ts`, `src/lib/format.ts`; small edit to
  `src/features/territories/useTerritories.ts` (cache time); test helpers in `src/test/render.tsx` (render inside a
  memory router) and jsdom stubs for Radix Select in `src/test/setup.ts`.
- Dependencies: none added (`radix-ui` already ships Select, Popover, Checkbox; `cmdk` is not added).
- API: no calls besides the existing `GET /territories`. The model's keys are checked against the generated
  `list_transactions_transactions_get` and analytics query types at compile time, so a backend rename shows up in
  `npm run build` after `npm run api:types`.
- Backend: none. Two gaps are recorded in design.md: no `rooms_min` (so "5+" is sent as a list of values) and no
  list of city / district names (so those stay exact-name text inputs).
