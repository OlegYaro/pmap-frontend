# Tasks

Every task ends with a passing `npm run build`, `npm run lint` and `npm test`. No new npm dependencies. HTTP in
tests goes through `src/test/http.ts`; tests use `fireEvent` and `vi.useFakeTimers()` for debounce (no
`user-event`). The test locale is `en-US`.

## 1. Model and URL codec

- [x] 1.1 Add `src/features/filters/model.ts`: `TransactionFilters`, `FILTER_KEYS` (canonical order),
  `PRESERVED_PARAMS = ['sort', 'order']`, `EXCLUSION_REASONS`, `ROOMS_PLUS` (5..10), `FilterField` and
  `FILTER_FIELDS` (panel order), plus type-level assertions that the keys equal the `list_transactions_transactions_get`
  query keys minus `limit`/`sort`/`order`/`after_value`/`after_id`, equal the timeseries query keys, and that
  `TransactionFilters` is assignable to that query type; verify `npm run build` passes and that temporarily adding a
  bogus key to the interface makes `tsc -b` fail (then remove it).
- [x] 1.2 Add `src/features/filters/params.ts` with `parseFilters` and `serializeFilters`; verify with
  `params.test.ts`: unknown keys, empty and whitespace values, trimming, first valid value for repeated single keys,
  code formats, parent filling from `gmina_code`, contradicting child dropped with its children, price/area
  (negative, text, decimal), floor (negative ok, decimal rejected), rooms (dedupe, sort, 0/100/`x` rejected), dates
  (`2024-02-29` ok, `2023-02-29` and `01.02.2024` rejected), `run_id` UUID (case, malformed), `exclusion_reason`
  catalogue order and unknown dropped, unknown `market_type` kept, `min > max` kept, array keys repeated in
  canonical order, and the round trip for a fully populated filter object.

## 2. Shared hooks, formatting and test helpers

- [x] 2.1 Add `src/hooks/useDebouncedCallback.ts` (`run`, `flush`, `cancel`, `isPending`; latest callback; cleared on
  unmount); verify with `useDebouncedCallback.test.tsx` using fake timers: three `run` calls within 400 ms give one
  call with the last args after 400 ms, `flush` calls at once, `cancel` drops the pending call, unmount drops it,
  and a changed callback is the one called.
- [x] 2.2 Add `src/lib/format.ts` (`formatNumber`, `formatPln`, `formatArea`, `formatIsoDate` as a local date);
  verify with `format.test.ts`: `200000` → `200,000`, `formatPln(500000)` → `500,000 PLN`, `formatArea(40)` →
  `40 m²`, `2024-12-31` → `12/31/2024` regardless of `TZ`.
- [x] 2.3 Add `renderWithRouter(ui, {path, previous})` to `src/test/render.tsx` (memory router, catch-all route,
  fresh query client with `retry: false`, returns the router) and the `hasPointerCapture`, `releasePointerCapture`
  and `scrollIntoView` stubs to `src/test/setup.ts`; verify the full existing suite still passes.

## 3. URL filter hook

- [x] 3.1 Add `src/features/filters/useFilters.ts` (`filters`, `setFilters`, `updateFilters`, `resetFilters`;
  required `history: 'replace' | 'push'`; memoised `filters`; preserved `sort`/`order`; no-op writes skipped);
  verify with `useFilters.test.tsx` via `renderWithRouter`: shared link parsed (parents filled), the spec example
  that drops `after_id`/`after_value` and keeps `sort`/`order` after the filters, reset keeps `sort`, `replace`
  leaves Back to the previous page while `push` makes Back restore the previous filters, an equal write does not
  navigate, and `filters` keeps identity when only `sort` changes.

## 4. Territory options

- [x] 4.1 Set `staleTime: Infinity` and `gcTime: Infinity` in `useTerritories` without changing its return type;
  verify `TerritoriesPreviewPage.test.tsx` still passes unchanged.
- [x] 4.2 Add `src/features/filters/territoryOptions.ts` (`buildTerritoryOptions`, cascade helpers
  `selectVoivodeship`/`selectPowiat`/`selectGmina`, `normalizeForSearch` / `matchesQuery`); verify with
  `territoryOptions.test.ts`: the spec's rows-to-levels example with Polish collation, rows without powiat/gmina,
  duplicate gmina names get `(code)` labels, powiats narrowed by voivodeship and all powiats without one, parent
  change clears children, same parent keeps children, child fills parents, clearing clears below, and `lodz`,
  `LÓDŹ` and `1061` match "Łódź" (`1061`).
- [x] 4.3 Add `src/features/filters/useTerritoryOptions.ts` (`status`, `options`, `nameOf(level, code)`, `refetch`);
  verify with a test that two components using it send one `GET /territories`, `nameOf` returns names after load,
  and returns the code while loading, after an error and for unknown codes.

## 5. UI primitives

- [x] 5.1 Add shadcn new-york `select.tsx`, `popover.tsx` and `checkbox.tsx` to `src/components/ui/` by hand on the
  `radix-ui` package (no CLI, no new dependency) and a `pickOption` keyboard helper in `src/test/select.ts`; verify
  with `select.test.tsx` that a select opened with the keyboard via `pickOption` calls `onValueChange` with the
  picked value, and that a `Checkbox` toggles `aria-checked` on click.
- [x] 5.2 Add `src/components/SearchableSelect.tsx` (Popover trigger with `role="combobox"`, filter input with
  `aria-activedescendant`, `role="listbox"`, "Any" first, "No matches", diacritics-insensitive match on label and
  code); verify with `SearchableSelect.test.tsx`: opening focuses the input, typing filters, ArrowDown + Enter
  picks and closes, "Any" calls `onChange(undefined)`, Escape closes and returns focus to the trigger, `disabled`
  cannot open, "No matches" for `zzz`.

