# page-titles Specification

## Purpose
Gives every page a distinct, meaningful browser tab title and the page metadata, so users and assistive technology can
tell pages apart and bookmarks are readable.

## Requirements

### Requirement: Title per page
Each page SHALL set the document title to "<page name> · PMAP" while it is shown: "Transactions", "Analytics", "Admin",
"Transaction <id>", "Page not found", "Access denied". When the route changes, the title SHALL change with it. A transaction
page whose id is not a valid id SHALL use "Transaction" without an id.

#### Scenario: Home
- **WHEN** the user opens `/`
- **THEN** the document title is "Transactions · PMAP"

#### Scenario: Navigating
- **GIVEN** the user is on `/`
- **WHEN** the user follows the "Analytics" link
- **THEN** the document title is "Analytics · PMAP"

#### Scenario: Detail
- **WHEN** the user opens `/transactions/42`
- **THEN** the document title is "Transaction 42 · PMAP"

#### Scenario: Unknown path
- **WHEN** the user opens `/does-not-exist`
- **THEN** the document title is "Page not found · PMAP"

#### Scenario: Forbidden
- **GIVEN** the user is authenticated without the admin role
- **WHEN** the user opens `/admin`
- **THEN** the document title is "Access denied · PMAP"

### Requirement: Static head
The HTML document SHALL have the title "PMAP", a `description` meta tag, a `theme-color` meta tag for each colour scheme and
the app icon. The static title SHALL be what a page shows before the app starts.

#### Scenario: Initial document
- **WHEN** `index.html` is served
- **THEN** it has the title "PMAP", a description meta tag, a theme-color meta tag and the favicon link
