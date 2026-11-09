# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Columns fit a desktop screen
At a viewport 1280px wide all eleven columns SHALL be fully visible inside the table's container without sideways scrolling. A long address SHALL be shortened with an ellipsis and keep its full text as a tooltip. On narrower screens the table SHALL scroll sideways inside its container.

#### Scenario: 1280px
- **GIVEN** a page of rows with long addresses
- **WHEN** the page is viewed 1280px wide
- **THEN** the table is not wider than its container and the "Status" column is fully visible

#### Scenario: Narrow desktop
- **WHEN** the page is viewed 900px wide
- **THEN** the table scrolls sideways inside its container and the page has no horizontal scroll
