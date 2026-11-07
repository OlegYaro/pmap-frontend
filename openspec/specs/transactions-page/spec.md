# transactions-page Specification

## Purpose
Defines the transactions page at `/`: the filtered, server-sorted table of transactions with its formatting,
sortable headers, row navigation to the detail route, and its loading, empty and error states.

## Requirements

### Requirement: Page layout
The page at `/` SHALL show a page header titled "Transactions", the filter panel with all fields, the active filter
chips, and the table below them. The header's actions area SHALL contain an empty slot reserved for the export
control, with no button in it.

#### Scenario: Layout
- **WHEN** the user opens `/`
- **THEN** the heading "Transactions", the filter controls, the "Active filters" region and the table are shown in
  that order

#### Scenario: Export slot is empty
- **WHEN** the user opens `/`
- **THEN** the page header has the export slot and it contains no button

### Requirement: Table columns
The table SHALL have these columns in order: "Date", "Address", "City", "District", "Price", "Area", "Price/m²",
"Rooms", "Floor", "Market", "Status". Each loaded transaction SHALL be one row.

#### Scenario: Column headers
- **WHEN** the first page is loaded
- **THEN** the column headers are exactly the eleven listed, in order

### Requirement: Cell formatting
Dates SHALL be shown as locale dates, price as a locale number with "PLN", area with "m²", rooms and floor as
numbers (0 shown as `0`). Market SHALL show the readable market type ("Primary", "Secondary"), whichever spelling is stored
(`pierwotny` or `rynekPierwotny`, `wtorny` or `rynekWtorny`), or the raw value when unknown. Any missing value SHALL be shown as "—".

#### Scenario: Formatted row
- **GIVEN** the locale is `en-US` and a row has `transaction_date` `2024-12-31`, `price_premises` 500000,
  `area_usable` 40, `floor` 0 and `market_type` `wtorny`
- **WHEN** the row is shown
- **THEN** its cells show `12/31/2024`, `500,000 PLN`, `40 m²`, floor `0` and `Secondary`

#### Scenario: Missing values
- **GIVEN** a row with no address, district, rooms or market type
- **WHEN** the row is shown
- **THEN** each of those cells shows "—"

#### Scenario: Both spellings of a market type
- **GIVEN** one row has `market_type` `rynekWtorny` and another `wtorny`
- **WHEN** the rows are shown
- **THEN** both Market cells show "Secondary"

### Requirement: Price per square metre
The "Price/m²" cell SHALL show `price_premises` divided by `area_usable`, rounded to whole złoty, with "PLN". It
SHALL show "—" when either value is missing or the area is not greater than 0.

#### Scenario: Computed price per m²
- **GIVEN** the locale is `en-US` and a row has `price_premises` 455000 and `area_usable` 38.5
- **WHEN** the row is shown
- **THEN** the "Price/m²" cell shows `11,818 PLN`

#### Scenario: Missing area
- **GIVEN** a row has `price_premises` 455000 and no `area_usable`
- **WHEN** the row is shown
- **THEN** the "Price/m²" cell shows "—"

### Requirement: Status badge
The "Status" cell SHALL show a badge: "Clean" when the row has no exclusion reason, otherwise the readable label
of the reason (for example "Package deal"), or the raw value when the reason is unknown. Clean and excluded rows
SHALL look different.

#### Scenario: Clean row
- **WHEN** a row without `exclusion_reason` is shown
- **THEN** its status badge reads "Clean"

#### Scenario: Excluded row
- **WHEN** a row with `exclusion_reason` `package_deal` is shown
- **THEN** its status badge reads "Package deal"

#### Scenario: Unknown reason
- **WHEN** a row with `exclusion_reason` `duplicate` is shown
- **THEN** its status badge reads "duplicate"

### Requirement: Sortable headers
The headers "Date", "Address", "City", "District", "Price", "Area", "Rooms", "Floor" and "Market" SHALL be buttons
that sort by `transaction_date`, `address`, `city_name`, `district_name`, `price_premises`, `area_usable`, `rooms`,
`floor` and `market_type`. "Price/m²" and "Status" SHALL not be sortable.

