# api-client Specification

## Purpose

Gives the frontend typed access to the PMAP backend under the same-origin `/api` prefix and turns
every failed response into one error type with a readable message and the HTTP status.

## Requirements

### Requirement: Requests go to the same-origin /api prefix
The client SHALL send every backend request to the page's own origin with the path prefixed by
`/api`. For example, the backend route `/transactions` is requested as `/api/transactions`. The
client SHALL NOT need CORS or a configurable backend host at runtime.

#### Scenario: Backend route is requested under /api
- **WHEN** the app requests the backend route `GET /transactions/{id}` with id `12`
- **THEN** the browser sends `GET <page origin>/api/transactions/12`

### Requirement: Request and response types come from the backend OpenAPI document
Paths, parameters, request bodies and response bodies SHALL be typed from a committed schema file
generated from the backend's `GET /openapi.json`. Calling a path that is not in the schema, or
sending a body that does not match it, SHALL be a type error.

#### Scenario: Unknown path is rejected at compile time
- **WHEN** code calls the client with a path that is not in the generated schema
- **THEN** the TypeScript build fails

#### Scenario: Schema is regenerated from the configured backend
- **GIVEN** the environment variable `VITE_API_TARGET` holds the backend base URL
- **WHEN** a developer runs `npm run api:types`
- **THEN** `src/api/schema.d.ts` is rewritten from `$VITE_API_TARGET/openapi.json`

#### Scenario: Regeneration without a target fails clearly
- **WHEN** a developer runs `npm run api:types` without `VITE_API_TARGET` set
- **THEN** the command exits non-zero with a message naming `VITE_API_TARGET`, and the committed
  schema file stays unchanged

### Requirement: Successful calls return the typed response body
A call that gets a 2xx response SHALL return the parsed response body typed from the schema. A 204
response SHALL complete without a body.

#### Scenario: Public read succeeds
- **WHEN** the app requests `GET /territories` and the backend answers 200 with a JSON list
- **THEN** the call returns that list

### Requirement: Failed calls raise one ApiError
Any non-2xx response SHALL make the call fail with an `ApiError`. The `ApiError` carries the HTTP
status, a human-readable message, and the parsed response body (if there is one).

#### Scenario: Error carries status and body
- **WHEN** the backend answers 404 with `{"detail": "Transaction not found"}`
- **THEN** the call fails with an `ApiError` whose status is 404 and whose body is the parsed JSON

### Requirement: ApiError message from a string detail
When the error body is `{"detail": "<text>"}` with a string, the `ApiError` message SHALL be that
text unchanged.

#### Scenario: String detail
- **WHEN** the backend answers 401 with `{"detail": "Invalid login or password"}`
- **THEN** the `ApiError` message is `Invalid login or password` and its status is 401

### Requirement: ApiError message from a validation error list
When `detail` is a list of validation errors (FastAPI 422 shape: items with `loc` and `msg`), the
message SHALL list every item as `<field>: <msg>`, joined with `; `. `<field>` is `loc` without its
leading `body`, `query`, `path`, `header` or `cookie` part, with the rest joined by `.`. If nothing is
left of `loc`, only `<msg>` is shown.

#### Scenario: Two missing fields
- **WHEN** the backend answers 422 with `detail` items `{loc: ["body","login"], msg: "Field required"}`
  and `{loc: ["body","password"], msg: "Field required"}`
- **THEN** the `ApiError` message is `login: Field required; password: Field required` and its status
  is 422

#### Scenario: Nested field location
- **WHEN** a `detail` item has `loc: ["query","filter","year"]` and `msg: "Input should be a valid integer"`
- **THEN** that item reads `filter.year: Input should be a valid integer`

### Requirement: ApiError message for other bodies
When the body has no usable `detail` but has a string `message` (the API Gateway's own errors, such as
`{"message": "Forbidden"}`), the message SHALL be that string. When the body is empty, not JSON, or
has neither, the message SHALL be `Request failed with status <status>`.

#### Scenario: Gateway error body
- **WHEN** the gateway answers 403 with `{"message": "Forbidden"}` and no refresh applies
- **THEN** the `ApiError` message is `Forbidden` and its status is 403

#### Scenario: Body that is not JSON
- **WHEN** a response has status 502 and an HTML body
- **THEN** the `ApiError` message is `Request failed with status 502`
