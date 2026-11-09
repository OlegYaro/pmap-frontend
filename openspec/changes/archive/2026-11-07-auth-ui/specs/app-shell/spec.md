# Spec Delta

## MODIFIED Requirements

### Requirement: Routes and placeholder pages
The app SHALL serve these routes, each inside the shared layout: `/`, `/analytics`, `/transactions/:id` and
`/admin`. The `/` route keeps showing the territories preview. `/analytics` SHALL show a placeholder page with a
heading naming the page. `/admin` SHALL be reached through the admin guard and, for an admin, SHALL show a placeholder
page with the heading "Admin". The `/transactions/:id` page SHALL show the id from the URL. The routes `/login` and
`/transactions` SHALL NOT exist and SHALL show the not-found page.

#### Scenario: Known route renders its page
- **WHEN** the user opens `/analytics`
- **THEN** the layout is shown with a heading for the analytics page

#### Scenario: Admin placeholder for an admin
- **GIVEN** the user is authenticated as admin
- **WHEN** the user opens `/admin`
- **THEN** the layout is shown with the heading "Admin"

#### Scenario: Id is shown on the detail page
- **WHEN** the user opens `/transactions/42`
- **THEN** the detail placeholder shows `42`

#### Scenario: Removed route
- **WHEN** the user opens `/login`
- **THEN** the not-found page is shown inside the layout

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
