# Proposal

## Why

The transactions list grows with every "Load more": rows pile up in one long table and every earlier page is
requested again on a refetch. A previously working screen showed one page at a time with First/Next buttons, which
is easier to read and cheaper. In addition, a wide table pushes the page wider than the screen and one column sticks
out of its box instead of scrolling inside it.

## What Changes

- The list shows one page at a time: 50 rows per request, a footer with "Rows A–B", "Page N" and the buttons
  "First page", "Previous" and "Next". The backend gives no total, so "Next" is disabled after a short page.
- The page position is kept in the browser history entry, so Back from a transaction returns to the same page. A new
  filter or sort starts at page 1.
- A failed page shows the error with "Retry" and "First page".
- The table container can no longer widen the page: the page layout cells are allowed to shrink, so a wide table
  scrolls inside its own box.
- "Load more", the "N loaded" counter and appending of rows are removed.

Out of scope: a total row count, page-size selection, the detail page.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `transaction-list-paging`: page size 50, page navigation instead of "Load more", page position in history, failed page, restart rules.
- `transactions-page`: loading state without the counter and the load-more button; the table must not widen the page.

## Impact

- Code: `src/features/transactions/` (`useTransactionList`, `listQuery`, `TransactionsPage`, a pager component, tests).
- No dependency or API change.
