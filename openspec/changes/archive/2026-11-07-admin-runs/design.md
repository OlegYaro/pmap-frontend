# Design

## Context

- `/admin` is guarded by `RequireAdmin` and renders `AdminPage`, a placeholder in `src/app/pages.tsx`.
- The three admin endpoints are typed `{[key: string]: unknown}` in `schema.d.ts` (generated, not edited by hand), so
  their bodies have to be checked by the app. Their real shapes are the extraction service's response models
  (`RunListItemResponse`, `RunStatusResponse`, `FailedTaskResponse`, `RunStartedResponse`), read from that service's
  source: ids are UUID strings, timestamps ISO strings, `excluded` is a `{reason: count}` object, `current_stage` and task
  `status` are one of `queued | downloading | cleaning | assigning | staged | done | not_published | failed`, `trigger` is
  `manual | schedule`.
- `GET /admin/runs` takes `limit` 1–100. `POST /admin/runs` takes an optional `territory_code` (a powiat code) and answers
  202 `{run_id}`. The backend turns the extraction service's 409 "run in progress" into a generic 502.
- Reusable pieces: `api` client + `ApiError`, `ErrorState`, `EmptyState`, `TableSkeleton`, `Skeleton`, `SearchableSelect`,
  `useTerritoryOptions`, `Dialog`, `Table`, `Badge`, `Button`, `EXCLUSION_REASON_LABELS`, `sonner`. There is no Tabs
  component in `src/components/ui` yet; `radix-ui` (already a dependency) provides the primitive.

## Goals / Non-Goals

**Goals:**
- A response-boundary layer for the admin endpoints that fails loudly on unexpected shapes.
- State that survives reloads and can be shared as a link: the tab, the list size and the selected run live in the URL.
- Polling that is cheap and stops by itself.

**Non-Goals:**
- Cancelling or retrying a run, editing transactions (next change), a global notification when a run finishes.
- Fixing the backend's missing `response_model` or its 409 handling; the UI works around both.

## Decisions

**Types at the boundary.** `src/api/admin-types.ts` holds zod schemas and `z.infer` types for `RunListItem`, `RunStatus`,
`FailedTask` and `RunStarted`. `api.GET('/admin/runs')` returns `unknown` bodies; hooks run them through the schema
(`z.array(runListItemSchema)`, `runStatusSchema`, `runStartedSchema`) and throw an `Error("Unexpected response from the
server")` on mismatch, which flows into the normal error state. Enums are `z.enum([...])` for the known values with
`.or(z.string())` fallback so a new stage added by the service does not break the page. Dates stay strings and are
formatted at display time. When the backend later adds `response_model`, only this file changes.
Alternative: cast with `as`. Rejected: it hides exactly the drift the plan warned about.

**Tabs.** Add `src/components/ui/tabs.tsx` in the shadcn style on top of `radix-ui` (`Tabs.Root/List/Trigger/Content`),
controlled by the URL `tab` param (`useSearchParams`); changing the tab pushes an entry. Radix supplies roving focus and
the ARIA wiring. The Transactions panel is a small placeholder.

**URL state.** `tab`, `limit` (20 | 50 | 100) and `run` are read through one small hook `useAdminParams` that validates
each value and writes with `setSearchParams`. `limit` and `tab` use `push`; selecting a run uses `replace` so Back does
not walk through every run clicked.

**Data hooks (TanStack Query).**
`useRuns(limit)`: key `['admin','runs',limit]`; `refetchInterval` is a function: 5000 ms when the last data has a run with
no `finished_at`, otherwise `false`; no window-focus refetch; `refetchIntervalInBackground: false`. Keeping the previous
data on a failed refresh is the library default.
`useRun(runId, running)`: key `['admin','run',runId]`; same interval rule driven by the `running` flag, which the page
computes from the list entry of that run (the status response has no finish time). 404 is surfaced as `ApiError` with
`status` 404 and rendered as "not found".
`useStartRun()`: a mutation; on success it invalidates `['admin','runs']` and sets `run` in the URL.
Polling stops by itself on unmount; React Query clears the timer.

**Start guard.** `isRunning = runs.some(r => r.finished_at === null)` from the cached list. The button uses
`aria-disabled` and ignores the click (like `LockedButton`) so it stays focusable and can carry the text "A run is in
progress". Because the list may be stale, a 502 still goes through the retry path. Alternative: ask the backend. Not
possible in this change (listed as a backend ask in the proposal).

**Powiat choices.** `useTerritoryOptions().options` gives the powiat list; the select is a `SearchableSelect` with
`anyLabel="All of Poland"`, value = powiat code or none. The confirm dialog gets the label from `nameOf('powiat', code)`.

**Confirm dialog.** The shared `Dialog`. The start error and Retry live inside it so the user's choice stays visible. The
"Start" button is disabled while the mutation is pending.

**Run table.** Plain `Table` with a small `RunProgress` (`div role="progressbar"` with `aria-valuenow/min/max` and
`aria-label`, plus the `done / total` text). The "Failed" cell adds an icon and the number, not just a colour. Each row has
a button "Details for run <id>"; the selected row has `aria-current="true"`.

**Detail.** `RunDetail` shows counter definitions in a `dl`, the excluded list sorted descending with bars relative to the
maximum (labels from `EXCLUSION_REASON_LABELS`, fallback to the raw key), and failed tasks as a list where each item has
an `aria-expanded` disclosure button controlling the `<pre>` trace. "Copy" uses `navigator.clipboard.writeText`, and
shows "Copied" for 2 s; if the clipboard is unavailable the button shows "Copy failed".

**Formatting.** New helpers in `src/lib/format.ts`: `formatDateTime` (locale date and time) and `shortId` (first 8 chars).

**Files** (under `src/features/admin/`): `AdminPage.tsx`, `useAdminParams.ts`, `RunsTab.tsx`, `RunsTable.tsx`,
`RunProgress.tsx`, `StartRun.tsx`, `RunDetail.tsx`, `FailedTasks.tsx`, `useRuns.ts`, `useRun.ts`, `useStartRun.ts`,
`TransactionsTab.tsx`; plus `src/api/admin-types.ts` and `src/components/ui/tabs.tsx`; each with tests.

## Risks / Trade-offs

- [Stale list lets a second run be started] → the extraction service refuses it with 409, the backend shows 502, the dialog
  shows the message and Retry; nothing is corrupted.
- [Schema stricter than the service] → unknown enum values are allowed, extra fields are ignored (zod default), only the
  fields the UI reads are required.
- [Long traces] → shown only on expand, in a scrollable `pre` with a max height.
- [Polling load] → one list request per 5 s while a run is unfinished plus one detail request; well below the gateway's
  20 requests/s, and it stops when the page is left or all runs finish.
- [Clipboard API unavailable on plain HTTP] → "Copy failed" state; the trace remains selectable.
