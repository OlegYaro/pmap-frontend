# Design

## Context

- The repo is a fresh Vite 8 + React 19 + TypeScript 7 app with Vitest 5 (jsdom, `src/test/setup.ts`),
  oxlint and Prettier. CI runs `lint`, `format:check`, `test` and `build`. There is no `src/api` or
  `src/auth` yet and no env files.
- tsconfig has `erasableSyntaxOnly` and `verbatimModuleSyntax`: no constructor parameter properties or
  enums, and type-only imports use `import type`.
- CloudFront (`infra/frontend.yaml`) sends `/api/*` to the API Gateway with the prefix removed. Caching
  is off and all viewer headers except Host are forwarded, so `Authorization` reaches the gateway.
- The gateway (`pmap-backend/infra/gateway.yaml`) is an HTTP API with a Lambda REQUEST authorizer that
  uses simple responses and has `Authorization` as its identity source. If the header is missing, the
  gateway answers **401** `{"message":"Unauthorized"}` without calling the authorizer. If the authorizer
  denies the token (expired, bad signature, user inactive), the gateway answers **403**
  `{"message":"Forbidden"}`. Authorizer results are cached per token for 300 s.
- The backend (FastAPI) answers `{"detail": ...}`. `/auth/login` returns 401 for wrong credentials and
  `/auth/refresh` returns 401 for an unknown or used refresh token. `require_admin` returns 403
  `{"detail":"Admin role required"}`.

## Goals / Non-Goals

**Goals:**
- One fetch path that every typed call uses, so the bearer header, refresh and retry are in one place.
- The refresh/retry logic can be tested with only `globalThis.fetch` mocked, with no network and no
  library internals.

**Non-Goals:**
- Proactive refresh based on `expires_in`. The value is accepted but not used.
- Sharing the session between tabs. `sessionStorage` is per tab, so each tab has its own session and
  its own refresh token chain.
- Retrying network errors or 5xx responses. Network errors from `fetch` reach the caller as they are
  thrown (a `TypeError`) and are not wrapped in `ApiError`.
- A Vite dev proxy for `/api` (`VITE_API_TARGET` is a natural target for it later).

## Decisions

### Module layout

```
src/api/schema.d.ts   generated, committed
src/api/errors.ts     ApiError + toApiError(response)
src/api/client.ts     api (typed openapi-fetch client) + authFetch
src/auth/tokens.ts    token storage, login, logout, refreshTokens (single flight), onSessionEnded
```

Dependency direction: `client.ts` → `tokens.ts` → `errors.ts`, `schema.d.ts`. `tokens.ts` never imports
`client.ts`, which keeps the refresh request out of the retry path and avoids an import cycle.

### Auth handling as openapi-fetch's custom `fetch`, not middleware

`createClient<paths>({ baseUrl, fetch: authFetch })`. `authFetch(request: Request)` does the work:
1. `request.clone()` is kept for a possible retry (the body can only be read once).
2. It reads the current access token, sets `Authorization` when there is one, and sends the request
   through `globalThis.fetch`, looked up at call time so `vi.stubGlobal` works.
3. If the response is an auth failure (see spec: 401, or 403 with `message` and no `detail`; never
   for `/auth/*`): it calls `refreshTokens(tokenUsed)` and retries the clone once with the new token.
   If the refresh fails, it returns the original response.

Alternative: openapi-fetch `onRequest`/`onResponse` middleware. Rejected because a middleware retry
has to re-enter the library's fetch, and mixing request mutation with retries in middleware makes the
order harder to see. A custom `fetch` is a plain function that can be tested on its own.

Telling a gateway 403 from a backend 403 means reading the body. `authFetch` reads a `clone()` of
any 403, so the caller still gets an unread body.

### Errors are thrown from an `onResponse` middleware

A single middleware runs after `authFetch`. When `!response.ok`, it builds an `ApiError` from a clone of
the response and throws it, so every call either returns data or rejects with `ApiError`. Message rules
are in the spec. The parsing lives in `toApiError(response)` in `errors.ts`, which `tokens.ts` also
uses for login errors.

`ApiError extends Error` with explicit fields `status: number` and `body: unknown`, assigned in the
constructor (no parameter properties, because of `erasableSyntaxOnly`), and `name = 'ApiError'`.

Alternative: return openapi-fetch's `{ data, error }` and let every screen check `error`. Rejected
because the requirement is one error type, and later query hooks expect a rejected promise.

