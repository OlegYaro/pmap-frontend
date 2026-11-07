# Spec Delta

## MODIFIED Requirements

### Requirement: Routes and placeholder pages
The app SHALL serve these routes, each inside the shared layout: `/` (the transactions page), `/analytics`,
`/transactions/:id` and `/admin`. `/analytics` SHALL show a placeholder page with a heading naming the page.
`/admin` SHALL be reached through the admin guard and, for an admin, show a placeholder page with the heading
"Admin". The `/transactions/:id` page SHALL show the id from the URL; it is reached from a row of the transactions
list.

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
- **THEN** the detail placeholder shows `42`

#### Scenario: List row leads to the detail placeholder
- **GIVEN** the transactions list shows the row of transaction 42
- **WHEN** the user clicks that row
- **THEN** the detail placeholder shows `42` and Back returns to the list with the same filters
