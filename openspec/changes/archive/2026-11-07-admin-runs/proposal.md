# Proposal

## Why

Data reaches the app through sync runs of the extraction service, and today an admin can neither start one nor see
whether the last one worked: `/admin` is a placeholder. Failures are only visible in service logs. The backend already
exposes `GET/POST /admin/runs` and `GET /admin/runs/{id}`, behind the admin role.

## What Changes

- Replace the `/admin` placeholder with the admin page: heading "Admin" and tabs "Runs" and "Transactions"
  (the second is a placeholder until manual transaction editing lands).
- Runs tab: a table of the latest runs (20 / 50 / 100) with trigger, start, finish, progress bar, not-published and
  failed counts, refreshed every 5 s while any run is unfinished.
- "Start sync": a powiat (or "All of Poland") choice, a confirmation that states the scope, then `POST /admin/runs`.
  The button is blocked with "A run is in progress" while a run has no finish time; a 502 shows the message and offers
  a retry. On success the new run is selected.
- Run detail: stage counters, inserted / updated, excluded rows by reason, and the failed tasks, each expandable to its
  error trace with a copy button.
- The admin endpoints are untyped in the OpenAPI document, so the response shapes (taken from the extraction service
  schemas) are declared in `src/api/admin-types.ts` and validated at the boundary.

## Capabilities

### New Capabilities
- `admin-page`: the admin page frame: heading, tabs, the placeholder Transactions tab.
- `admin-runs-list`: the table of recent runs, its limit selector, live refresh and states.
- `admin-run-start`: starting a sync run for a powiat or the whole country, with confirmation and guard.
- `admin-run-detail`: one run's counters, excluded rows and failed tasks with their traces.

### Modified Capabilities
- `app-shell`: `/admin` shows the admin page rather than a placeholder.

## Impact

- Code: new `src/features/admin/`, new `src/api/admin-types.ts`; `src/app/pages.tsx` loses `AdminPage`;
  `src/app/routes.tsx` points `admin` at the new page; small formatting helpers in `src/lib/format.ts`.
- API: `GET /admin/runs?limit=`, `POST /admin/runs?territory_code=`, `GET /admin/runs/{run_id}`; all need an admin
  token (the gateway enforces it; the UI only hides the area).
- Dependencies: none.
- Backend asks (not part of this change): `response_model` for the admin endpoints, and passing the extraction
  service's 409 "run already in progress" through instead of turning it into 502.