### Base URL is absolute: `${window.location.origin}/api`

openapi-fetch builds a `Request` from `baseUrl + path`. In the browser `/api` alone would work. Under
Vitest's jsdom environment, though, `Request` is Node's (undici), which rejects relative URLs. Taking the
origin from `location` gives the same requests in both environments and still has no configurable
host.

### `tokens.ts` owns storage and the refresh single flight

- State: `let accessToken: string | null` and `let refreshInFlight: Promise<boolean> | null`, plus a
  storage adapter around `sessionStorage` key `pmap.refresh_token`. Every access is in `try/catch`;
  if storage is unavailable, reads return `null`.
- `refreshTokens(tokenUsed)`: if the current access token is non-null and differs from `tokenUsed`,
  it returns `true` at once (another refresh already finished). If a refresh is in flight, it returns
  that promise. Otherwise it starts `POST /api/auth/refresh` and stores the promise. On 2xx it stores
  the new pair. On any other outcome it clears both tokens and calls the session-ended listener once.
  In both cases it clears `refreshInFlight` in `finally`.
- The refresh/login/logout requests use their own openapi-fetch client typed with the same `paths`.
  Its `fetch` only adds the bearer header and never refreshes or retries. It shares the
  throw-on-error middleware, so `login` rejects with `ApiError` directly, and refresh and logout catch
  errors themselves. The shared pieces (`API_BASE_URL`, the call-time `fetch`, the middleware) are in
  `src/api/base.ts`, which both `client.ts` and `tokens.ts` import.
- `onSessionEnded(cb)` registers one listener and returns an unsubscribe function. A second
  registration replaces the first. The app wires this to its router later.
- Test seam: `resetTokensForTests()` (or similar) clears memory state between tests. It is exported
  from the module but not used by app code.

The access token stays in a closure and is never written anywhere. That is why a reloaded tab always
starts with a refresh.

### Type generation

- `openapi-fetch` 0.17.x is a dependency. `openapi-typescript` is **not** a devDependency: 7.13.0
  (the latest) has a `typescript ^5` peer and calls the TypeScript JS compiler API at runtime, while
  this project uses TypeScript 7, a native binary with no JS API. npm also refuses an `overrides`
  entry for that peer. The script therefore runs the generator through `npx` with both versions
  pinned, and the project build stays on TS 7.
- Script: `"api:types": "./scripts/api-types.sh"`. The script takes `VITE_API_TARGET` from the shell
  or, if unset there, from `.env.local` (npm itself does not read env files; `.env.local` is
  git-ignored via `*.local`). It fails with a message naming the variable when neither has it, then
  runs `npx --yes -p typescript@5.9.3 -p openapi-typescript@7.13.0 openapi-typescript
  "$VITE_API_TARGET/openapi.json" -o src/api/schema.d.ts`. The first run downloads both packages into
  the npx cache. To upgrade, change the pinned versions. Alternatives considered: a separate tools
  package with its own lockfile (a second npm project to maintain) and downgrading the app to TS 5.9
  (gives up TS 7).
- `src/api/schema.d.ts` is added to `.prettierignore`, so CI's `format:check` does not depend on the
  generator's formatting. The file stays covered by `tsc -b`.

## Risks / Trade-offs

- [The 403 detection depends on the gateway's error body shape] → The rule is narrow (403 + `message` +
  no `detail`) and has tests for both kinds of 403. If the gateway later returns 401 for denied tokens,
  the 401 path already covers it and the 403 rule becomes dead code that does no harm.
- [Authorizer cache: a token that expired up to 300 s ago may still be accepted] → This is gateway
  behavior and does not affect the client. Requests just succeed for a little longer.
- [A refresh that reaches the server but whose response is lost burns the refresh token] → Treated as a
  failed refresh: the session ends and the user logs in again. A retry would only send a refresh token
  that is already used.
- [A retry repeats a non-idempotent request (`POST /exports`)] → Only after a 401/gateway-403, which
  means the backend never saw the request. Retry happens at most once.
- [openapi-fetch internals (custom `fetch` signature, middleware throwing)] → Pinned to the 0.17 line.
  Tests go through the public `api` object, so an upgrade that breaks either shows up in CI.
- [Requests started before login carry no header and fail with 401 + no refresh token] → The call
  surfaces `ApiError` 401. The session-ended callback is not called because no session existed.