## 6. Filter panel fields

- [x] 6.1 Add `src/features/filters/labels.ts` (market type, function and rows labels, `labelFor` with raw
  fallback) and `fields/DebouncedTextField.tsx` (local draft, parser, 400 ms commit with `replace`, Enter/blur
  flush, resync from the URL when nothing is pending, `aria-invalid` error and helper text via
  `aria-describedby`); verify with tests: three keystrokes within 400 ms write the URL once, Enter writes at once,
  an external URL change updates an idle input, an invalid draft is not written and shows its message, clearing
  removes the param, `labelFor` returns the raw value for unknown keys.
- [x] 6.2 Add `fields/RangeField.tsx` (price, area, floor) and `fields/DateRangeField.tsx`; verify with tests: `42,5`
  in area min writes `area_min=42.5`, `-1` in floor min writes `floor_min=-1`, `2.5` in floor shows "Enter a whole
  number", `abc` in price shows "Enter a number", `/?price_min=500000&price_max=100000` shows "Min is greater than
  max", a date typed in "From" writes `date_from` with `replace` history.
- [x] 6.3 Add `fields/RoomsField.tsx` (fieldset with checkboxes 1-4 and "5+") and `fields/RowsField.tsx` (popover
  checkbox list with summary); verify with tests: checking "2" and "5+" gives `rooms=2&rooms=5…rooms=10`,
  `/?rooms=2&rooms=7` shows "5+" checked and unchecking it leaves `rooms=2`, each change pushes history, "Clean"
  alone writes `exclusion_reason=clean` and shows "Clean only", two reasons show "2 selected", none shows
  "All rows".
- [x] 6.4 Add `fields/CategorySelectField.tsx` for market type and function (sentinel `__any__`, unlisted URL value
  as extra item); verify with tests: picking "Primary" writes `market_type=pierwotny` with push history, "Any"
  removes it, picking "Office" with the keyboard writes `function=biurowa`, `/?function=magazyn` shows `magazyn`.
- [x] 6.5 Add `fields/TerritoryField.tsx` (three `SearchableSelect`s wired to the cascade helpers, "Loading…" and
  disabled while loading with URL codes shown, "Could not load territories" + "Retry" on error, gmina disabled
  without powiat); verify with tests on mocked `GET /territories`: choosing a voivodeship after a full territory
  path leaves only `voivodeship_code` in one pushed entry, choosing a powiat with no voivodeship fills it, "Any" in
  powiat removes powiat and gmina, typing `lodz` lists "Łódź", the error state retries and then lists
  voivodeships, gmina is disabled without a powiat.

## 7. Panel and chips

- [x] 7.1 Add `src/features/filters/chips.ts` (`buildChips(filters, nameOf, fields)` with labels and `remove`);
  verify with `chips.test.ts`: the spec examples (mixed URL, run chip, territory names, one-sided ranges in
  `en-US`, category labels), order follows `FILTER_FIELDS`, removing a range clears both ends, "Rooms: 5+" removal
  clears all ≥ 5, territory removal clears lower levels, hidden fields give no chips.
- [x] 7.2 Add `src/features/filters/ActiveFilterChips.tsx` (`fields` prop, badges with "Remove <label>" buttons,
  "Reset all", `section aria-label="Active filters"` with `sr-only` "No active filters", focus after removal);
  verify with tests: removing the price chip leaves `/?rooms=2` as a pushed entry, "Reset all" on
  `/?city_name=Gdańsk&rooms=3&sort=price_premises` leaves `/?sort=price_premises`, no "Reset all" on `/`, removing
  the middle of three chips with Enter focuses the former third chip's button, removing the last chip focuses the
  section, `exclusion_reason` chip hidden when the rows field is not passed.
- [x] 7.3 Add `src/features/filters/FilterPanel.tsx` (`fields` and `className` props, fields in `FILTER_FIELDS`
  order, responsive grid 1/2/3/4 columns, `md:hidden` "Filters (n)" toggle with `aria-expanded`/`aria-controls`,
  content kept mounted); verify with `FilterPanel.test.tsx`: default renders all twelve labelled controls, the
  list without `rows` has no "Rows" control, `/?market_type=wtorny&price_min=300000` shows "Secondary" and
  `300000`, helper texts are linked to address, city and district, the toggle shows the chip count and flips
  `aria-expanded`, and a draft typed before collapsing is still there after expanding.

## 8. Integration checks

- [x] 8.1 Add a short "Filters" section to `README.md` (where the model and codec live, `useFilters` history
  option, preserved params, `fields`, how to add a filter key after `npm run api:types`); run `npm run build`,
  `npm run lint`, `npm test` and `npm run format:check` and verify all pass.
- [x] 8.2 Run `openspec validate filters-core --strict` and verify the change is valid.

## Workflow follow-up

- Manual check for the user (not done during apply, the agent has no browser): in `npm run dev`, mount the panel
  temporarily on the preview page and check it at 360px and desktop width (keyboard through every control, no
  horizontal scroll, territory search); then revert that edit so `git status` shows no change to
  `TerritoriesPreviewPage.tsx`.
- Review the artifacts and the running panel, then archive with `/opsx:archive filters-core`.
- `transactions-list` and `analytics` mount `FilterPanel` / `ActiveFilterChips` and pass `useFilters().filters`
  to their queries; `analytics` passes `fields` without `rows`.
