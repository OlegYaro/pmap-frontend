# Tasks

## 1. Dependencies and generated schema

- [x] 1.1 Install `openapi-fetch` 0.17.x as a dependency (`openapi-typescript` is not installed: it needs TypeScript 5, see design.md); verify `npm ci` succeeds and `openapi-fetch` appears in `package.json` and `package-lock.json`
- [x] 1.2 Add the `api:types` script from design.md (`scripts/api-types.sh`: `VITE_API_TARGET` from the shell or `.env.local`, `npx` with pinned `typescript@5.9.3` + `openapi-typescript@7.13.0`, `$VITE_API_TARGET/openapi.json` → `src/api/schema.d.ts`); verify `npm run api:types` works with only `.env.local` set and, with `VITE_API_TARGET` set nowhere, exits non-zero with a message naming the variable
- [x] 1.3 Generate and commit `src/api/schema.d.ts` with `VITE_API_TARGET` set to the deployed gateway (`ApiUrl` of `pmap-dev-gateway`) or the site's `/api`; verify the file contains `/auth/login`, `/auth/refresh`, `/auth/logout`, `/transactions/{transaction_id}`, `/exports` and `/admin/runs`. If no deployment is reachable, ask the user for the URL instead of hand-writing the schema
- [x] 1.4 Add `src/api/schema.d.ts` to `.prettierignore`; verify `npm run format:check`, `npm run lint` and `npm run build` pass with the generated file present
- [x] 1.5 Add a short "API types" section to `README.md` describing `VITE_API_TARGET` and `npm run api:types`; verify the documented command matches the script in `package.json`

## 2. ApiError

- [x] 2.1 Implement `ApiError` (status, message, body; explicit fields, no parameter properties) and `toApiError(response)` in `src/api/errors.ts` following the message rules in `specs/api-client/spec.md`; verify `tsc -b` passes
- [x] 2.2 Add `src/api/errors.test.ts` covering: string `detail`; 422 list → `login: Field required; password: Field required`; nested `loc` → `filter.year: ...`; `loc` with only a source part → just `msg`; gateway `{"message": "Forbidden"}`; empty and non-JSON bodies → `Request failed with status <n>`; status and parsed body kept; verify `npm run test` passes

## 3. Token module

- [x] 3.1 Implement `src/auth/tokens.ts`: in-memory access token, refresh token in `sessionStorage` (key `pmap.refresh_token`, every access in try/catch), `getAccessToken`, `clearTokens`, `onSessionEnded(cb)` returning an unsubscribe function, and a test reset helper; verify nothing outside this file touches `sessionStorage` (`grep -r sessionStorage src` hits only `tokens.ts` and its test)
- [x] 3.2 Implement `login({login, password})` and `logout()` on a plain typed openapi-fetch client (no auth fetch). Login stores the pair on success and throws `toApiError` on failure without changing the stored tokens. Logout always clears both tokens and never calls the session-ended listener. Verify `tsc -b` passes
- [x] 3.3 Implement `refreshTokens(tokenUsed)` with the single flight from design.md: return early when the token was already replaced, share the in-flight promise, store the new pair on 2xx, clear tokens and notify the listener once on any failure, reset the in-flight promise in `finally`; verify `tsc -b` passes
- [x] 3.4 Add `src/auth/tokens.test.ts` (fetch stubbed with `vi.stubGlobal`) covering: login stores the access token in memory and the refresh token in `sessionStorage`, and never puts the access token in either storage; wrong password → `ApiError` 401 with tokens unchanged and no listener call; logout clears tokens on a 500 and on a network error; two concurrent `refreshTokens` calls → one request; refresh 401 → tokens cleared and listener called once; verify `npm run test` passes

## 4. Typed client with refresh and retry

- [x] 4.1 Implement `authFetch` in `src/api/client.ts`: clone the request, set the bearer header when a token is held, call `globalThis.fetch` at call time, detect auth failures (401, or 403 whose cloned JSON body has `message` and no `detail`; never for `/auth/*` paths), call `refreshTokens(tokenUsed)`, and retry the clone once with the new token; verify `tsc -b` passes
- [x] 4.2 Export `api = createClient<paths>({ baseUrl: \`${window.location.origin}/api\`, fetch: authFetch })` with an `onResponse` middleware that throws `toApiError` for non-2xx responses; verify that calling an unknown path in a throwaway type check fails `tsc -b` (then remove it)
- [x] 4.3 Add `src/api/client.test.ts` (fetch stubbed, tokens reset in `beforeEach`) covering: request URL is `<origin>/api/...`; `Authorization` present with a token and absent without; 401 → exactly one refresh → retry with the new token and same body → caller gets the retry's data; three parallel 401s → one refresh and three retries; late 401 after a finished refresh → retry with no new refresh; failed refresh → both tokens cleared, callback called once, call rejects with `ApiError` 401, no retry; gateway 403 `{"message":"Forbidden"}` → refresh + retry; backend 403 `{"detail":"Admin role required"}` → no refresh, `ApiError` with that message; 401 from `/auth/login` → no refresh; second auth failure on the retry → `ApiError`, no second refresh; no refresh token → no refresh, no callback; verify `npm run test` passes

## 5. Integration check

- [x] 5.1 Run the CI sequence locally (`npm run lint`, `npm run format:check`, `npm run test`, `npm run build`); verify all four pass and the built bundle has no reference to `localStorage` from the new code
