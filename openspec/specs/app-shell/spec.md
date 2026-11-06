# app-shell Specification

## Purpose

Defines the frame every screen of the app lives in: routes, the shared layout with navigation, data-fetching
defaults and how the dev server reaches the backend.

## Requirements

### Requirement: Routes and placeholder pages
The app SHALL serve these routes, each inside the shared layout: `/`, `/transactions`, `/transactions/:id`,
`/login` and `/admin`. Each route except `/` SHALL show a placeholder page with a heading naming the page. The
`/transactions/:id` page SHALL show the id from the URL.

#### Scenario: Known route renders its page
- **WHEN** the user opens `/transactions`
- **THEN** the layout is shown with a heading for the transactions page

#### Scenario: Id is shown on the detail page
- **WHEN** the user opens `/transactions/42`
- **THEN** the detail placeholder shows `42`

### Requirement: Not-found page
A path that matches no route SHALL show a not-found page inside the shared layout, with a link back to `/`.

#### Scenario: Unknown path
- **WHEN** the user opens `/does-not-exist`
- **THEN** the not-found page is shown and the header navigation is still present

### Requirement: Header navigation
The layout SHALL show a header with links to `/`, `/transactions`, `/login` and `/admin`. Following a link
SHALL change the page without a full reload, and the link of the current page SHALL be marked as current.

#### Scenario: Navigating by link
- **WHEN** the user clicks the "Transactions" link
- **THEN** the transactions page is shown and that link is marked as the current page

### Requirement: Query retry policy
Data fetched through the shared query client SHALL NOT be retried after a response with a 4xx status. Network
failures and 5xx responses SHALL be retried at most twice.

#### Scenario: 4xx is not retried
- **WHEN** a query fails with an ApiError of status 404
- **THEN** the request is sent once and the query ends in the error state

#### Scenario: 5xx is retried
- **WHEN** a query fails with an ApiError of status 503 on every attempt
- **THEN** the request is sent three times in total before the query ends in the error state

### Requirement: Dev server proxies the backend
The dev server SHALL forward every request whose path starts with `/api` to the origin in `VITE_API_TARGET`,
removing the `/api` prefix and rewriting the Host header to the target. The repository SHALL contain a
`.env.example` that names `VITE_API_TARGET`, and `.env.local` SHALL stay out of version control.

#### Scenario: Prefix is stripped
- **GIVEN** `VITE_API_TARGET` is `https://api.example.com`
- **WHEN** the browser requests `/api/territories` from the dev server
- **THEN** the dev server requests `https://api.example.com/territories`

#### Scenario: Local env file is ignored
- **WHEN** a developer creates `.env.local`
- **THEN** `git status` does not list it
