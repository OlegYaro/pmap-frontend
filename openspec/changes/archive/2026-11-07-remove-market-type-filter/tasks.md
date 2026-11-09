# Tasks

## 1. Remove the filter

- [x] 1.1 Remove `market_type` from `TransactionFilters`, `FILTER_KEYS` and `marketType` from `FILTER_FIELDS` in `model.ts`; add `UNUSED_API_FILTER_KEYS` and adapt the compile-time checks; verify `npm run build` passes.
- [x] 1.2 Remove `market_type` from the parser in `params.ts` and the `marketType` chip in `chips.ts`; update `params.test.ts`, `chips.test.ts` and `useFilters.test.tsx` (use `function` where a categorical value is needed, add a case that `?market_type=wtorny` is ignored); verify `npm test` passes for these files.
- [x] 1.3 Remove the "Market type" field from `FilterPanel.tsx`, narrow `CategorySelectField` to `function`, and update `FilterPanel.test.tsx`, `CategorySelectField.test.tsx`, `TextFilterField.test.tsx`; verify the panel test shows no "Market type" control and eleven fields.

## 2. Wrap-up

- [x] 2.1 Search `src` and `README.md` for leftover `marketType` / "Market type" filter mentions and update them; run `npm run build`, `npm run lint`, `npm test`, `npm run format:check` and `openspec validate remove-market-type-filter --strict`, and verify all pass.
