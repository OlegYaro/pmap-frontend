# Tasks

## 1. Form model and payloads

- [x] 1.1 Create `src/features/admin/transactions/formSchema.ts` (zod schema over string inputs: powiat required `^\d{4}$`, gmina `^\d{7}$`, positive price and area, whole rooms ≥ 1, whole floor, real calendar date, trimmed text, status from the known reasons) and `FormValues`; verify with `formSchema.test.ts` (each rule valid and invalid, 29 Feb on a leap and a non-leap year, trimming)
- [x] 1.2 Create `payload.ts` with `initialFromTransaction`, `toCreateBody` and `toUpdateBody` (only changed fields, emptied value → `null`, status Clean → `exclusion_reason` null, `accept_registry` only when true); verify with `payload.test.ts` covering every scenario of the create and edit specs (minimal, full, excluded status, one field changed, field cleared, nothing changed, flag only, flag with change)
- [x] 1.3 Create `serverErrors.ts` mapping 422 `detail` locations to form fields and a form-level message list; verify with `serverErrors.test.ts` (known field, unknown location, non-422 error, 404 text)

## 2. Mutations

- [x] 2.1 Create `useTransactionMutations.ts` (`useCreateTransaction`, `useUpdateTransaction(id)`; invalidate the list keys, the update also the detail key); verify with `useTransactionMutations.test.tsx` (request body and path, 201 and 200 handling, 422 and 404 propagate as `ApiError`, invalidation refetches the list and the detail)

## 3. The form dialog

- [x] 3.1 Create `TransactionFormFields.tsx` and `TransactionFormDialog.tsx` (labelled fields in spec order, territory cascade with gmina reset, selects with empty choice and preserved unknown values, validation messages with `aria-invalid`, focus on the first invalid field, form-level `role="alert"`, pending state, Escape/Cancel, focus return, scroll and one column on narrow screens); verify with `TransactionFormDialog.test.tsx` (gmina follows powiat, powiat change clears gmina, unknown market spelling kept, missing powiat, price 0, fractional rooms, server field error, 502 at the top with input kept, pending disables submit, Escape closes and returns focus)

## 4. Create

- [x] 4.1 Replace `TransactionsTab.tsx` with the description and the "New transaction" button, and add `CreateTransaction.tsx` (dialog with empty values, create mutation, success toast with the "View transaction" link, close, stay on the tab); verify with `CreateTransaction.test.tsx` and `TransactionsTab.test.tsx` (minimal and full bodies, excluded status, success toast link to `/transactions/777`, list refetch after creation)
- [x] 4.2 Update `src/features/admin/AdminPage.test.tsx` for the new Transactions panel; verify `npm test` passes

## 5. Edit

- [x] 5.1 Create `src/features/transactions/EditTransactionButton.tsx` (opens the prefilled dialog titled "Edit transaction <id>", "Accept registry value" checkbox with helper text, disabled submit when nothing changed, PATCH with changed fields only, success toast, 404 message) and render it in the `TransactionDetailPage` header only for admins; verify with `EditTransactionButton.test.tsx` and additions to `TransactionDetailPage.test.tsx` (prefilled values, one-field body, cleared field is `null`, nothing changed is disabled, flag only, flag with change, page shows the new price after refetch, 404, button hidden for anonymous and non-admin, absent in the not-found state)

## 6. Verification

- [x] 6.1 Run `npm run build`, `npm run lint`, `npm test` and `npm run format:check`; verify all pass
