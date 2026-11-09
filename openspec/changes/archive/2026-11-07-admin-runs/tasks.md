# Tasks

## 1. Types and helpers

- [x] 1.1 Create `src/api/admin-types.ts` with zod schemas and inferred types for `RunListItem`, `RunStatus`, `FailedTask` and `RunStarted` (unknown stage/status strings allowed); verify with `admin-types.test.ts` (valid list item, unfinished run with `finished_at` null, status with `excluded`, string where a number is expected is rejected, unknown stage accepted)
- [x] 1.2 Add `formatDateTime` and `shortId` to `src/lib/format.ts`; verify with cases in `src/lib/format.test.ts`
- [x] 1.3 Add `src/components/ui/tabs.tsx` (shadcn style over `radix-ui`, no new dependency); verify with a tabs case in `src/components/ui/primitives.test.tsx` (selection, arrow keys)

## 2. Data hooks

- [x] 2.1 Create `useRuns.ts` (limit, schema check, 5 s interval only while a run is unfinished, error on malformed body) and `useRun.ts` (per-run detail, interval driven by a `running` flag, 404 kept as an `ApiError`); verify with `useRuns.test.tsx` and `useRun.test.tsx` using fake timers: polls while unfinished, stops when all finished, no request after unmount, malformed response becomes an error, failed refresh keeps previous rows
- [x] 2.2 Create `useStartRun.ts` (mutation: `territory_code` set or omitted, validates `{run_id}`, invalidates the runs list); verify with `useStartRun.test.tsx` (query with and without `territory_code`, malformed body, 502)

## 3. Admin page and runs list

- [x] 3.1 Create `useAdminParams.ts` (`tab`, `limit`, `run` validation; push for tab and limit, replace for run) and `AdminPage.tsx` with `TransactionsTab.tsx` placeholder; replace the placeholder `AdminPage` in `src/app/pages.tsx` and update `src/app/routes.tsx`; verify with `useAdminParams.test.tsx` and `AdminPage.test.tsx` (default tab, `?tab=transactions`, unknown tab, arrow keys, heading "Admin")
- [x] 3.2 Create `RunProgress.tsx`, `RunsTable.tsx` and `RunsTab.tsx` (columns, short id with title, "Running", progress bar, failed marker, limit selector in the URL, Refresh, details button selecting the run, skeleton / empty / error with Retry); verify with `RunsTable.test.tsx` and `RunsTab.test.tsx` (columns and cells for finished and unfinished runs, total 0, limit 50 requests `limit=50`, invalid limit in URL, empty, error and retry, malformed response, select a run sets `run`)

## 4. Start a run

- [x] 4.1 Create `StartRun.tsx` (powiat select with "All of Poland", confirm dialog naming the scope, request, success selects the new run, "A run is in progress" guard with `aria-disabled`, error with Retry inside the dialog); verify with `StartRun.test.tsx` (default scope, powiat search, cancel sends nothing, query with and without `territory_code`, success closes and selects the run, blocked by an unfinished run, unblocked after refresh, 502 shows message and Retry succeeds)

## 5. Run detail

- [x] 5.1 Create `RunDetail.tsx` and `FailedTasks.tsx` (counters, excluded list sorted with bars, failed tasks with expandable monospace trace and Copy, "No failed tasks", "No rows were excluded", states, "Select a run to see its details", 404 text, polling only while the run is unfinished); verify with `RunDetail.test.tsx` and `FailedTasks.test.tsx` (counters, ordering, empty cases, expand and copy with a mocked clipboard, copy failure, 404, polling flag)
- [x] 5.2 Update `src/auth/RequireAdmin.test.tsx` and `src/app/routes.test.tsx` for the new admin page (heading plus tabs, stubbed `/admin/runs`); verify `npm test` passes

## 6. Verification

- [x] 6.1 Run `npm run build`, `npm run lint`, `npm test` and `npm run format:check`; verify all pass
