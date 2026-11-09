# auth-session Specification

## Purpose

Keeps the user's PMAP session in the browser: stores the access and refresh tokens, attaches the
access token to requests, and renews it with the single-use refresh token without making the app or
the user deal with expiry.

## Requirements

### Requirement: Token storage
The access token SHALL be kept in memory only and SHALL NOT be written to any browser storage. The
refresh token SHALL be kept in `sessionStorage`, so it survives a reload of the tab and is gone when
the tab closes. If `sessionStorage` cannot be used, the session SHALL behave as if no refresh token is
stored.

#### Scenario: Reload keeps the session
- **GIVEN** the user is logged in
- **WHEN** the tab is reloaded
- **THEN** no access token is held, the refresh token is still in `sessionStorage`, and the next
  protected request gets a new access token through a refresh

#### Scenario: Access token is never persisted
- **WHEN** a login or refresh succeeds
- **THEN** neither `sessionStorage` nor `localStorage` contains the access token

### Requirement: Login
Logging in SHALL send `POST /auth/login` with `{login, password}`. On success it SHALL store the
returned access and refresh tokens, replacing any held before. On failure it SHALL fail with the
`ApiError` from the response and SHALL leave the stored tokens as they were.

#### Scenario: Successful login
- **WHEN** login is called with valid credentials and the backend answers 200 with a token pair
- **THEN** the access token is held in memory and the refresh token is in `sessionStorage`

#### Scenario: Wrong password
- **WHEN** the backend answers 401 `{"detail": "Invalid login or password"}`
- **THEN** login fails with an `ApiError` (status 401, that message), no refresh is attempted, and the
  session-ended callback is not called

### Requirement: Logout
Logging out SHALL send `POST /auth/logout` with the stored refresh token (when there is one) and SHALL
clear both tokens whatever the server answers, including a network failure. An explicit logout SHALL
NOT call the session-ended callback.

#### Scenario: Logout clears tokens even if the server fails
- **WHEN** logout is called and `POST /auth/logout` answers 500
- **THEN** both tokens are cleared

### Requirement: Bearer header
Every backend request SHALL carry `Authorization: Bearer <access_token>` while an access token is held,
on public and protected routes alike. With no access token held, the header SHALL be absent.

#### Scenario: Header present after login
- **GIVEN** an access token `A1` is held
- **WHEN** the app requests `GET /exports/{export_id}`
- **THEN** the request carries `Authorization: Bearer A1`

#### Scenario: No header when logged out
- **GIVEN** no access token is held
- **WHEN** the app requests `GET /transactions`
- **THEN** the request carries no `Authorization` header

### Requirement: Auth failure detection
A response SHALL count as an auth failure when its status is 401, or when its status is 403 and its
JSON body has a `message` and no `detail` (the API Gateway authorizer refusing a missing, expired or
invalid token). A 403 whose body has `detail` comes from the backend (for example `Admin role
required`) and SHALL NOT count. Responses to `/auth/*` requests SHALL NOT count.

#### Scenario: Gateway refuses an expired token
- **WHEN** a request to `/admin/runs` gets 403 `{"message": "Forbidden"}`
- **THEN** it is treated as an auth failure

#### Scenario: Backend refuses a non-admin
- **WHEN** a request to `/admin/runs` gets 403 `{"detail": "Admin role required"}`
- **THEN** no refresh happens and the call fails with that `ApiError`

### Requirement: Refresh and retry once
On an auth failure, when a refresh token is stored, the client SHALL obtain a new token pair via
`POST /auth/refresh` and then send the original request again once, with the same method, URL and body
and the new access token. The caller SHALL get the result of the retry. If the retry also ends in an auth
failure, the call SHALL fail with its `ApiError` and no further refresh SHALL happen for that call.

#### Scenario: Expired token is renewed transparently
- **GIVEN** a stored refresh token `R1` and an expired access token
- **WHEN** `POST /exports` gets 401 and `POST /auth/refresh` with `R1` returns `{A2, R2}`
- **THEN** exactly one refresh request is sent, `POST /exports` is sent again with the same body and
  `Authorization: Bearer A2`, the call returns the retry's result, and `R2` replaces `R1`

#### Scenario: No refresh token stored
- **GIVEN** no refresh token is stored
- **WHEN** a protected request gets 401
- **THEN** no refresh request is sent, the call fails with an `ApiError` of status 401, and the
  session-ended callback is not called

### Requirement: Single-flight refresh
At most one `POST /auth/refresh` SHALL be in flight at any time. Auth failures that happen while it is
in flight SHALL wait for it and then retry with its result. A request that fails with an access token
that has since been replaced SHALL retry with the current token without starting a new refresh.

#### Scenario: Three parallel auth failures
- **GIVEN** a stored refresh token and an expired access token
- **WHEN** three protected requests are sent at the same time and all three get 401
- **THEN** exactly one `POST /auth/refresh` is sent, and each of the three requests is retried once
  with the new access token

#### Scenario: Late failure after a finished refresh
- **GIVEN** request B was sent with access token `A1`, and a refresh already replaced `A1` with `A2`
- **WHEN** B's response is a 401
- **THEN** B is retried with `A2` and no new refresh request is sent

### Requirement: Failed refresh ends the session
If the refresh does not return a new token pair (any non-2xx answer or a network failure), the client
SHALL clear both tokens, call the session-ended callback registered by the app exactly once for that
refresh, and make every request waiting on it fail with an `ApiError` of its original auth failure.

#### Scenario: Refresh token rejected
- **GIVEN** a session-ended callback is registered and a refresh token is stored
- **WHEN** a protected request gets 401 and `POST /auth/refresh` answers 401
- **THEN** both tokens are cleared, the callback is called once, the original request is not retried,
  and the call fails with an `ApiError` of status 401

#### Scenario: Parallel requests share one failed refresh
- **WHEN** three parallel protected requests get 401 and the single refresh fails
- **THEN** the callback is called once and all three calls fail with an `ApiError`

### Requirement: One place for token handling
Storing, reading and clearing tokens, and the login, logout and refresh requests, SHALL live in a
single module (`src/auth/tokens.ts`). The rest of the client SHALL use only that module's functions
and SHALL NOT touch `sessionStorage` or the refresh token directly.

#### Scenario: Refresh token storage is moved
- **WHEN** the refresh token later moves to an HTTP-only cookie
- **THEN** only `src/auth/tokens.ts` needs to change
