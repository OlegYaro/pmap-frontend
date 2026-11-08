# Proposal

## Why

Registry data has gaps and mistakes, and the only way to fix them is a database edit. The backend already lets an admin
add a transaction by hand (`POST /admin/transactions`) and correct one (`PATCH /admin/transactions/{id}`), but the UI has
no form for either: the admin "Transactions" tab is a placeholder and the transaction page has no edit action.

## What Changes

- Admin "Transactions" tab: a "New transaction" button opens a form dialog. Creating sends `POST /admin/transactions`;
  on success a toast links to the new transaction.
- Transaction page: admins get an "Edit" button that opens the same form, prefilled. Saving sends `PATCH
  /admin/transactions/{id}` with only the changed fields. An "Accept registry value" checkbox sends `accept_registry:
  true` and hands the record back to the registry data.
- One shared form: powiat (required) and gmina (optional) from the territory cascade, city, district, address, date,
  price, area, rooms, floor, market type, function, building id and status. A zod schema mirrors the backend limits;
  server 422 messages are shown on the matching fields.
- After a successful change the transaction list and the transaction detail are refetched.
- The Edit button and the create button are shown only to admins (the gateway enforces the role anyway).

## Capabilities

### New Capabilities
- `admin-transaction-form`: the shared form: fields, validation, territory cascade, server error mapping.
- `admin-transaction-create`: the admin Transactions tab and creating a transaction by hand.
- `admin-transaction-edit`: editing a transaction from its page, changed fields only, `accept_registry`.

### Modified Capabilities
- `admin-page`: the Transactions tab placeholder is replaced by the create control.
- `transaction-detail`: the header gets the admin-only "Edit" action.

## Impact

- Code: new `src/features/admin/transactions/` (form, schema, dialogs, mutations); `TransactionDetailPage.tsx` renders the
  Edit action; `TransactionsTab.tsx` is replaced.
- API: `POST /admin/transactions` (201, `TransactionResponse`) and `PATCH /admin/transactions/{id}` (200); both are typed
  in the generated schema, so no hand-written response types are needed.
- Dependencies: none (`react-hook-form`, `zod` and `@hookform/resolvers` are installed).
