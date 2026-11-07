# Design

## Context

- See proposal.md (Why). Requirements live in the delta specs: `transaction-sort`, `transaction-list-paging`,
  `transactions-page`, plus the `app-shell` and `territories-preview` deltas.
- API (`src/api/schema.d.ts`, `list_transactions_transactions_get`): the 19 filter keys plus `limit`, `sort` (a
  union of 14 field names), `order` (`asc | desc`), `after_value: string | null`, `after_id: number | null`. The
  response is `TransactionResponse[]` with no total. Verified backend facts (docs/frontend-plan.md, section 1):
  `limit` 1..1000; rows whose sort value is null come last; `after_value` is ignored without `after_id`; unknown
  query params give 422; `GET /transactions` is public.
- `openapi-fetch` serializes arrays as repeated keys (`rooms=2&rooms=3`) and skips `undefined`, which matches
  `serializeFilters`. `TransactionFilters` is already asserted assignable to the list query type (`model.ts`).
- `useFilters()` returns a memoised `filters`, keeps only `sort` and `order` of the other params on a filter
  change, and offers `resetFilters()` (one pushed entry). Nothing reads `sort`/`order` yet.
- `FilterPanel` and `ActiveFilterChips` are layout-agnostic and bound to the URL; the panel collapses itself below
  `md`. `labels.ts` has `MARKET_TYPE_LABELS`, `EXCLUSION_REASON_LABELS` and `labelFor()` (raw fallback).
- Shared UI: `PageHeader` (renders the actions box only when `actions` is truthy), `EmptyState`, `ErrorState`
  (`message`, `onRetry`, `retrying`), `TableSkeleton` (`rows`, `columns`, one "Loading" status), shadcn `badge`
  and `button`. There is no `ui/table.tsx` yet. `src/lib/format.ts` has `formatNumber`, `formatPln`,
  `formatArea`, `formatIsoDate`.
- The shared query client retries 5xx twice, never 4xx, `staleTime` 30 s. Tests use `retry: false`.
- `TerritoriesPreviewPage` is mounted at `/` and is the only user of the `territories-preview` spec;
  `useTerritories` is also used by `useTerritoryOptions` and stays. `routes.test.tsx` and `App.test.tsx` wait for
  "No territories." and must move to the new page.
- `@tanstack/react-table` is not installed. Only v8 fits (`useReactTable` is gone in v9); 8.21 was checked to build
  with TS 7 / Vite 8 / React 19.
- oxlint `react/only-export-components`: components, hooks and constants live in separate files.

## Goals / Non-Goals

