# Design

## Context

- See proposal.md (Why). Backend semantics verified in `rcn-extraction`
  (`src/database/repositories/property_transaction.py`, `apply_filters`; `src/api/schemas/transactions.py`):
  - exact match for `powiat_code`, `gmina_code`, `city_name`, `district_name`, `market_type`, `function`;
    `voivodeship_code` is `powiat_code LIKE '<code>%'`; `address` is `ILIKE '%…%'` (escaped);
  - `price_*` compare `price_premises` (whole premises price), `area_*` compare `area_usable`, both `ge=0`;
    `floor_*` are integers with no bounds; `rooms` is `IN (...)`, so there is no "at least N rooms";
  - `exclusion_reason` is `IN (...)` where `clean` means `exclusion_reason IS NULL`; any other string is accepted
    and simply matches nothing;
  - `run_id` is a `uuid.UUID`, dates are `date`; the model is `extra="forbid"` (unknown key → 422), and a
    malformed UUID, date or number is also a 422.
- `src/api/schema.d.ts`: `operations["list_transactions_transactions_get"]["parameters"]["query"]` has the 19
  filter keys plus `limit`, `sort`, `order`, `after_value`, `after_id`; the analytics queries have exactly the 19
  filter keys (summary makes the dates required). `TerritoryResponse` is
  `{voivodeship_teryt, voivodeship_name, powiat_teryt|null, powiat_name|null, gmina_teryt|null, gmina_name|null}`.
- `src/features/territories/useTerritories.ts` returns the raw rows with the default `staleTime` (30 s) and is used
  by `TerritoriesPreviewPage` (spec `territories-preview`), which must keep working until `transactions-list`.
- UI kit: shadcn new-york on the `radix-ui` package (`button`, `badge`, `dialog`, `dropdown-menu`, `input`, `label`,
  `skeleton`, `sonner`, `tooltip`). `radix-ui` 1.8 also ships `Select`, `Popover`, `Checkbox`. No `cmdk`.
- Tests: Vitest + jsdom, Testing Library with `fireEvent` (no `user-event` installed), `stubFetch` /
  `jsonResponse` / `deferred` in `src/test/http.ts`, `renderRoutes()` in `src/test/render.tsx`. The jsdom setup
  stubs `matchMedia` and `ResizeObserver`; Radix Select also needs `hasPointerCapture`,
  `releasePointerCapture` and `scrollIntoView`, which jsdom lacks. The test locale is `en-US`.
- oxlint enforces `react/only-export-components`, so hooks, constants and components live in separate files (the
  theme and auth folders follow that pattern).

## Goals / Non-Goals

**Goals:**
- One pure, fully unit-tested URL codec that can never produce a param the backend rejects.
- A hook and components that the next changes (`transactions-list`, `analytics`, `export`) use without changes:
  pages only place `FilterPanel` / `ActiveFilterChips` and pass `useFilters().filters` into their query.
- No extra requests: one cached territory request, one URL write per pause in typing.

**Non-Goals:**
- Building API requests, query keys or paging (the pages own them; the model is directly assignable to the API
  query type).
- Page-specific defaults (analytics period, `function=mieszkalna`), saved filter presets, autocomplete for city and
  district (no backend list).
- Virtualised option lists (largest list is about 2,500 gminas, shown only per powiat).

## Decisions

### Module layout

