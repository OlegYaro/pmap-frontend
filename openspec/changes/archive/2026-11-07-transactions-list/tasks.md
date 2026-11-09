# Tasks

Every task ends with a passing `npm run build`, `npm run lint` and `npm test`. HTTP in tests goes through
`src/test/http.ts`; tests use `fireEvent` (no `user-event`). The test locale is `en-US`. New files go in
`src/features/transactions/` unless stated otherwise (see design.md, Module layout).

## 1. Dependency, primitives and fixtures

- [x] 1.1 Install `@tanstack/react-table@^8.21` (v8, not v9) as a dependency; verify `npm ls @tanstack/react-table`
  prints an 8.21.x version, `package.json` has `^8.21`, and `npm run build` passes.
- [x] 1.2 Add `src/components/ui/table.tsx` (shadcn new-york styles: `Table`, `TableHeader`, `TableBody`, `TableRow`,
  `TableHead`, `TableCell`, with `data-slot` attributes) where `Table` renders a bare `<table>` without shadcn's
  inner scroll wrapper; verify with a case in `src/components/ui/primitives.test.tsx` that the parts render as
  `table` / `rowgroup` / `row` / `columnheader` / `cell` roles and that the `table` element is a direct child of
  the render container (no wrapper).
- [x] 1.3 Add `src/test/transactions.ts`: `transactionRow(overrides)` (a full `TransactionResponse` with id, date,
  price, area and the rest set), `transactionPage(count, firstId)` (rows with ascending ids and distinct values),
  and `stubApi({transactions})` that routes `/api/territories` to `TERRITORIES` and `/api/transactions` to the
  handler (defaults to `[]`) via `stubFetch`; verify `npm run build` type-checks the fixtures against
  `components['schemas']['TransactionResponse']`.

## 2. Sort in the URL

- [x] 2.1 Add `sort.ts`: `SORT_FIELDS` (14) with an `Exact<>` compile-time check against
  `NonNullable<list query['sort']>`, `SortOrder`, `ListSort`, `DEFAULT_SORT` (`transaction_date`, `desc`),
  `parseSort(params)`, `writeSort(params, sort)` and `nextSort(current, field)`; verify with `sort.test.ts`: the
  `transaction-sort` spec examples (default, `price_premises asc`, `updated_at` with default order, `sort=price&
  order=up` → default), `writeSort` keeps filter params and emits `sort`/`order` after them, omits default values
  (`?rooms=2&sort=price_premises&order=asc` back to `?rooms=2`), and `nextSort` flips the same field and starts
  another field `asc`; also check that temporarily adding a bogus field to `SORT_FIELDS` makes `tsc -b` fail (then
  remove it).
- [x] 2.2 Add `useSort.ts` (`{sort, setSort}` on `useSearchParams`, push history, `preventScrollReset`, no write when
  equal); verify with `useSort.test.tsx` via `renderWithRouter`: setting `price_premises asc` on `/?rooms=2` gives
  `?rooms=2&sort=price_premises&order=asc`, Back restores `/?sort=rooms&order=asc` after a flip, setting
  `rooms desc` on `/?sort=rooms` does not change the history length, and a later filter change through
  `useFilters` keeps the written `sort`/`order`.

## 3. List query and keyset paging

- [x] 3.1 Add `listQuery.ts`: `PAGE_SIZE = 100`, `ListCursor`, `buildListQuery(filters, sort, cursor)`,
  `nextCursor(lastPage, sort)` and `listQueryKey(filters, sort)`; verify with `listQuery.test.ts`: filters + sort +
  `limit: 100` and nothing else for the first page, cursor keys added for later pages, the four cursor examples of
  the `transaction-list-paging` spec (date, `455000.5`, null `district_name`, `sort=id`), `undefined` for a page of
  37 rows and for an empty page, a cursor for a page of 100 rows, and equal keys for equal filters written in a
  different order.
- [x] 3.2 Add `useTransactionList.ts` (`useInfiniteQuery` with the key from `listQueryKey`, `initialPageParam: null`,
  `queryFn` through `api.GET('/transactions')` with the abort `signal`, `getNextPageParam` from `nextCursor`,
  `staleTime` 5 min, `refetchOnWindowFocus: false`; returns flattened `rows` plus the query state); verify with
  `useTransactionList.test.tsx` (a small probe component under `renderWithRouter` and `stubApi`): one request on
  mount with the expected params, `fetchNextPage` after a 100-row page sends `after_id`/`after_value` of the last
  row, `hasNextPage` is false after a 37-row page, and a changed filter sends a request without `after_id`.

## 4. Cell values

- [x] 4.1 Add `EMPTY = '—'` and `orEmpty(value, format)` to `src/lib/format.ts`; verify with cases in
  `format.test.ts`: `null` and `undefined` give `—`, `0` is formatted (not `—`), a string goes through `format`.
