# Design

## Context

- `POST /admin/transactions` takes `TransactionCreate` and answers 201 `TransactionResponse`; `PATCH
  /admin/transactions/{id}` takes `TransactionUpdate` (the same optional fields plus `accept_registry`, default false) and
  answers 200 `TransactionResponse`. Both are typed in the generated `schema.d.ts`; the backend validates `powiat_code`
  `^\d{4}$`, `gmina_code` `^\d{7}$`, `price_premises > 0`, `area_usable > 0`, `rooms >= 1` and uses `extra="forbid"`.
  Extraction applies `exclude_unset`, so a key sent as `null` clears the value and an omitted key keeps it.
- Manual records get ids shaped like `manual-<uuid>` and `attributes.source = "manual"`; any PATCH marks a record manual, and
  `accept_registry` removes the mark (so later syncs may overwrite it).
- `TransactionDetailPage` shows the header actions (`StatusBadge`, "Manual" badge, back button); `useTransaction(id)` has the
  query key the edit must invalidate. The list queries share the key prefix `['transactions', 'list', ...]`.
- Reusable: `Dialog`, `SearchableSelect`, `useTerritoryOptions` (powiat list, gminas by powiat), `Select`, `Checkbox`, `Input`,
  `Label`, `MARKET_TYPE_LABELS`, `FUNCTION_LABELS`, `EXCLUSION_REASON_LABELS`, `ApiError` (carries the 422 `detail` list),
  `sonner`, `react-hook-form` + `zod` + `@hookform/resolvers`, `useAuth().isAdmin`.
- `AdminPage` (previous change) renders `TransactionsTab` as a placeholder.

## Goals / Non-Goals

**Goals:**
- One form component for create and edit; the difference is only the initial values and how the payload is built.
- Payload builders as pure functions, so "only changed fields" and "omit empty" are unit-tested without rendering.

**Non-Goals:**
- Deleting transactions, bulk edit, editing the `attributes` object, or showing an edit history.
- Optimistic updates: the data is refetched after the server confirms.

## Decisions

**Form state is strings; payload builders convert.** `react-hook-form` holds every input as a string (the select values and
inputs are strings, the gmina/powiat codes are strings). A zod schema validates the strings (trim; digits patterns for
codes; `price`/`area` parsed as positive numbers; `rooms` a whole number ≥ 1; `floor` a whole number; `date` a real calendar
date) and `FormValues` is `z.infer` of the input type. Pure functions `toCreateBody(values)` and `toUpdateBody(values,
initial, acceptRegistry)` produce the request bodies: empty strings are omitted on create; on update a field is included
when its normalised value differs from the initial one, and an emptied non-empty field becomes `null`. `initialFromTransaction
(transaction)` produces the string values. Alternative: keep numbers in form state. Rejected: it makes "empty vs 0" and
half-typed input awkward and complicates the diff against the initial values.

**Server errors.** `ApiError` exposes the 422 `detail` entries (`loc`, `msg`). A helper maps `loc[1]` (after `body`) to a form
field name through the API-name→field table (`area_usable` → `area`, `price_premises` → `price`, `powiat_code` → `powiat`,
...) and calls `setError(field, { type: 'server', message })`; unmatched messages join a form-level error. A 404 on update sets
the form-level error "This transaction no longer exists". Alternative: show every server message at the top. Rejected: the
spec requires field-level messages and they are cheap to map.

**Cascade and selects.** Powiat and gmina use `SearchableSelect` with `useTerritoryOptions()`; the powiat `onChange` resets
gmina. If a prefilled code is missing from the list (list still loading or unknown) it is shown as the raw code and kept.
Market, Function and Status use the shadcn `Select` with a leading "—" choice (Radix does not allow an empty-string value, so
the form maps the sentinel `__none__` to `''`). Extra choice: when the stored value is not among the known ones, it is appended
as its own option with the raw text (market via `labelFor`).

**Dialog and layout.** One `TransactionFormDialog({ title, initial, onSubmit, mode, open, onOpenChange })` renders a two-column
grid from `sm` up and one column below, inside a `DialogContent` with `max-h` and internal scroll. The form-level error uses
`role="alert"`. On submit failure RHF's `shouldFocusError` moves focus to the first invalid field; for the server errors the
first errored field is focused explicitly.

**Mutations.** `useCreateTransaction()` and `useUpdateTransaction(id)` wrap `api.POST('/admin/transactions')` and
`api.PATCH('/admin/transactions/{transaction_id}')` in `useMutation`. On success both invalidate `['transactions', 'list']`;
update also invalidates the detail key. Create shows `toast.success` with an action "View transaction" navigating to the new
id (sonner `action`). The headers `x-actor-role` of the generated types are set by the gateway and are not sent by the app.

**Edit button.** `TransactionDetailPage` adds `<EditTransactionButton transaction={...}/>` to the header actions when
`useAuth().isAdmin`. The button owns the dialog state, which keeps the page component unchanged otherwise. Not rendered in the
loading, error and not-found branches (they return before the loaded header).

**Transactions tab.** `TransactionsTab` shows a short description and a "New transaction" button that opens the dialog.

**Files**: `src/features/admin/transactions/{formSchema.ts, payload.ts, serverErrors.ts, TransactionFormDialog.tsx,
TransactionFormFields.tsx, useTransactionMutations.ts, CreateTransaction.tsx}` and `src/features/transactions/
EditTransactionButton.tsx`, each with tests; `TransactionsTab.tsx` is replaced.

## Risks / Trade-offs

- [Clearing a value by emptying a field is easy to do by accident] → the payload shows it only on submit; the dialog keeps the
  input until saved and Cancel discards.
- [Select value spellings differ in stored data] → unknown stored values stay selectable, so editing another field never
  silently rewrites the market type.
- [A powiat missing from the territory list] → the raw code stays valid; the pattern check still applies.
- [Gateway enforces the role, not the UI] → hiding the buttons is convenience only; a 403 shows as a form-level error.
- [Large form on a phone] → single column below `sm`, scroll inside the dialog, 360 px checked by the class layout.
