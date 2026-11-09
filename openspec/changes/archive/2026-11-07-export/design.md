# Design

## Context

- Both pages already render `<div data-slot="export-action" />` in `PageHeader`'s `actions`.
- `LockedButton` (src/auth) already gives anonymous users the grey, lock-icon, `aria-disabled` button with the
  tooltip "Log in to <action>" and opens the login dialog on click; for authenticated users it is a normal `Button`
  that forwards `onClick` and other props (including `disabled`).
- `useAuth()` exposes `status` (`loading` | `anonymous` | `authenticated`). The login dialog resolves independently
  of the caller, so "do not start after login" needs no extra code: the click handler is simply not run while anonymous.
- `api` (openapi-fetch + `authFetch`) adds the token, refreshes it once on 401 / gateway 403 and throws `ApiError`.
  `POST /exports` has the same filter query as the list without paging keys; its 202 body and `GET /exports/{id}`
  are typed `dict[str, str]` in `schema.d.ts` (which is generated and not edited by hand).
- `TransactionFilters` is checked at compile time against that query type; sort and paging live outside it
  (`useSort`, history state), so passing `filters` alone can never send them. The analytics page keeps its own
  normalised `filters` from `useAnalyticsFilters` (no `exclusion_reason`, `address`, `run_id`).
- Toasts use `sonner` (`toast.error`) as in `AuthProvider`.

## Goals / Non-Goals

**Goals:**
- One `useExport(filters)` hook that owns the whole lifecycle and is testable with fake timers.
- One `ExportButton` placed by both pages; no per-page copies of the logic.

**Non-Goals:**
- Exporting aggregated analytics figures, choosing columns or format, a history of exports.
- Resuming an export after a reload (the id is kept only in memory).
- Cancelling a running export on the server (there is no endpoint).

## Decisions

**State machine in the hook.** `useExport(filters)` returns `{ status: 'idle' | 'running', start, announcement }`.
`start()` is a no-op while running. It calls `api.POST('/exports', { params: { query: filters } })`, validates the
body with a zod schema `{ id: string }`, then polls. The poll is a chain of `setTimeout` (not `setInterval`) so a slow
response never overlaps the next request and the delay can change: `delay = elapsed < 30 s ? 2 s : 5 s`, measured from
the start with `Date.now()` (fake timers drive both). After 10 min without a final status it stops with the timeout
toast. Alternative: TanStack Query `useQuery` with `refetchInterval`. Rejected: the polling has a start, a stop, a
deadline and one-shot side effects (download, toast); a mutation plus a refetching query splits that across effects and
makes "unmount stops everything" and the exact back-off harder to guarantee and test.

**Boundary validation.** `exportStatusSchema` (zod) is a discriminated union on `status`: `pending`; `done` with
`url` (a string that must be an `http:` or `https:` URL); `failed` with an optional `error` string. Anything else is
an error ("Unexpected response"), so a malformed body or a `done` without a link never starts a download. The type
`ExportStatus` is `z.infer` of it. `schema.d.ts` is not touched; the typed client returns `{[key: string]: string}`
which the schema narrows.

**Cleanup.** A run is identified by a token object held in a ref; every timer callback and every awaited response
checks that the token is still current before it acts. Unmount (an effect cleanup) clears the timer, aborts the
in-flight request through an `AbortController` passed as `signal`, and invalidates the token, so nothing downloads or
toasts after leaving. `start()` while running returns early, and the button is `disabled` while running (a disabled
button is removed from interaction; the guard in the hook covers programmatic calls).

**Download.** On `done` the hook creates a temporary anchor with `href = url` and `download`, clicks it and removes it.
The file comes from S3 with an attachment disposition, so the browser saves it without leaving the app; if a server
ever sends it inline, the browser navigates to the file in the same tab, which is harmless since all state is in the
URL. `window.open` is not used: after an async wait the browser treats it as an unrequested popup and may block it.

**Button.** `ExportButton({ filters, scope, disabled })` renders `LockedButton action="export"` with label "Export CSV".
While running the label becomes "Preparing export..." with a `Loader2` spinner (`animate-spin`, `motion-reduce`
aware), `disabled`, and a min-width so the header does not jump. A visually hidden `role="status"` live region (polite)
shows the announcement: "Preparing export", "Export ready", "Export failed". For a logged-in user on analytics
(`scope="analytics"`) the button is wrapped in a tooltip "Exports the transactions that match the current filters" and
`aria-describedby` points at the same text; the transactions page has no such tooltip. Anonymous users keep the
`LockedButton` tooltip "Log in to export" on both pages. On analytics the button is disabled until the period is set
(`ready` from `useAnalyticsFilters`), because the URL is not normalised yet.

**Errors.** `ApiError` messages go to `toast.error`; the start failure text is "Could not start the export: <message>",
a failed poll "Could not get the export status: <message>", a failed export "Export failed: <error>" (generic text if
none), the timeout "The export is taking too long. Try again later."

**Placement.** `TransactionsPage` and `AnalyticsPage` replace the empty div with
`<div data-slot="export-action"><ExportButton .../></div>`; the slot attribute stays for tests and layout.

**Files** (under `src/features/export/`): `exportStatus.ts` (zod schema, type, parse), `download.ts`,
`useExport.ts`, `ExportButton.tsx`, each with tests.

## Risks / Trade-offs

- [Token expires during a long poll] → `authFetch` refreshes once per request; if the refresh fails the request throws
  an `ApiError`, polling stops with the error toast and the session-ended handling of the auth layer takes over.
- [Gateway throttle 20 req/s] → at most one status request per 2 s per running export, and only one export per button.
- [Two buttons on one page] → there is one per page; two browser tabs may each run an export, which the backend allows.
- [Download blocked or opened inline by a server header] → documented fallback above; the toast "Export ready" via the
  live region tells the user the export is finished.
- [Timer drift in background tabs] → browsers throttle timers to ~1 s granularity there; the deadline is computed from
  `Date.now()` so the 10-minute limit stays correct.
