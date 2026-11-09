# Design

## Context

`useTransactionList` is a `useInfiniteQuery` that appends pages and flattens them; `TransactionsPage` shows "N loaded"
and "Load more". The page content sits in a CSS `grid`, and grid items default to `min-width: auto`, so a table that
is wider than the container makes the whole column wider (nothing shrinks) and the table's own `overflow-auto` box
never scrolls. See proposal.md for the reason.

## Goals / Non-Goals

**Goals:**
- One page per request, fast Next/Previous/First, position kept across opening a transaction.
- The page keeps the content width at any table width.

**Non-Goals:**
- Counting rows, jumping to an arbitrary page, changing the columns.

## Decisions

- **Keyset cursors stay; the stack of visited cursors lives in the history entry.** The pages after the first are
  described by `pageCursors: ListCursor[]` (the cursor of page 2, 3, …) stored in `location.state`. The current page
  is the last cursor (or none) and the page number is `pageCursors.length + 1`. "Next" navigates to the same URL
  with the stack plus the cursor built from the shown page's last row (`replace`, so Back leaves the list instead of
  walking pages); "Previous" drops the last cursor; "First page" empties the stack. A change of filters or sort
  navigates to a new URL without `state`, so it starts at page 1 by itself. Going Back from the detail restores the
  entry with its state. Alternative: cursors in the query string; rejected, filter changes would have to know about
  them and the URL would carry opaque values. The state is validated when read (an array of objects with a numeric
  `after_id` and an optional string `after_value`); anything else counts as an empty stack.
- **`useQuery` per page.** The query key is the existing list key plus the current cursor; `placeholderData:
  keepPreviousData` keeps the old rows (dimmed through `isPlaceholderData`) while the next page loads, so the table does
  not flash. Navigation buttons are disabled while a page is fetching. `staleTime` 5 minutes and no refetch on focus stay.
- **Page size 50** (`PAGE_SIZE`), as the earlier screen used; "Next" is enabled when the page has exactly 50 rows.
  The empty page after a full one shows "No more rows" with "Previous" and "First page".
- **Footer** is a `TransactionsPager` component (rows range, page number, buttons). On a page change the table box
  is scrolled to its top (`scrollTo`) from a ref.
- **Layout fix.** The content grid uses a single `minmax(0, 1fr)` column and its cells get `min-w-0`, so only the
  table box scrolls sideways. The row count in the footer wraps on small screens.
- **Errors.** A page error replaces the table with `ErrorState` (Retry) and a "First page" button when not on page 1.
- **Tests.** Page tests are rewritten around the pager (requests carry `after_id` / `after_value`, Previous/First,
  state restored after Back, failed page, disabled while loading) and a layout test checks the grid classes.

## Risks / Trade-offs

- [`location.state` is lost when the URL is opened fresh in a new tab] → the page then starts at page 1, which is correct for a shared link.
- [A full last page gives one empty page] → handled by the "No more rows" state.
- [CSS-only fix cannot be measured in jsdom] → the layout is checked by class assertions and listed in the manual follow-up.
