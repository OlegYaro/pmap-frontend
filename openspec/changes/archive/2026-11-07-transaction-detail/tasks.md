# Tasks

## 1. Data

- [x] 1.1 Add `useTransaction(id)` and a strict `parseTransactionId` in `src/features/transactions/`; verify with tests: valid id requests `/api/transactions/42` once, `abc`, `0`, `-1` and `4.5` are not requested, 404 ends without retries.

## 2. Page

- [x] 2.1 Add the detail components (field card, price/premises/location/source groups, value formatting with dashes, territory names with codes); verify with a component test for the three price levels, price per m², missing values and the "name (code)" rule.
- [x] 2.2 Add the "Source attributes" `details` section and the "Manual" badge; verify with tests for expand, null as a dash, no attributes and `source: manual`.
- [x] 2.3 Add `TransactionDetailPage` with the header (id, address, status badge), the "Back to the list" button, the skeleton, the not-found state and the error state with Retry; replace the placeholder in `src/app/pages.tsx`/`routes.tsx`; verify with page tests for each state and for Back (restores the list page after opening from page 2; a direct link goes to `/`).

## 3. Wrap-up

- [x] 3.1 Update `routes.test.tsx` for the new detail page, add a short "Transaction detail" note to `README.md`; run `npm run build`, `npm run lint`, `npm test`, `npm run format:check` and `openspec validate transaction-detail --strict`, and verify all pass.

## Workflow follow-up

- Check in the running app: open a row, read every group at 360px and on desktop, expand "Source attributes", use "Back to the list" from a filtered second page.
