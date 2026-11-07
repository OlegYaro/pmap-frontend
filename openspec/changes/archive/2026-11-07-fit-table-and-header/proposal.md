# Proposal

## Why

Checked in a browser: at 1280px the transactions table is 1346px wide in a 1230px container, so the "Status" column is
cut off at the right edge, and the Market column shows the raw stored value `rynekWtorny`. At 360px the top bar is
447px wide, so the login button and the theme toggle leave the screen and the whole page scrolls sideways.

## What Changes

- The table columns are made compact so all eleven fit a 1280px screen: tighter cell padding and a shorter address
  column; narrower screens keep scrolling inside the table's own box.
- Market shows "Primary" / "Secondary" for both stored spellings (`pierwotny` / `rynekPierwotny`,
  `wtorny` / `rynekWtorny`), which also shortens the column.
- The top bar fits 360px: the brand and the login button show only their icons below the `sm` breakpoint.

Out of scope: sorting speed of the backend, the Function labels, the filter panel layout.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `transactions-page`: market labels for both spellings; columns fit a 1280px screen.
- `app-shell`: the header fits a 360px screen.

## Impact

- Code: `src/features/filters/labels.ts`, `src/features/transactions/columns.tsx`, `TransactionsTable.tsx`, `src/app/RootLayout.tsx`, `src/auth/AccountControl.tsx`, tests.
- No dependency or API change.