```
src/features/filters/
  model.ts            TransactionFilters, FILTER_KEYS, PRESERVED_PARAMS, FilterField, FILTER_FIELDS,
                      EXCLUSION_REASONS, ROOMS_PLUS (5..10), compile-time key checks
  params.ts           parseFilters(URLSearchParams), serializeFilters(filters)          + params.test.ts
  labels.ts           MARKET_TYPE_LABELS, FUNCTION_LABELS, EXCLUSION_REASON_LABELS, labelFor()
  useFilters.ts       the URL hook                                                      + useFilters.test.tsx
  territoryOptions.ts buildTerritoryOptions(rows), cascade helpers                      + territoryOptions.test.ts
  useTerritoryOptions.ts  options + nameOf(level, code) on top of useTerritories()
  chips.ts            buildChips(filters, nameOf, fields) -> {id, label, remove(filters)}[]  + chips.test.ts
  FilterPanel.tsx     layout, mobile toggle, field switch                               + FilterPanel.test.tsx
  fields/TerritoryField.tsx, RangeField.tsx (price, area, floor and dates), RoomsField.tsx,
         CategorySelectField.tsx, RowsField.tsx, DebouncedTextField.tsx                 (+ tests per field)
  ActiveFilterChips.tsx                                                                 + ActiveFilterChips.test.tsx
src/components/SearchableSelect.tsx                                                     + test
src/components/ui/select.tsx, popover.tsx, checkbox.tsx
src/hooks/useDebouncedCallback.ts                                                       + test
src/lib/search.ts     normalizeForSearch, matchesSearch (diacritics-insensitive)    + test
src/lib/format.ts     formatNumber, formatPln, formatArea, formatIsoDate (UTC date + UTC formatter)  + test
```

`useTerritories` stays in `src/features/territories/` (it outlives the preview page).

### Filter model typed from the generated API

`type FilterQuery = Omit<NonNullable<operations['list_transactions_transactions_get']['parameters']['query']>,
'limit' | 'sort' | 'order' | 'after_value' | 'after_id'>`. `TransactionFilters` is a hand-written interface with
the same keys and non-null types (`string`, `number`, `number[]`, `string[]`), plus type-level assertions in
`model.ts`: its keys equal `keyof FilterQuery`, equal the keys of the timeseries query, and
`TransactionFilters` is assignable to `FilterQuery`. `FILTER_KEYS` is a `const` tuple in canonical order whose
element type is checked to cover every key. A backend rename therefore fails `tsc -b` after `npm run api:types`.
Alternative: derive the interface with mapped types (`NonNullable<…>`); rejected because the hand-written one reads
better in editors and the assertions give the same safety.

### Codec rules (`params.ts`)

- Pure functions, no React. One validator per key in a table keyed by `FILTER_KEYS`; `parseFilters` reads
  `params.getAll(key)` and keeps the first valid value (single keys) or all valid values (arrays).
- Codes: `/^\d{2}$/`, `/^\d{4}$/`, `/^\d{7}$/`; then normalise the cascade: fill a missing parent from the child
  prefix; drop a child (and its children) that does not start with the given parent. Filling parents is neutral for
  the backend (a gmina lies inside its powiat and voivodeship) and gives the cascade UI a consistent state.
- Numbers: `/^\d+(\.\d+)?$/` for price and area, `/^-?\d+$/` for floor, then `Number()` and `Number.isFinite`.
  Rooms: integers 1..99, deduplicated, sorted. Dates: `/^\d{4}-\d{2}-\d{2}$/` plus a calendar check (build the date
  and compare its parts). `run_id`: canonical UUID regex, case-insensitive, stored lowercase. `exclusion_reason`:
  only catalogue values, in catalogue order. `market_type` / `function`: any trimmed non-empty string (values are
  data-driven; the backend accepts any string, so this cannot cause a 422).
- `min > max` and `from > to` are kept: the backend returns an empty result, the panel shows a hint, and silently
  swapping would surprise users of shared links.
- `serializeFilters` walks `FILTER_KEYS`, appends one param per array item, writes numbers with `String(n)`, and
  skips `undefined`, empty strings and empty arrays. `parseFilters(serializeFilters(f))` deep-equals any `f` that
  `parseFilters` can return; this is the property tested.

### `useFilters()` over `useSearchParams`

Returns `{ filters, setFilters(next, {history}), updateFilters(patch, {history}), resetFilters() }`.

- `filters` is memoised on the serialised filter string, so it keeps its identity when only `sort` / `order` change
  (pages use it in query keys and effects).
- Every write builds new params: `serializeFilters(next)` followed by the `PRESERVED_PARAMS` (`['sort', 'order']`)
  copied from the current URL in that order; every other param (cursor such as `after_id` / `after_value`, unknown
  keys) is dropped. If the resulting string equals the current search, nothing is written.
