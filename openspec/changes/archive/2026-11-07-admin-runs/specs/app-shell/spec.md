# Spec Delta

## MODIFIED Requirements

### Requirement: Routes and placeholder pages
The app SHALL serve these routes, each inside the shared layout: `/` (the transactions page), `/analytics` (the
analytics page, see the analytics-page capability), `/transactions/:id` and `/admin`. `/admin` SHALL be reached
through the admin guard and, for an admin, show the admin page (see the admin-page capability). The `/transactions/:id`
page SHALL show the transaction with that id (see the transaction-detail capability); it is reached from a row of the
transactions list.

#### Scenario: Home route shows the transactions page
- **WHEN** the user opens `/`
- **THEN** the layout is shown with the heading "Transactions" and the transactions table

#### Scenario: Known route renders its page
- **WHEN** the user opens `/analytics`
- **THEN** the layout is shown with the heading "Analytics" and the analytics sections

#### Scenario: Admin placeholder for an admin
- **GIVEN** the user is authenticated as admin
- **WHEN** the user opens `/admin`
- **THEN** the layout is shown with the heading "Admin" and the admin tabs

#### Scenario: Id is shown on the detail page
- **WHEN** the user opens `/transactions/42`
- **THEN** the page requests transaction 42 and shows `42` in its header

#### Scenario: List row leads to the detail placeholder
- **GIVEN** the transactions list shows the row of transaction 42
- **WHEN** the user clicks that row
- **THEN** the detail page of transaction 42 is shown and Back returns to the list with the same filters
