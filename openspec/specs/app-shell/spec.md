# app-shell Specification

## Purpose

Defines the frame every screen of the app lives in: routes, the shared layout with navigation, data-fetching
defaults and how the dev server reaches the backend.

## Requirements

### Requirement: Routes and placeholder pages
The app SHALL serve these routes, each inside the shared layout: `/` (the transactions page), `/analytics`,
`/transactions/:id` and `/admin`. `/analytics` SHALL show a placeholder page with a heading naming the page.
`/admin` SHALL be reached through the admin guard and, for an admin, show a placeholder page with the heading
"Admin". The `/transactions/:id` page SHALL show the transaction with that id (see the transaction-detail
capability); it is reached from a row of the transactions list.

#### Scenario: Home route shows the transactions page
- **WHEN** the user opens `/`
- **THEN** the layout is shown with the heading "Transactions" and the transactions table

#### Scenario: Known route renders its page
- **WHEN** the user opens `/analytics`
- **THEN** the layout is shown with a heading for the analytics page

#### Scenario: Admin placeholder for an admin
- **GIVEN** the user is authenticated as admin
- **WHEN** the user opens `/admin`
- **THEN** the layout is shown with the heading "Admin"

#### Scenario: Id is shown on the detail page
- **WHEN** the user opens `/transactions/42`
- **THEN** the page requests transaction 42 and shows `42` in its header

#### Scenario: List row leads to the detail placeholder
- **GIVEN** the transactions list shows the row of transaction 42
- **WHEN** the user clicks that row
- **THEN** the detail page of transaction 42 is shown and Back returns to the list with the same filters

### Requirement: Removed routes
The routes `/login` and `/transactions` SHALL NOT exist and SHALL show the not-found page.

#### Scenario: Removed route
- **WHEN** the user opens `/login`
- **THEN** the not-found page is shown inside the layout

### Requirement: Not-found page
A path that matches no route SHALL show a not-found page inside the shared layout, with a link back to `/`.

#### Scenario: Unknown path
- **WHEN** the user opens `/does-not-exist`
- **THEN** the not-found page is shown and the header navigation is still present

### Requirement: Header navigation
The layout SHALL show a sticky top bar with the PMAP brand linking to `/`, and navigation links "Transactions"
(`/`) and "Analytics" (`/analytics`). An "Admin" link (`/admin`) SHALL be shown only when the session is
authenticated with the admin role. The right side of the bar SHALL hold the login control, followed by the theme
toggle. Following a link SHALL change the page without a full reload, and the link of the current page SHALL be
marked as current.

#### Scenario: Navigating by link
- **WHEN** the user clicks the "Analytics" link
- **THEN** the analytics page is shown and that link is marked as the current page

#### Scenario: Transactions link is current on the home route
- **WHEN** the user opens `/`
- **THEN** the "Transactions" link is marked as the current page and "Analytics" is not

#### Scenario: Admin link for an admin
- **GIVEN** the user is authenticated as admin
- **WHEN** the user opens any page
- **THEN** the header has an "Admin" link to `/admin`

#### Scenario: Admin link is not offered
- **GIVEN** the session is anonymous, still loading, or authenticated without the admin role
- **WHEN** the user opens any page
- **THEN** the header has no "Admin" link

#### Scenario: Login control and theme toggle
- **GIVEN** the session is anonymous
- **WHEN** the user opens any page
- **THEN** the right side of the header shows the "Log in" button followed by the theme toggle

#### Scenario: Top bar stays visible
- **WHEN** the page is scrolled down
- **THEN** the top bar stays at the top of the viewport

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

### Requirement: Header fits a phone
The top bar SHALL fit a 360px wide screen without making the page scroll sideways. Below the `sm` breakpoint the brand and the login button SHALL show only their icons and keep their names for assistive technology.

#### Scenario: Header fits a phone
- **WHEN** any page is viewed 360px wide
- **THEN** the brand, both links, the login control and the theme toggle are fully inside the screen and the page has no horizontal scroll

### Requirement: Content container
Page content SHALL be rendered inside a container at most `80rem` wide, centred, with horizontal padding that
keeps text off the viewport edge down to a 360px wide screen.

#### Scenario: Narrow screen
- **WHEN** the viewport is 360px wide
- **THEN** page content has side padding and the page does not scroll horizontally
