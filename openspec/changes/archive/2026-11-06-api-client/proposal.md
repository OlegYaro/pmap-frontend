# Proposal

## Why

The frontend has no way to talk to the PMAP backend yet. Screens for transactions, analytics, exports
and admin all need typed requests, one error shape and working token handling. If each screen does
this on its own, the refresh logic gets duplicated and the one-time refresh token gets burned by
competing requests. This change builds that layer once, before any screen exists.

## What Changes

- Add the `openapi-fetch` runtime dependency. `openapi-typescript` runs through `npx` with pinned
  versions, because it needs TypeScript 5 and the project uses TypeScript 7.
- Add `src/api/schema.d.ts`, generated from the backend's public `GET /openapi.json` and committed.
  Add the npm script `api:types`, which regenerates it from `$VITE_API_TARGET/openapi.json`.
- Add a typed client built on `openapi-fetch` with base URL `/api` (same origin; CloudFront strips the
  prefix before the API Gateway).
- Add `ApiError` (status + readable message). It covers the backend's `{"detail": "..."}`,
  validation errors (422, `detail` is a list) and the gateway's own `{"message": "..."}` bodies.
- Add `src/auth/tokens.ts`, the only module that knows where tokens live: the access token in memory,
  the refresh token in `sessionStorage`. It does login, logout and a single-flight refresh.
- Send `Authorization: Bearer <access_token>` whenever an access token is held.
- On an auth failure, refresh once and retry the original request once. A failed refresh clears both
  tokens and calls a callback the app registers. An auth failure is a 401, or a 403 from the API
  Gateway's authorizer, which is how the gateway reports an expired or invalid token (see design).
- Vitest tests with a mocked `fetch` for the refresh, single-flight, failed-refresh and error-message
  paths.

Out of scope: React hooks, routing, the login screen, any UI, and a Vite dev-server proxy for `/api`.

## Capabilities

### New Capabilities

- `api-client`: typed access to the PMAP backend under `/api`, type generation from the backend's
  OpenAPI document, and turning backend and gateway errors into one `ApiError`.
- `auth-session`: where the access and refresh tokens are kept, login and logout, attaching the bearer
  token, and the refresh-and-retry rules (single flight, failure handling, app notification).

### Modified Capabilities

None. There are no existing specs.

## Impact

- New code: `src/api/` (client, errors, generated schema) and `src/auth/tokens.ts`, with tests next to
  them.
- `package.json`: the `openapi-fetch` dependency and the `api:types` script.
- `.prettierignore`: the generated `src/api/schema.d.ts` is excluded, so `format:check` in CI does not
  depend on how the generator formats its output.
- Backend contract it relies on (no backend changes): `/auth/login`, `/auth/refresh` (single-use
  refresh tokens), `/auth/logout`; the gateway answers 401 when no `Authorization` header is sent
  and 403 `{"message":"Forbidden"}` when the authorizer denies the token
  (`pmap-backend/infra/gateway.yaml`).
