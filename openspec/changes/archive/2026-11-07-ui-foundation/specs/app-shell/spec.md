# Spec Delta

## MODIFIED Requirements

### Requirement: Routes and placeholder pages
The app SHALL serve these routes, each inside the shared layout: `/`, `/analytics`, `/transactions/:id` and
`/admin`. The `/` route keeps showing the territories preview. `/analytics` and `/admin` SHALL show a placeholder
page with a heading naming the page. The `/transactions/:id` page SHALL show the id from the URL. The routes
`/login` and `/transactions` SHALL NOT exist and SHALL show the not-found page.

#### Scenario: Known route renders its page
- **WHEN** the user opens `/analytics`
- **THEN** the layout is shown with a heading for the analytics page

#### Scenario: Id is shown on the detail page
- **WHEN** the user opens `/transactions/42`
- **THEN** the detail placeholder shows `42`

#### Scenario: Removed route
- **WHEN** the user opens `/login`
- **THEN** the not-found page is shown inside the layout

### Requirement: Header navigation
The layout SHALL show a sticky top bar with the PMAP brand linking to `/`, and navigation links "Transactions"
(`/`) and "Analytics" (`/analytics`). A "Admin" link (`/admin`) SHALL NOT be shown yet. The bar SHALL have an
empty slot on the right for the login control, followed by the theme toggle. Following a link SHALL change the
page without a full reload, and the link of the current page SHALL be marked as current.

#### Scenario: Navigating by link
- **WHEN** the user clicks the "Analytics" link
- **THEN** the analytics page is shown and that link is marked as the current page

#### Scenario: Transactions link is current on the home route
- **WHEN** the user opens `/`
- **THEN** the "Transactions" link is marked as the current page and "Analytics" is not

#### Scenario: Admin link is not offered
- **WHEN** the user opens any page
- **THEN** the header has no "Admin" link

#### Scenario: Top bar stays visible
- **WHEN** the page is scrolled down
- **THEN** the top bar stays at the top of the viewport

## ADDED Requirements

### Requirement: Content container
Page content SHALL be rendered inside a container at most `80rem` wide, centred, with horizontal padding that
keeps text off the viewport edge down to a 360px wide screen.

#### Scenario: Narrow screen
- **WHEN** the viewport is 360px wide
- **THEN** page content has side padding and the page does not scroll horizontally