- [x] 4.2 Add `cells.ts` with `pricePerM2(row)` (rounded, `null` for missing price or area or area ≤ 0) and
  `statusOf(row)` (`clean` / `excluded` with the label from `EXCLUSION_REASON_LABELS`, raw fallback); verify with
  `cells.test.ts`: `455000 / 38.5` → `11818`, missing area, area `0`, null reason → "Clean", `package_deal` →
  "Package deal", `duplicate` → "duplicate".

## 5. Table component

- [x] 5.1 Add `columns.tsx` (eleven `ColumnDef`s in spec order, ids equal to API sort fields for the nine sortable
  columns, `enableSorting: false` for "Price/m²" and "Status", `meta.align` for numeric columns, cells via
  `orEmpty`, `formatIsoDate`, `formatPln`, `formatArea`, `formatNumber`, `labelFor(MARKET_TYPE_LABELS)`, status
  `Badge` with `data-status`) and `TransactionsTable.tsx` (`useReactTable` with `manualSorting`,
  `getCoreRowModel`, `state.sorting` from the URL sort; props `rows`, `sort`, `onSortChange(sort)`,
  `onOpen(id)`; sortable headers are buttons with an arrow icon and `aria-sort` on the `th`; rows with
  `tabIndex={0}`, click and Enter; sticky `thead` inside an `overflow-auto` box with a max height); verify with
  `TransactionsTable.test.tsx`: the eleven headers in order, the formatted row and missing-values examples of the
  `transactions-page` spec, the price-per-m² cell `11,818 PLN`, the three status badges with different
  `data-status`, "Price/m²" and "Status" are not buttons, "Date" has `aria-sort="descending"` by default and no
  column is sorted for `updated_at`, clicking "Date" calls `onSortChange` with `asc`, clicking "Price" calls it
  with `price_premises asc`, and click / Enter on a row call `onOpen(42)`.

## 6. Transactions page at `/`

- [x] 6.1 Add `TransactionsPage.tsx`: `PageHeader` "Transactions" with `actions={<div data-slot="export-action" />}`,
  `FilterPanel`, `ActiveFilterChips`, then the states of the design table (skeleton 10×11, first-page error,
  empty with "Reset" only when a filter is active, rows with "N loaded" in an `aria-live` region and "Load more",
  next-page error with retry); `onOpen` navigates to `/transactions/<id>`; verify with
  `TransactionsPage.test.tsx` via `renderWithRouter(<TransactionsPage />)` and `stubApi`: layout order and an
  empty export slot, request params for `/?powiat_code=0264&rooms=2&rooms=3&sort=price_premises&order=asc` and
  for `/` (exact key sets via `callsTo`), skeleton and no rows while pending, clicking "Price" updates the URL and
  sends a new request with `sort=price_premises&order=asc`, "Load more" after 100 rows sends the last row's
  `after_id`/`after_value`, shows "120 loaded" and hides the button after 20 more rows, the button is disabled
  while the next page is held with `deferred`, removing a chip after two pages sends a request without
  `after_id`, empty with filters plus "Reset" leaves `?sort=rooms`, empty without filters has no "Reset", a 422
  `{"detail": "Invalid sort"}` shows the alert and "Retry" recovers, a 502 on the next page keeps the 100 rows
  and "Retry" resends the same `after_id`, and a row click leads to `/transactions/42`.
- [x] 6.2 Mount `TransactionsPage` at the index route in `src/app/routes.tsx`, delete
  `src/features/territories/TerritoriesPreviewPage.tsx` and its test (keep `useTerritories.ts`), and move the
  home-route assertions in `src/app/routes.test.tsx` and `src/App.test.tsx` from "No territories." to the
  transactions page (heading "Transactions", then "No transactions match these filters"); add a routes test that
  clicking a row on `/` shows the detail placeholder with its id and Back returns to `/` with the same search;
  verify `grep -r TerritoriesPreview src` finds nothing and the whole suite passes (including the `RequireAdmin`
  redirect to `/`).
- [x] 6.3 Add a short "Transactions list" section to `README.md` (module location, sort params and defaults,
  keyset paging rules and `PAGE_SIZE`, the `export-action` slot for the export change) and remove any mention of
  the territories preview; verify the section matches the code by reading it against `sort.ts` and
  `listQuery.ts`.

## 7. Integration checks

- [x] 7.1 Run `npm run build`, `npm run lint`, `npm test` and `npm run format:check` and verify all pass.
- [x] 7.2 Run `openspec validate transactions-list --strict` and verify the change is valid.

## Workflow follow-up

- Manual check for the user (the agent has no browser): with `npm run dev` against a real backend, open `/` at
  360px and at desktop width; check the table scrolls sideways inside its box and the page does not, the header
  row stays visible while scrolling the rows, the filter panel collapses on mobile, rows can be reached with Tab
  and opened with Enter, the sort icons follow header clicks, "Load more" appends rows, and the light and dark
  themes both read well.
- Check in the browser's network panel that one action sends one `GET /api/transactions` and no request is
  rejected with 422.
- Review the artifacts and the running page, then archive with `/opsx:archive transactions-list`.
- `transaction-detail` turns `/transactions/:id` into a side sheet over this list and uses the loaded rows for
  previous/next; `export` fills the `export-action` slot.