**Goals:**
- All URL and paging logic in pure, unit-tested functions; the page and the hook stay thin.
- Never a request the backend rejects, and exactly one request per user action (open, sort, filter commit, "Load
  more", retry).
- A list module the next changes extend without rework: `transaction-detail` reads the loaded rows for
  previous/next, `export` fills the header slot.

**Non-Goals:**
- Infinite scroll on reaching the bottom (explicit "Load more" only), virtualised rows, column hiding or resizing,
  client-side sorting, multi-column sort.
- Sorting by price per m² or status (not API sort fields).
- Keeping the previous rows on screen while a new filter or sort loads.

## Decisions

### Module layout

```
src/features/transactions/
  sort.ts               SORT_FIELDS (14, type-checked against the API), DEFAULT_SORT, ListSort {field, order},
                        parseSort(params), writeSort(params, sort), nextSort(current, field)   + sort.test.ts
  useSort.ts            { sort, setSort } on useSearchParams (push, no-op when equal)          + useSort.test.tsx
  listQuery.ts          PAGE_SIZE = 100, ListCursor, buildListQuery(filters, sort, cursor),
                        nextCursor(lastPage, sort), listQueryKey(filters, sort)                + listQuery.test.ts
  useTransactionList.ts useInfiniteQuery wrapper; returns rows (flattened) and query state
  cells.ts              pricePerM2(row), statusOf(row) -> {kind: 'clean'|'excluded', label}    + cells.test.ts
  columns.tsx           ColumnDef<TransactionRow>[] with meta {sortField?, align}
  TransactionsTable.tsx table, sortable header buttons, focusable rows
  TransactionsPage.tsx  page composition and states                                           + TransactionsPage.test.tsx
src/components/ui/table.tsx   shadcn-style Table primitives (no built-in scroll wrapper, see below)
src/test/transactions.ts      transactionRow(overrides), transactionPage(count, firstId), stubApi(handlers)
```

`TransactionRow` is `components['schemas']['TransactionResponse']`.

### Sort lives in the URL next to the filters

`parseSort` validates `sort` and `order` independently (unknown → `transaction_date` / `desc`). `writeSort`
copies the current params, removes `sort`/`order`, and appends them after the filters only when they differ from
the defaults (`sort` omitted for `transaction_date`, `order` omitted for `desc`), so the default URL stays `/` and
the canonical order matches what `useFilters` produces (filters first, then `sort`, `order`). `useSort` pushes a
history entry (a header click is a discrete choice, like a select) and skips the write when the sort is unchanged.
`SORT_FIELDS` gets the same `Exact<>` compile-time assertion as `model.ts` against
`NonNullable<query['sort']>`.

Alternative considered: a separate sort key in `useFilters`. Rejected: filters are shared with analytics and
export, which must never send `sort`.

### Header click uses our own `nextSort`, TanStack only for the column model

`useReactTable` runs with `manualSorting: true`, `getCoreRowModel()` only, and `state.sorting` derived from the URL
sort (`[{id: field, desc}]` when a column has that field, otherwise `[]`), so `column.getIsSorted()` drives the
icon and `aria-sort`. The header button calls `setSort(nextSort(sort, field))`: same field flips the order, another
field starts `asc`. Alternative: TanStack's `getToggleSortingHandler` + `onSortingChange`. Rejected: its first
direction depends on the first row's value type (`sortDescFirst` auto) and it can cycle to "unsorted", which the
server has no notion of; a pure function is deterministic and unit-tested. Column ids equal API sort fields for
the nine sortable columns; "Price/m²" and "Status" have `enableSorting: false` and plain header text.

### Keyset paging with `useInfiniteQuery`

- Query key: `['transactions', 'list', serializeFilters(filters).toString(), sort.field, sort.order]`. The filter
  string is canonical, so equal filters share a cache entry.
- `pageParam` shape: `ListCursor | null`, `initialPageParam: null`. `ListCursor = {after_id: number, after_value?:
  string}`.
- `queryFn`: `api.GET('/transactions', {params: {query: buildListQuery(filters, sort, pageParam)}, signal})`.
  `buildListQuery` returns `{...filters, sort: sort.field, order: sort.order, limit: PAGE_SIZE, ...cursor}`; it never
  adds other keys.
- `getNextPageParam: (lastPage) => nextCursor(lastPage, sort)`: `undefined` when `lastPage.length < PAGE_SIZE`;
  otherwise `{after_id: last.id}` plus `after_value` = the last row's value of `sort.field` as a string (strings as
  is, numbers via `String()`), left out for `sort.field === 'id'` or a null value.
- `staleTime: 5 min` and `refetchOnWindowFocus: false` for this query. A refetch of an infinite query re-requests
  every loaded page in sequence; data changes only after a sync run, so silent multi-request refetches on focus
  are not worth the burst (gateway: 20 req/s) or the rows jumping under the user.
- No `placeholderData`: a new key shows skeleton rows. Keeping old rows under new headers would be misleading.
- "Load more" calls `fetchNextPage()` only when `hasNextPage && !isFetchingNextPage` (TanStack also dedupes); the
  button is disabled while `isFetchingNextPage`.

### Page states

| Condition                                   | Shown                                                                 |
| ------------------------------------------- | --------------------------------------------------------------------- |
| `isPending`                                 | `TableSkeleton rows={10} columns={11}`                                 |
| `isError && !data`                          | `ErrorState` "Could not load transactions: <message>", retry `refetch` |
| `data` with 0 rows                          | `EmptyState` "No transactions match these filters", "Reset" if any filter |
| rows                                        | table, then footer: "N loaded" (`aria-live="polite"`), "Load more"    |
| `isFetchNextPageError`                      | rows stay; footer `ErrorState` "Could not load more transactions: …", retry `fetchNextPage` |

