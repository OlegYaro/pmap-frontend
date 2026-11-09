# Design

## Context

Vite 8 + React 19 + Vitest (jsdom), no router or query library yet. `src/api/client.ts` exports `api`
(openapi-fetch) whose failures reject with `ApiError` (has `status`). `API_BASE_URL` is `<origin>/api`, so
dev needs a proxy. `.gitignore` already ignores `*.local`. `GET /territories` returns `TerritoryResponse[]`
(nullable powiat/gmina names). See proposal.md for scope.

## Goals / Non-Goals

**Goals:**
- A small, replaceable shell: routes, layout, query client, proxy.
- Routes defined in one place so tests can render them with a memory router.

**Non-Goals:**
- Auth-aware routing or guards; lazy-loaded routes; styling beyond minimal CSS.

## Decisions

- **`react-router` v7 in data mode** (`createBrowserRouter` + `RouterProvider`, route objects in
  `src/app/routes.tsx`). Route objects can be passed to `createMemoryRouter` in tests. Alternative: `<BrowserRouter>`
  with JSX routes; rejected because it is harder to reuse in tests.
- **`QueryClient` factory** `createQueryClient(overrides?)` in `src/app/queryClient.ts`, so each test gets a fresh client
  and the app creates one. `retry: (count, error) => !(error instanceof ApiError && error.status >= 400 &&
  error.status < 500) && count < 2`. Alternative: `retry: false` globally; rejected, a flaky 5xx deserves a retry.
  Other defaults stay, except a 30 s `staleTime`. `overrides` is merged into `defaultOptions.queries`; tests pass `{ retry: false }` (or `retryDelay: 0` when they cover the retry policy itself).
- **Hook `useTerritories()`** in `src/features/territories/` wraps `useQuery` with key `['territories']`. The
  `queryFn` calls `api.GET('/territories')` and returns `data`; errors already reject as `ApiError`, so no extra
  handling. The page slices the first 10 rows.
- **Proxy** in `vite.config.ts` via `defineConfig(({ command, mode }) => ...)` with `loadEnv(mode, cwd, 'VITE_')` and `server.proxy['/api'] = { target,
  changeOrigin: true, rewrite: path => path.replace(/^\/api/, '') }`. The proxy is added only when
  `VITE_API_TARGET` is set; otherwise dev starts and logs a warning that `/api` is not proxied. The warning is printed only for `command === 'serve'`, so `build` and `vitest` stay quiet. Alternative:
  fail startup; rejected, it would block `build`/`test` which load the same config.
- **Layout** `RootLayout` = `<header><nav>` with `NavLink`s + `<Outlet/>`. Not-found is a `*` child route so it
  renders inside the layout.
- **Tests**: every test that renders `/` (App, not-found, link navigation starting at `/`) stubs fetch with `stubFetch` or starts the memory router elsewhere, and uses `createQueryClient({ retry: false })`, so no real network call, retry delay or request outlives teardown. Existing `stubFetch` helper from `src/test/http.ts` mocks the network, so the page is tested through
  the real client. Routing tests use `createMemoryRouter(routes, { initialEntries })`. The proxy config is tested by
  extracting `proxyConfig(target)` into `config/proxy.ts` (test beside it, `config/proxy.test.ts`). `config/` is added to `include` of `tsconfig.node.json` so `tsc -b` checks it and the app project stays free of node code.

## Risks / Trade-offs

- [`react-router` v7 package naming differs from older `react-router-dom` docs] → import from `react-router`
  only.
- [Retries make failing 5xx tests slow] → tests that cover retry use `retryDelay: 0` via a client override.
- [Proxy is dev-only; prod routing is separate] → documented in README; infra already serves `/api`.
