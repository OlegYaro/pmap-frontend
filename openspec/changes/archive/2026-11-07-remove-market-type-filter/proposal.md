# Proposal

## Why

The "Market type" filter returns nothing for most of the data: the stored `market_type` values are spelled in
several ways (`wtorny`, `rynekWtorny`, `pierwotny`, `rynekPierwotny`) and the backend matches one exact value, so
the two fixed choices of the select miss most rows. Until the data is consistent the filter misleads.

## What Changes

- Remove the "Market type" control from the filter panel and its chip.
- Remove `market_type` from the filter model: it is no longer read from or written to the URL.
- The "Market" column of the transactions table stays (it only shows the stored value).
- The "Function" filter is unchanged.

Out of scope: any change to the backend or the extraction service, sorting by market type, the table column.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `filter-state`: `market_type` is no longer a filter key; it is ignored when read from the URL.
- `filter-panel`: eleven fields instead of twelve; no "Market type" control.
- `active-filter-chips`: no "Market type" chip.

## Impact

- Code: `src/features/filters/` (model, params, chips, panel, labels use, tests); `CategorySelectField` keeps serving "Function".
- A bookmarked URL with `market_type` still opens; the parameter is ignored.
- No API or dependency change.
