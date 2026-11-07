# Spec Delta

## MODIFIED Requirements

### Requirement: Header navigation
The layout SHALL show a sticky top bar with the PMAP brand linking to `/`, and navigation links "Transactions"
(`/`) and "Analytics" (`/analytics`). An "Admin" link (`/admin`) SHALL be shown only when the session is
authenticated with the admin role. The right side of the bar SHALL hold the login control, followed by the theme
toggle. Following a link SHALL change the page without a full reload, and the link of the current page SHALL be
marked as current. The whole bar SHALL fit a 360px wide screen without making the page scroll sideways: below
the `sm` breakpoint the brand shows only its icon and the login button only its icon, and both keep their names
for assistive technology.

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

#### Scenario: Header fits a phone
- **WHEN** any page is viewed 360px wide
- **THEN** the brand, both links, the login control and the theme toggle are fully inside the screen and the page has no horizontal scroll