A failed background refetch with data present keeps the rows and shows nothing extra (rare given the settings
above).

### Layout, sticky header and scrolling

`PageHeader title="Transactions" actions={<div data-slot="export-action" />}` gives the export change a named
place; the empty `div` takes no space. Below it: `FilterPanel` (default fields), `ActiveFilterChips`, then the
table section. A `thead` with `position: sticky` sticks to its nearest scroll container, and any `overflow-x`
container becomes one, so the table sits in one container with `overflow: auto` and a max height (about
`calc(100svh - 12rem)`, at least `24rem`): it scrolls both ways and the header stays visible inside it. This is
why `ui/table.tsx` omits shadcn's inner `overflow-x-auto` wrapper; the page owns the scroll box. Cells use
`whitespace-nowrap`, numbers are right-aligned with `tabular-nums`, the address column has a max width with
`truncate` and a `title`. The `thead` gets a solid background and `z-10`.

### Rows and navigation

Each `tr` has `tabIndex={0}`, `onClick` and `onKeyDown` (Enter only, ignored when the event comes from a child)
→ `navigate('/transactions/' + id)` (push), plus hover and `focus-visible` ring classes. Screen readers read the
cells as usual; there is no link inside the row, so each row is a single tab stop. Back returns to `/` with the
same URL; the loaded pages come back from the query cache (5 min `gcTime`).

### Cell formatting

`src/lib/format.ts` gains `EMPTY = '—'` and `orEmpty(value, format)`; cells use `formatIsoDate`, `formatPln`,
`formatArea`, `formatNumber`, `labelFor(MARKET_TYPE_LABELS, …)`. `pricePerM2(row)` returns
`Math.round(price / area)` or `null` (missing values or `area <= 0`). `statusOf(row)`: null `exclusion_reason` →
`{kind: 'clean', label: 'Clean'}`, else `{kind: 'excluded', label: labelFor(EXCLUSION_REASON_LABELS, reason)}`. The
badge uses `variant="secondary"` for clean and `"outline"` with muted text for excluded, with `data-status` set to
the kind for tests.

### Removing the territories preview

Delete `TerritoriesPreviewPage.tsx` and its test; `routes.tsx` mounts `TransactionsPage` at the index route.
`useTerritories.ts` stays in `src/features/territories/` (moving it is churn without benefit).

### Tests

- Pure: `sort.test.ts`, `listQuery.test.ts`, `cells.test.ts`.
- Hook: `useSort.test.tsx` via `renderWithRouter`.
- Table: `TransactionsTable.test.tsx` renders the table alone with fixture rows and spy callbacks.
- Page: `TransactionsPage.test.tsx` via `renderWithRouter(<TransactionsPage />)` (memory router, so the URL and a
  row navigation can be read from `router.state.location`), HTTP through `stubFetch` with a path router in
  `src/test/transactions.ts` (`/api/territories` → `TERRITORIES`, `/api/transactions` → per-test handler) and
  `callsTo(mock, '/api/transactions')` to assert query params. Mounting at `/` is covered by `routes.test.tsx`.
- `routes.test.tsx` and `App.test.tsx` switch their home-route assertions to the transactions page.

## Risks / Trade-offs

- [The table scroll box makes two vertical scrollbars on short screens] → the max height leaves room for the
  filters; checked manually at 360px and desktop width (Workflow follow-up).
- [A last page with exactly 100 rows shows one extra "Load more" that returns nothing] → accepted; the
  button disappears after the empty page (spec scenario).
- [`after_value` string form for floats: `String(455000.5)` is `455000.5`, but very large or tiny numbers would
  use exponent notation] → prices, areas, rooms and floors are far from that range; covered by a unit test for the
  normal forms.
- [Rows are `tr` elements with `tabIndex`, not links, so middle-click / open in new tab does not work] → accepted
  for now; the detail becomes a side sheet in `transaction-detail`, which can revisit this.
- [Deep paging keeps all loaded pages in memory and re-renders them] → 100 rows per click; virtualisation is a
  later concern if users load thousands of rows.

## Migration Plan

Front-end only, no data migration. Rollback is reverting the change; the territories preview comes back with it.