- `history: 'replace' | 'push'`: debounced text, number and date commits use `replace`; selects, checkboxes,
  territory choices, chip removal and reset use `push` (the field components pass it, the hook has no default, so
  each call site states its intent). `setSearchParams(next, { replace, preventScrollReset: true })`.
- `updateFilters` merges a patch where `undefined` removes a key; territory writes go through cascade helpers so a
  parent change clears children in the same write.
- Alternative: keep filters in React state and mirror to the URL; rejected, two sources of truth and Back would
  not work. Alternative: preserve every non-filter param; rejected, stale `after_*` cursors would survive a filter
  change and page a different result set.

### Territory options

- `useTerritories()` gains `staleTime: Infinity` and `gcTime: Infinity` (the list changes only with a backend
  deploy); return type unchanged, so the preview page and its tests are untouched. One query key, so every consumer
  shares one request.
- `buildTerritoryOptions(rows)` (pure): `voivodeships`, `powiatsByVoivodeship`, `gminasByPowiat`, `allPowiats`, and
  a `Map` per level for name lookup. Sorting with `Intl.Collator('pl')`. Duplicate gmina names inside a powiat get
  `"<name> (<code>)"` labels. `useTerritoryOptions()` memoises it over the query data and exposes
  `{ status, options, nameOf(level, code), refetch }`; `nameOf` falls back to the code.
- Cascade helpers (pure): `selectVoivodeship(filters, code?)`, `selectPowiat(filters, code?)`,
  `selectGmina(filters, code?)` return the next filters (parent set from prefix, children cleared when changed).
- Gmina select is disabled until a powiat is chosen; powiat select lists all powiats when no voivodeship is chosen
  (about 380, searchable), so users can find a powiat by name directly.

### Searchable select without `cmdk`

`SearchableSelect` = Radix `Popover` with a trigger `Button` (`aria-haspopup="listbox"`, `aria-expanded`,
named by the field label plus the value; the search input is the `role="combobox"`), and content holding a text `Input` (auto-focused) and a `role="listbox"` of `role="option"`
items; the input owns `aria-activedescendant`, ArrowUp/ArrowDown/Home/End move, Enter picks, Escape closes (Radix)
and returns focus to the trigger. The first option is "Any". Matching: `normalize('NFD')`, strip combining marks,
map `ł`→`l`, lowercase, `includes`, against the label and the code. Empty result shows "No matches". Generic
props `{ id, options: {value, label}[], value, onChange, placeholder, disabled, anyLabel }`. Alternative: shadcn
Combobox (needs `cmdk`, ~12 kB, its own filtering); rejected since a 100-line component covers it and is fully
tested.

### Other controls

- Selects (market type, function): shadcn `select` on Radix Select. Radix forbids `""` as an item value, so "Any"
  uses the sentinel `__any__` mapped to `undefined`. An unlisted URL value is appended as an extra item with its raw
  text. Choosing pushes history.
- Rooms and rows: shadcn `checkbox` (Radix, `role="checkbox"`). Rooms is an inline group of five labelled
  checkboxes in a `fieldset`/`legend`. "5+" toggles `ROOMS_PLUS = [5..10]` (see Risks). Rows is a `Popover` with a
  checkbox list and a summary trigger ("All rows", "Clean only", the label, "<n> selected").
- Ranges and text: `DebouncedTextField` keeps a local draft, validates it with a per-field parser (price/area:
  digits with `,` or `.` → number ≥ 0; floor: optional `-` and digits; text: trimmed string) and commits through
  `useDebouncedCallback` (400 ms) with `history: 'replace'`. Enter and blur flush; unmount cancels. When the
  committed prop changes and there is no pending edit, the draft is reset to it. Invalid drafts set
  `aria-invalid` and an error linked by `aria-describedby`, and are not committed. Number inputs are `type="text"`
  with `inputMode="decimal"`/`"numeric"` (avoids `type=number` wheel changes and locale comma issues). Dates are
  native `type="date"` inputs through the same debounce (typing a year emits several valid dates).
- Helper texts ("Part of the address", "Exact name") are linked with `aria-describedby`.

### `useDebouncedCallback(callback, delayMs)`

