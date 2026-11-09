# Tasks

## 1. Dependencies and dev proxy

- [x] 1.1 Add `@tanstack/react-query` and `react-router` with `npm install`; verify `npm ls` lists both and `npm run build` still passes
- [x] 1.2 Extract `proxyConfig(target)` (target, `changeOrigin: true`, `/api` prefix rewrite) in `config/proxy.ts` (add `config` to `include` in `tsconfig.node.json`) and use it in `vite.config.ts` when `VITE_API_TARGET` is set, warning only when `command === 'serve'` and it is not; verify `config/proxy.test.ts` shows `/api/territories` rewrites to `/territories` and `npm run build` type-checks the module
- [x] 1.3 Add `.env.example` with `VITE_API_TARGET` and a README section on the dev setup; verify `git check-ignore .env.local` matches and `.env.example` is not ignored

## 2. Query client

- [x] 2.1 Add `createQueryClient(overrides?)` with the no-retry-on-4xx policy (max 2 retries otherwise; overrides merge into query defaults); verify unit tests (with `retryDelay: 0`): 404 sends one request, 503 sends three

## 3. Router, layout and placeholder pages

- [x] 3.1 Add `RootLayout` with header `NavLink`s, placeholder pages for `/transactions`, `/transactions/:id`, `/login`, `/admin`, and `NotFoundPage` (with a link to `/`); define them in `src/app/routes.tsx`
- [x] 3.2 Rewrite `App` to render the providers (`QueryClientProvider`, `RouterProvider`) and update `src/App.test.tsx`; verify tests cover each route heading, the `:id` value, the not-found page keeping the header and having a link with `href="/"`, and the current-link marker; every test rendering `/` stubs fetch via `stubFetch` and uses `createQueryClient({ retry: false })`

## 4. Territories preview

- [x] 4.1 Add `useTerritories()` and `TerritoriesPreviewPage` at `/` (first 10 rows, em dash for null names, loading, empty, error with retry button); verify the page is wired into the `/` route
- [x] 4.2 Test the page with `stubFetch`: rows from a mocked response (25 returned, 10 shown), loading state, 404 `{"detail": ...}` shows the message and retry recovers; verify `npm test` passes

## 5. Final checks

- [x] 5.1 Run `npm run lint`, `npm run format:check`, `npm run build`, `npm test`; verify all are green
- [x] 5.2 Start `npm run dev` with `VITE_API_TARGET` set and open `/`; verify territories load through the proxy
