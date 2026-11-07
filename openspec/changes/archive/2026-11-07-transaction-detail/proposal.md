# Proposal

## Why

A click on a row of the transactions list opens `/transactions/:id`, but that page only prints the id. The user cannot
read the transaction's values, the three price levels or the source attributes. The earlier admin screen showed every
field of a transaction in a card; the new page should do the same.

## What Changes

- `/transactions/:id` requests `GET /transactions/{id}` and shows the transaction in groups: Prices, Premises,
  Location and Source, plus a collapsed "Source attributes" list and a "Manual" badge for hand-entered records.
- The header shows the id, the address and a status badge ("Clean" or the exclusion reason); a "Back to the list"
  button returns to the list with its filters, sort and page.
- Loading skeleton, "Transaction not found" for a 404 or a bad id, and an error with "Retry" for other failures.
- Powiat and gmina are shown by name with the code, from the territory list that the filters already load.

Out of scope: editing (an admin feature of a later change), export, previous/next navigation between transactions.

## Capabilities

### New Capabilities
- `transaction-detail`: the content, formatting and states of the transaction page.

### Modified Capabilities
- `app-shell`: the `/transactions/:id` route shows the transaction instead of a placeholder with the id.

## Impact

- Code: `src/features/transactions/` (a detail hook, page and field components), `src/app/pages.tsx` and `routes.tsx`, tests.
- No dependency or API change; the endpoint is public.