Returns a stable `{ run(...args), flush(), cancel(), isPending() }`; keeps the latest callback in a ref, one
`setTimeout` at a time, cleared on unmount. Tested with `vi.useFakeTimers()`. No dependency (`use-debounce`
rejected: one small hook).

### Chips

`buildChips(filters, nameOf, fields)` (pure) returns chips in panel field order, each with a `remove(filters)` that
returns the next filters (ranges clear both ends, "5+" clears all ≥ 5, territory chips use the cascade helpers).
`ActiveFilterChips` renders them as `Badge`s with an `X` icon button (`aria-label="Remove <label>"`), a
"Reset all" ghost button, inside `<section aria-label="Active filters" tabIndex={-1}>` with an `sr-only` "No active
filters" when empty. Focus after removal is moved in an effect keyed by the removed index. The count for the
"Filters (n)" button is `buildChips(...).length`, so the two always agree.

### Panel layout and mobile collapse

`FilterPanel({ fields = FILTER_FIELDS, className })` renders a toggle `Button` (`md:hidden`, `aria-expanded`,
`aria-controls`, "Filters" + count) and a content `div` that is `hidden md:grid` when collapsed and `grid` when
open. Content stays mounted, so drafts survive collapsing (Radix Collapsible would unmount by default). Grid:
1 column below `sm`, 2 from `sm`, 3 from `lg`, 4 from `xl`; the territory field spans the full row. The panel has
no outer positioning, so a page can put it on top or in a sidebar.

### Labels and formatting

Market type: Primary / Secondary. Function: Residential, Garage, Other, Retail and services, Office, Industrial.
Rows: Clean, Fractional share, Package deal, Non-market, Missing fields, Implausible area, Unassigned,
No city / district, Implausible price. `labelFor(map, value)` returns the raw value for unknown keys (the table in
`transactions-list` reuses these). `src/lib/format.ts` uses `Intl` with the browser locale; ISO dates are built and
formatted in UTC (`timeZone: 'UTC'`), so no time zone can shift the day. Prices are shown as "200,000 – 500,000 PLN" (number
format + suffix) rather than currency style, which would put `PLN` before each number in `en-US`.

### Test helpers

`src/test/render.tsx` gains `renderWithRouter(ui, { path = '/', previous = [] })`: a memory router with one
catch-all route rendering `ui` inside a fresh `QueryClientProvider` (`retry: false`); it returns the router so tests
read `router.state.location` and `router.state.historyAction` and call `router.navigate(-1)`.
`src/test/setup.ts` gains the three Element stubs Radix Select needs. A helper `pickOption(triggerName,
optionName)` in `src/test/select.ts` opens a Radix select with the keyboard and clicks an option.

## Risks / Trade-offs

- [No `rooms_min` in the API] → "5+" is sent as `rooms=5..10`; flats with more than 10 rooms are missed and the URL
  is longer. Chips and the checkbox collapse it to "5+". If the backend adds `rooms_min`, only the rooms field,
  chips and model change.
- [City / district are exact match with no list of names] → plain inputs with the "Exact name" helper; a typo
  returns nothing. Replace with autocomplete when the backend exposes the names (see plan, section 5).
- [`market_type` / `function` values come from one powiat's report] → unknown values are accepted from the URL and
  shown raw.
- [Two debounced fields committing in the same tick could build from the same stale params] → commits are 400 ms
  apart from user input and flush on blur, so the second write sees the first; `setSearchParams` is still given the
  full next params, never a partial patch of the URL string.
- [Radix Select / Popover in jsdom] → setup stubs plus keyboard-driven helpers; behaviour is also checked manually in
  the browser at 360px and desktop before archive.
- [Filling parent codes rewrites shared links on the next change] → semantically identical query; documented in the
  spec.
- [Territories cached forever in a tab] → acceptable; a reload fetches them again.

## Migration Plan

Additive; nothing uses the filters yet. Rollback = revert the change. `useTerritories` keeps its return type.

## Open Questions

- Should the backend add `rooms_min` (and a city / district name list)? Only affects the rooms field and the
  city / district inputs later; this change works without them.
