# Proposal

## Why

Both data pages reserve an empty export slot, and the backend can already build a CSV of the filtered
transactions (`POST /exports`, then `GET /exports/{id}`), but only for logged-in users. Without the button
users cannot take the data they filtered out of the app, and the "locked" look for anonymous users, built for
exactly this action, is still unused.

## What Changes

- Add an "Export CSV" button to the header of the transactions page and the analytics page.
- Anonymous users see it locked ("Log in to export"); clicking opens the login dialog and never starts an
  export by itself after login.
- A logged-in click starts an export with the current filters (never sort, limit or paging), polls its status
  every 2 s (5 s after 30 s, giving up after 10 min), shows "Preparing export..." with a spinner, downloads the
  file when it is done and shows an error toast when it fails or times out.
- Only one export runs at a time per button; leaving the page stops polling.
- On the analytics page the tooltip states that the export contains the transactions matching the current filters.
- The response of `GET /exports/{id}` is typed loosely in the OpenAPI document, so its shape is declared in the
  feature and checked at the boundary.

## Capabilities

### New Capabilities
- `csv-export`: starting a CSV export of the filtered transactions, following it to completion, and the export
  button's states.

### Modified Capabilities
- `transactions-page`: the header export slot now holds the export button.
- `analytics-page`: the header export slot now holds the export button.

## Impact

- Code: new `src/features/export/` (hook, button, response schema); `TransactionsPage.tsx` and
  `AnalyticsPage.tsx` render the button in the existing slot.
- API: `POST /exports` (202, body `{id}`) and `GET /exports/{id}`, both requiring a token; the existing client
  refreshes an expired token once.
- Dependencies: none (zod, sonner and lucide-react are already installed).
- Specs: one new capability, two modified.
