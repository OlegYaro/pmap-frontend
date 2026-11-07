# Spec Delta

## MODIFIED Requirements

### Requirement: Loading state
While the first page of the current filters and sort is loading, the page SHALL show skeleton rows in place of
the table, with no page navigation.

#### Scenario: First page pending
- **WHEN** the user opens `/` and the response has not arrived
- **THEN** a "Loading" status and skeleton rows are shown and no transaction row is shown

### Requirement: Table fits any screen
The table header SHALL stay visible while the rows scroll, and rows SHALL show a hover and a visible focus style.
On a screen narrower than the table, the table SHALL scroll horizontally inside its own container and the page
itself SHALL not scroll horizontally.

#### Scenario: Narrow screen
- **WHEN** the page is viewed 360px wide
- **THEN** the table scrolls sideways within its container and the page has no horizontal scroll

#### Scenario: Wide table does not widen the page
- **GIVEN** the table is wider than the content area
- **WHEN** the page is shown
- **THEN** the filters and the footer keep the content width and only the table's own container scrolls sideways
