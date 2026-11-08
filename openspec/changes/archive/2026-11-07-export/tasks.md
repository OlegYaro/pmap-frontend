# Tasks

## 1. Status schema and download

- [x] 1.1 Create `src/features/export/exportStatus.ts`: zod schema for the start body `{id}` and the status union (`pending`, `done` with an http(s) `url`, `failed` with optional `error`), plus `parseExportStatus` that throws a readable error on anything else; verify with `exportStatus.test.ts` (each valid shape, `done` without url, url with a `javascript:` scheme, unknown status, non-object)
- [x] 1.2 Create `src/features/export/download.ts` (temporary anchor with `href` and `download`, clicked and removed); verify with `download.test.ts` that the anchor is clicked once with the given URL and is not left in the document

## 2. The export hook

- [x] 2.1 Create `src/features/export/useExport.ts`: start (`POST /exports` with the filters only), poll with a `setTimeout` chain (2 s, 5 s after 30 s, give up after 10 min measured with `Date.now()`), handle `done`/`failed`/errors with `toast.error` and the download, ignore `start()` while running, and clean up on unmount (clear timer, abort request, invalidate the run); verify with `useExport.test.tsx` using fake timers and `stubFetch`: success then download, failed with and without an error text, start failure (502), poll failure, `done` without url, interval back-off (request times), timeout after 10 minutes, second `start()` ignored while running, unmount stops requests and suppresses toast and download, and the start request has the filters but no `sort`, `order`, `limit`, `after_id`, `after_value`

## 3. The export button

- [x] 3.1 Create `src/features/export/ExportButton.tsx` on top of `LockedButton action="export"`: label "Export CSV", running state with spinner, "Preparing export...", `disabled` and a stable width, polite live region for ready/failed, analytics tooltip and `aria-describedby`, `disabled` prop; verify with `ExportButton.test.tsx`: anonymous click opens the login dialog and makes no request, login afterwards does not start an export, logged-in click starts one, running state text and disabled, no second request on repeated clicks, live-region text, analytics tooltip text on focus, disabled prop

## 4. Pages

- [x] 4.1 Place `ExportButton` in the existing `data-slot="export-action"` of `TransactionsPage` (filters from `useFilters`) and `AnalyticsPage` (normalised filters from `useAnalyticsFilters`, `scope="analytics"`, disabled until `ready`); verify with tests added to `TransactionsPage.test.tsx` and `AnalyticsPage.test.tsx`: the button is in the header, the transactions export request carries the URL filters and not the sort, the analytics export request carries `date_from`, `date_to`, `function` and none of `exclusion_reason`, `address`, `run_id`
- [x] 4.2 Update the existing tests that assert an empty export slot (search `export-action` and "no button" in `src/**/*.test.tsx`) to the new behaviour; verify `npm test` passes

## 5. Verification

- [x] 5.1 Run `npm run build`, `npm run lint`, `npm test` and `npm run format:check`; verify all pass
