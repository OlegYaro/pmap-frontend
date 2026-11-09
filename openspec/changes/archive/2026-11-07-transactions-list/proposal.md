# Proposal

## Why

The "Transactions" tab at `/` still shows the temporary territories preview, so the app cannot yet show the
data it exists for. The filter layer from `filters-core` is ready but no page fetches with it; this change puts
the transactions table on `/`, driven by the URL filters, and gives the next changes (`transaction-detail`,
`export`) a list to hang on.

## What Changes

- `/` becomes the transactions page: `PageHeader` "Transactions" with an empty actions slot reserved for the
  export control, `FilterPanel` (all fields) and `ActiveFilterChips` above the table.
- A table built with TanStack Table v8 (`@tanstack/react-table@^8.21`, new dependency) in manual sorting mode.
  Columns: date, address, city, district, price (PLN), area (m²), price per m² (computed on the client), rooms,
  floor, market type, status badge ("Clean" or the exclusion reason label). Missing values show "—".
- Server sorting kept in the URL (`sort`, `order`; default `transaction_date` `desc`). Clicking a sortable header
  switches the column or flips the direction and shows the direction icon. Any of the 14 API sort fields is
  accepted from a shared link.
- Data from `GET /transactions` through `useInfiniteQuery` with keyset paging (`limit=100`, next page built from
  the last row's `id` and sort value). No total: a "N loaded" counter and a "Load more" button that disappears
  when a page has fewer than 100 rows.
- States: skeleton rows while loading, empty state "No transactions match these filters" with a "Reset" button,
  error state with retry (for the first page and for "Load more").
- Sticky table header, horizontal scroll on narrow screens, row hover, keyboard-focusable rows. Clicking a row or
  pressing Enter on it opens `/transactions/:id` (still the placeholder until `transaction-detail`).
- **BREAKING** (internal): the territories preview page and its tests are deleted; `useTerritories` stays because
  the filters use it.

## Capabilities

### New Capabilities

- `transaction-sort`: the list sort (`sort`, `order`) read from and written to the URL, its defaults and validation.
- `transaction-list-paging`: the `GET /transactions` request built from filters and sort, keyset paging, the
  loaded counter and "Load more".
- `transactions-page`: the page at `/`: layout, table columns and formatting, sortable headers, row navigation,
  loading, empty and error states.

### Modified Capabilities

- `app-shell`: `/` is the transactions page instead of the territories preview; `/transactions/:id` stays a
  placeholder reached from a list row.
- `territories-preview`: all requirements removed; the capability is retired.

## Impact

- New dependency `@tanstack/react-table@^8.21` (v8 only; v9 has no `useReactTable`).
- New code in `src/features/transactions/` (pure helpers, the query hook, the table and the page) and a shadcn
  `table.tsx` primitive in `src/components/ui/`.
- `src/app/routes.tsx` and `src/app/routes.test.tsx` change; `src/features/territories/TerritoriesPreviewPage.tsx`
  and its test are deleted; `src/lib/format.ts` may gain a helper for missing values.
- Requests: `GET /transactions` only, public, no new endpoints; never more than one request per user action.
- Out of scope: the detail view, export, admin.
