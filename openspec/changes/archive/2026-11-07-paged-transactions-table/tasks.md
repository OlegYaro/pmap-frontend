# Tasks

## 1. Paging logic

- [x] 1.1 Set `PAGE_SIZE` to 50 and add `readPageCursors(state)` (validates `location.state`) in `listQuery.ts`; verify with unit tests: valid stack, junk state, missing state.
- [x] 1.2 Replace the infinite query in `useTransactionList.ts` with a `useQuery` for the current page (key = list key + cursor, `keepPreviousData`) and expose `page`, `rows`, `hasNext`, `goNext`, `goPrevious`, `goFirst` that navigate with `pageCursors` in `location.state` (replace); verify with hook tests: first page without cursor, Next request has `after_id`/`after_value`, Previous and First, a filter change starts at page 1, state is restored after Back.

## 2. Page UI

- [x] 2.1 Add `TransactionsPager` (rows range, "Page N", "First page", "Previous", "Next", disabled while fetching) and wire it into `TransactionsPage`, remove "Load more" and the "N loaded" counter, scroll the table box to the top on page change; verify with component tests for the footer texts and button states.
- [x] 2.2 Handle the empty later page ("No more rows" with Previous/First page) and the failed page (error with Retry and First page); verify with page tests for both.
- [x] 2.3 Rewrite the paging tests in `TransactionsPage.test.tsx` (second page, Previous, First page, Back from detail keeps the page, disabled while loading, filter change returns to page 1); verify they pass.

## 3. Layout

- [x] 3.1 Make the page grid a single `minmax(0, 1fr)` column with `min-w-0` cells and keep the table in its own scroll box; verify with a test asserting these classes and with `npm run build`.

## 4. Wrap-up

- [x] 4.1 Update the "Transactions list" section of `README.md`; run `npm run build`, `npm run lint`, `npm test`, `npm run format:check` and `openspec validate paged-transactions-table --strict`, and verify all pass.

## Workflow follow-up

- Check in the running app at 360px and at desktop width: no column sticks out of the table box and the page has no horizontal scroll; Next/Previous work; Back from a transaction returns to the same page.
