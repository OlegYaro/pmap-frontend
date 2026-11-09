# Design

## Context

Each field component calls `useFilters()` and writes to the URL on every change; text, number and date inputs go
through `DebouncedTextField` (`useDebouncedCallback`, 400 ms). `FilterPanel` only lays the fields out and
`ActiveFilterChips` reads the URL. The transactions query key is built from the URL filters, so any URL write sends a
request. See proposal.md for the reason.

## Goals / Non-Goals

**Goals:**
- One request per search, started only by the user.
- Fields keep their current look and their `useFilters`-style call shape, so the change per field is small.
- The panel keeps its props (`fields`, `className`) so other pages can reuse it.

**Non-Goals:**
- Changing the URL format, the chips, sorting, or adding a debounce anywhere else.

## Decisions

- **Draft state lives in a provider rendered by `FilterPanel`.** `FilterDraftProvider` holds `draft`
  (`TransactionFilters`), starts from `useFilters().filters` and is replaced by them whenever their serialized form
  changes (state adjusted during render, as `DebouncedTextField` already does). `useDraftFilters()` returns
  `{ filters, updateFilters, setFilters }` for the draft, with the same shapes as `useFilters` but without a history
  option. The fields swap `useFilters` for `useDraftFilters`. Alternative: local state in each field; rejected, Search
  needs all values together.
- **Search is a form submit.** The panel is a `<form>`; "Search" is the submit button, so Enter in a text input
  submits by the browser's own rule. `onSubmit` calls `useFilters().setFilters(draft, { history: 'push' })`, which
  already does nothing when the filters are equal. Popover inputs render in a portal outside the form DOM, so Enter
  there does not submit.
- **The Search button is outside the collapsible area**, so it shows on a phone while the fields are collapsed.
- **Text inputs.** `DebouncedTextField` becomes `TextInputField`: it parses on every change, puts a valid value
  (or `undefined` when empty) into the draft, and keeps an invalid text locally with the error message. An invalid
  text is not in the draft, so Search ignores it and the field keeps showing the error. When the draft value
  changes from elsewhere and the text means a different value, the text is replaced (existing resync rule).
- **Unapplied hint** is `sameFilters(draft, applied)` negated, rendered as `role="status"` text next to the button.
  The button stays enabled, so pressing it with nothing changed is a safe no-op.
- **Chips and reset apply immediately** by their existing code; the resulting URL change resets the draft, which
  discards unapplied edits. Recorded as accepted behaviour.
- **Remove the debounce code.** `COMMIT_DELAY_MS` and `useDebouncedCallback` (with its test) are deleted once no
  file imports them.
- **Tests.** Field tests render the field inside the provider with a Search button helper (`renderWithDraft`) and
  assert the URL after Search; panel tests cover the one-request rule with the mocked fetch.

## Risks / Trade-offs

- [Users forget to press Search] → the "Unapplied changes" hint and Enter-to-search.
- [Chip removal drops unapplied edits] → accepted; edits are cheap to redo and the alternative mixes two sources of truth.
- [Draft resync loops] → the draft is replaced only when the applied filters' serialized string changes.
