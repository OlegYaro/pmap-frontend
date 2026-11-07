# Proposal

## Why

Every change in the filter panel (a keystroke after a short pause, a select, a checkbox) writes to the URL and sends
a request at once. The user wants a search to start only when the Search button is pressed, so a set of filters is
chosen first and requested once. This also saves calls: the gateway limits the request rate.

## What Changes

- The filter panel edits a local draft. Nothing is requested and the URL does not change until the user presses
  "Search" or presses Enter in a text, number or date input.
- "Search" writes the draft to the URL as one pushed history entry, which sends exactly one request.
- Typed text no longer waits for a pause; the 400 ms debounce is removed.
- A small "Unapplied changes" text shows while the draft differs from the applied filters.
- Chip removal and "Reset all" still apply at once; the draft is replaced by the applied filters after any URL change.
- Sorting by a header click is not a filter and stays immediate.

Out of scope: the table, paging, the analytics page, any API change.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `filter-panel`: controls edit a draft; Search button, Enter, unapplied-changes hint, draft resync; the debounced input requirement is replaced.
- `territory-options`: a territory selection changes the draft, not the URL.
- `filter-state`: the history rule "typing replaces" is replaced by "an applied search pushes one entry".

## Impact

- Code: `src/features/filters/` (new draft provider and hook, `FilterPanel`, all field components, the text input field); `src/hooks/useDebouncedCallback.ts` and its test are removed if nothing else uses them; tests of the fields and the panel.
- The `useFilters` hook and the chips are unchanged; the analytics page can reuse the same panel.
- No dependency or API change.
