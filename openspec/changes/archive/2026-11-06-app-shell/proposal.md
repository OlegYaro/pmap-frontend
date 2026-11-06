# Proposal

## Why

The app is a bare `<h1>`. The api-client and auth-session changes gave it a typed backend client, but nothing
renders around it: no data-fetching layer, no routes, no way to reach the backend from `npm run dev` (the client
requests same-origin `/api`). Later screens (analytics, transactions, login, admin) need a shell to land in.

## What Changes

- Add TanStack Query: one `QueryClient` and provider with defaults that do not retry 4xx responses.
- Add React Router with one layout (header with navigation) and placeholder pages for `/`, `/transactions`,
  `/transactions/:id`, `/login`, `/admin`; unknown paths show a not-found page.
- Make the Vite dev server proxy `/api` to `VITE_API_TARGET`, stripping the `/api` prefix, with `changeOrigin`.
- Add `.env.example` with `VITE_API_TARGET`; `.env.local` stays git-ignored (already covered by `*.local`).
- Add a temporary page at `/` that loads `GET /territories` through the client with a Query hook and shows the
  first rows, with loading and error states. It is replaced by the analytics screen later.

Out of scope: charts, tables, filters, the login form, admin features, route guards.

## Capabilities

### New Capabilities
- `app-shell`: providers, routing, the shared layout with navigation, placeholder pages, the not-found page,
  query retry policy and the dev-server proxy to the backend.
- `territories-preview`: the temporary page at `/` that lists the first territories from the backend with
  loading and error states.

### Modified Capabilities

None. The `api-client` requirements do not change; the proxy only makes its `/api` prefix reachable in dev.

## Impact

- New dependencies: `@tanstack/react-query`, `react-router`.
- Code: `src/main.tsx`, `src/App.tsx` (and its test), new `src/app/` (router, layout, pages, query client),
  `vite.config.ts`, `.env.example`, README note on the dev setup.
- No backend change. Production routing of `/api` is already handled by the infra stack.
