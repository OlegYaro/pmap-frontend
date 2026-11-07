# Design

## Context

`market_type` is a key of `TransactionFilters`, parsed in `params.ts`, shown as a chip in `chips.ts` and edited by a
`CategorySelectField` in `FilterPanel.tsx`. `model.ts` checks at build time that the filter keys equal the query
parameters of the generated API types. See proposal.md for the reason.

## Goals / Non-Goals

**Goals:**
- No way to apply a market type filter from the UI or from a URL.
- The build-time check against the API types keeps working.

**Non-Goals:**
- Fixing the stored values, changing the backend, removing the table column.

## Decisions

- **Remove the key from the model rather than hide the control.** A filter that stays readable from the URL but has
  no control and no chip would filter silently. The key leaves `TransactionFilters`, `FILTER_KEYS`, `FILTER_FIELDS`
  (`marketType`) and the parser; the chip builder entry goes too.
- **Keep the build-time check by naming the exception.** The API still has `market_type`, so `model.ts` declares
  `UNUSED_API_FILTER_KEYS = 'market_type'` and the checks compare `FilterKey | UnusedKey` with the API query keys. A
  renamed or new API parameter still fails the build.
- **`MARKET_TYPE_LABELS` stays**, since the table column uses it. `CategorySelectField` keeps its generic props
  (`filterKey` narrows to `'function'`).
- **Existing URLs** with `market_type` are not rejected: unknown params are already ignored by the parser.

## Risks / Trade-offs

- [Users lose a way to narrow by primary/secondary market] → accepted until the stored values are consistent; the key can be restored in a later change.
- [Documentation or tests still mention the filter] → search for `market_type` and `marketType` after the change and update tests.
