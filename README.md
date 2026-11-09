# pmap-frontend

Web frontend of PMAP, a service for browsing real-estate transactions (prices in PLN, areas in m²).
It is a single-page app built with React, Vite, TypeScript, React Router, TanStack Query and Tailwind
CSS with shadcn/ui components.

- **Transactions** (`/`): filter panel, active-filter chips, a sortable table with keyset paging, and a
  detail page per transaction (`/transactions/:id`).
- **Analytics** (`/analytics`): key figures, a monthly price-per-m² chart and rooms and floor
  distributions for a chosen period and the same filters.
- **CSV export** of the transactions that match the current filters (needs a login).
- **Admin** (`/admin`, admin role): sync runs of the extraction service (list, start, details, failed
  tasks) and creating and editing transactions.
- Light and dark theme, keyboard accessible, responsive down to 360 px.

## Scripts

| Command                | What it does                                         |
| ---------------------- | ---------------------------------------------------- |
| `npm run dev`          | Dev server with the `/api` proxy (see "Dev server")  |
| `npm run build`        | Type-checks (`tsc -b`) and builds into `dist/`       |
| `npm run preview`      | Serves the production build locally                  |
| `npm run lint`         | Lints with oxlint                                    |
| `npm test`             | Runs the tests once (Vitest, jsdom, Testing Library) |
| `npm run test:watch`   | Runs the tests in watch mode                         |
| `npm run format`       | Formats the repository with Prettier                 |
| `npm run format:check` | Checks the formatting; CI runs it                    |
| `npm run api:types`    | Regenerates `src/api/schema.d.ts` (see "API types")  |

Before pushing, run `npm run lint`, `npm run format:check`, `npm test` and `npm run build`; the CI
workflow (`.github/workflows/ci.yml`) runs the same four. Deployment to AWS is described in
`infra/RUNBOOK.md`.

## Project structure

```
src/api         openapi-fetch client, error type, generated schema.d.ts, admin response types
src/auth        session tokens, login dialog, account menu, the admin route guard
src/app         routes, layout (header, skip link), not-found and forbidden pages, document titles
src/components  shared pieces (page header, empty and error states) and shadcn/ui in ui/
src/features    transactions, filters, analytics, export, admin, territories
src/lib         formatting and small helpers
src/test        test helpers (HTTP stubbing, rendering, fixtures); tests sit next to the code
config          dev-server proxy configuration
openspec        specifications and change history (see "OpenSpec")
```

## Conventions

- **State lives in the URL.** Filters, sort, the analytics period, the admin tab and the selected run
  are search parameters, so a page can be reloaded, shared and used with Back. Components read and
  write them through hooks such as `useFilters`, `useSort` and `useAdminParams`.
- **Keyset paging.** The backend returns no total count. A list is paged with `after_id` (id of the last
  row) and `after_value` (its sort value, omitted when null).
- **Strict queries.** The backend answers unknown query parameters with 422, so exports and analytics
  never receive sort or paging parameters.
- **The role is only a UI hint.** The role comes from the JWT `role` claim and decides what is shown;
  the gateway enforces access. Public reads (transactions, territories, analytics) need no token;
  exports and `/admin` do.
- **Request rate.** The gateway throttles at 20 requests per second, so filter fields edit a draft that is
  applied with the Search button instead of sending a request per keystroke.
- **Every screen has loading, empty and error states**, announced to assistive technology.
- UI text is English; dates are ISO in URLs and shown as locale dates.

## OpenSpec

Behaviour is specified with [OpenSpec](https://github.com/Fission-AI/OpenSpec). `openspec/specs/` holds
the current requirements per capability, `openspec/changes/` the changes in progress and
`openspec/changes/archive/` the finished ones. The CLI is a dev dependency: `npx openspec list` shows
the active changes and `npx openspec validate <change> --strict` checks one.

## Environment

`.env.example` lists the variables; copy it to `.env.local` (git-ignored). The only one is
`VITE_API_TARGET`, the backend the dev server proxies `/api` to and the script `npm run api:types`
reads.

## API types

`src/api/schema.d.ts` is generated from the backend's OpenAPI document and committed. To regenerate it,
put the backend base URL (the gateway `ApiUrl`, or the site address with `/api`) in `.env.local`:

```bash
VITE_API_TARGET=https://<gateway-or-site>
```

and run `npm run api:types`. A `VITE_API_TARGET` set in the shell takes precedence over `.env.local`.

The script (`scripts/api-types.sh`) downloads `$VITE_API_TARGET/openapi.json`. It runs
`openapi-typescript` through `npx` with a pinned TypeScript 5, because the generator does not work with
the project's TypeScript 7.

## Dev server

`npm run dev` proxies `/api` to the backend, removing the `/api` prefix (`/api/territories` becomes
`$VITE_API_TARGET/territories`). Copy `.env.example` to `.env.local` (git-ignored) and set
`VITE_API_TARGET`. Without it the dev server starts but warns that `/api` is not proxied. In
production `/api` is routed by the infrastructure stack.
