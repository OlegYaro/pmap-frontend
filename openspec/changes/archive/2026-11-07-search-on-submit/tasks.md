# Tasks

## 1. Draft state

- [x] 1.1 Add `FilterDraftProvider`, its context and `useDraftFilters` in `src/features/filters/` (draft starts from the applied filters, is replaced when they change, `updateFilters` and `setFilters` edit the draft only); verify with tests: edits do not change the URL, a URL change replaces the draft.
- [x] 1.2 Add the `renderWithDraft` test helper (router, provider, Search button) in `src/test/render.tsx`; verify it is used by the tests of 1.1.

## 2. Fields use the draft

- [x] 2.1 Replace `DebouncedTextField` by `TextInputField` (no timer, valid value goes to the draft, invalid text keeps its message) and switch `TextFilterField` and `RangeField` to the draft; verify with tests: typing changes only the draft, `42,5`, `-1`, `abc` cases, resync from the applied value.
- [x] 2.2 Switch `RoomsField`, `RowsField`, `CategorySelectField` and `TerritoryField` to `useDraftFilters`; verify with their updated tests (choices change the draft, the URL changes only after Search; territory cascade clears children in the draft).
- [x] 2.3 Delete `useDebouncedCallback` and its test and `COMMIT_DELAY_MS` when nothing imports them; verify `npm run build` and `npm run lint` pass.

## 3. Panel

- [x] 3.1 Wrap `FilterPanel` in the provider and a `<form>` with the "Search" submit button outside the collapsible area and the "Unapplied changes" status text; verify with panel tests: one pushed history entry and one request after several edits, Enter in an input searches, no navigation when nothing changed, hint shows and clears, button visible when collapsed.
- [x] 3.2 Check chips and the transactions page with the new behaviour: chip removal and "Reset all" apply at once and discard the draft, sort clicks stay immediate; verify with tests in `ActiveFilterChips.test.tsx` and `TransactionsPage.test.tsx` (requests sent only after Search).

## 4. Wrap-up

- [x] 4.1 Update the "Filters" section of `README.md`; run `npm run build`, `npm run lint`, `npm test`, `npm run format:check` and `openspec validate search-on-submit --strict`, and verify all pass.

## Workflow follow-up

- Check in the running app: change several filters, nothing loads until "Search"; Enter in a text field searches; Back returns to the previous filters.