#### Scenario: Non-sortable headers
- **WHEN** the table is shown
- **THEN** "Price/m²" and "Status" are not buttons

### Requirement: Sort by header click
Activating the header of the column that is already sorted SHALL flip the direction. Activating another sortable
header SHALL sort by its field ascending. The sorted column SHALL show a direction icon and expose its direction
to assistive technology; the others SHALL not.

#### Scenario: Default sorted column
- **WHEN** the user opens `/`
- **THEN** the "Date" column is marked as sorted descending and no other column is marked

#### Scenario: Flip the direction
- **GIVEN** the URL is `/`
- **WHEN** the user clicks the "Date" header
- **THEN** the URL search is `?order=asc` and the "Date" column is marked ascending

#### Scenario: Sort by another column
- **GIVEN** the URL is `/?city_name=Kraków`
- **WHEN** the user clicks the "Price" header
- **THEN** the URL search is `?city_name=Krak%C3%B3w&sort=price_premises&order=asc` and the list is requested again
  with that sort

#### Scenario: Sort without a column
- **WHEN** the user opens `/?sort=updated_at`
- **THEN** no column is marked as sorted

### Requirement: Row opens the detail route
Each row SHALL be reachable with the Tab key. Clicking a row, or pressing Enter while it has focus, SHALL navigate
to `/transactions/<id>` of that row as a new history entry.

#### Scenario: Click a row
- **WHEN** the user clicks the row of transaction 42
- **THEN** the location is `/transactions/42`

#### Scenario: Enter on a focused row
- **GIVEN** the row of transaction 42 has keyboard focus
- **WHEN** the user presses Enter
- **THEN** the location is `/transactions/42`

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

### Requirement: Loading state
While the first page of the current filters and sort is loading, the page SHALL show skeleton rows in place of
the table, with no page navigation.

#### Scenario: First page pending
- **WHEN** the user opens `/` and the response has not arrived
- **THEN** a "Loading" status and skeleton rows are shown and no transaction row is shown

### Requirement: Empty state
When the first page has no rows, the page SHALL show "No transactions match these filters" instead of the table.
When any filter is active, it SHALL offer a "Reset" button that removes every filter and keeps the sort.

#### Scenario: Empty with filters
- **GIVEN** the URL is `/?city_name=Nowhere&sort=rooms` and the backend returns no rows
- **WHEN** the user clicks "Reset"
- **THEN** the URL search is `?sort=rooms` and the list is requested again

#### Scenario: Empty without filters
- **GIVEN** the URL is `/` and the backend returns no rows
- **WHEN** the page is shown
- **THEN** the empty message is shown without a "Reset" button

### Requirement: Error state
When the first page fails, the page SHALL show an error containing the ApiError message and a "Retry" button that
requests the first page again.

#### Scenario: First page fails
- **WHEN** the user opens `/` and the backend answers 422 with `{"detail": "Invalid sort"}`
- **THEN** an alert containing `Invalid sort` and a "Retry" button are shown

#### Scenario: Retry succeeds
- **GIVEN** the error state is shown
- **WHEN** the user clicks "Retry" and the backend now returns rows
- **THEN** the rows are shown and the error is gone

### Requirement: Columns fit a desktop screen
At a viewport 1280px wide all eleven columns SHALL be fully visible inside the table's container without sideways scrolling. A long address SHALL be shortened with an ellipsis and keep its full text as a tooltip. On narrower screens the table SHALL scroll sideways inside its container.

#### Scenario: 1280px
- **GIVEN** a page of rows with long addresses
- **WHEN** the page is viewed 1280px wide
- **THEN** the table is not wider than its container and the "Status" column is fully visible

#### Scenario: Narrow desktop
- **WHEN** the page is viewed 900px wide
- **THEN** the table scrolls sideways inside its container and the page has no horizontal scroll
