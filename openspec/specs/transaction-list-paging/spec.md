# transaction-list-paging Specification

## Purpose
Defines how the transactions page requests `GET /transactions` from the URL filters and sort, and how it walks
the result with keyset paging when the backend gives no total count.

## Requirements

### Requirement: List request parameters
The first page SHALL be requested from `GET /transactions` with the current filters (arrays as repeated params),
the current `sort` and `order` (always sent, defaults included) and `limit=50`. No other query parameter SHALL be
sent; the request needs no token.

#### Scenario: Filters and sort in the request
- **WHEN** the user opens `/?powiat_code=0264&rooms=2&rooms=3&sort=price_premises&order=asc`
- **THEN** one request is sent to `/api/transactions` with exactly `voivodeship_code=02`, `powiat_code=0264`,
  `rooms=2`, `rooms=3`, `sort=price_premises`, `order=asc` and `limit=50`

#### Scenario: Defaults in the request
- **WHEN** the user opens `/`
- **THEN** the request has exactly `sort=transaction_date`, `order=desc` and `limit=50`

### Requirement: Keyset cursor for the next page
The next page SHALL be requested with the same parameters plus `after_id` set to the `id` of the last row of the shown page and
`after_value` set to that row's value of the sort field as a string (numbers in plain decimal form). `after_value`
SHALL be omitted when the sort field is `id` or the row's value is null.

#### Scenario: Cursor from a date sort
- **GIVEN** the last row of the shown page has `id` 731 and `transaction_date` `2024-05-17`, sorted by `transaction_date`
- **WHEN** the next page is requested
- **THEN** the request has `after_id=731` and `after_value=2024-05-17`

#### Scenario: Cursor from a numeric sort
- **GIVEN** the last row of the shown page has `id` 12 and `price_premises` 455000.5, sorted by `price_premises`
- **WHEN** the next page is requested
- **THEN** the request has `after_id=12` and `after_value=455000.5`

#### Scenario: Null sort value
- **GIVEN** the last row of the shown page has `id` 90 and no `district_name`, sorted by `district_name`
- **WHEN** the next page is requested
- **THEN** the request has `after_id=90` and no `after_value`

#### Scenario: Sorted by id
- **GIVEN** the last row of the shown page has `id` 500, sorted by `id`
- **WHEN** the next page is requested
- **THEN** the request has `after_id=500` and no `after_value`

### Requirement: End of the list
The backend gives no total count. A page with fewer than 50 rows SHALL be treated as the last one, and a page
of exactly 50 rows SHALL mean more rows may follow.

#### Scenario: Short page
- **WHEN** the first page returns 37 rows
- **THEN** no further page can be requested

#### Scenario: Full page
- **WHEN** the first page returns 50 rows
- **THEN** a next page can be requested

#### Scenario: Full page followed by an empty one
- **GIVEN** the first page returned 50 rows
- **WHEN** the user opens the next page and it returns no rows
- **THEN** the page shows "No more rows" and "Previous" and "First page" stay available

### Requirement: Paging restarts on filter or sort change
When the filters or the sort change, the list SHALL show page 1 without a cursor.

#### Scenario: Filter change after loading more
- **GIVEN** the user is on page 3
- **WHEN** the user removes a filter chip
- **THEN** the next request has no `after_id` and page 1 is shown

### Requirement: Page navigation
Below the table the page SHALL show which rows are shown ("Rows 51–100") and the page number ("Page 2"), and the buttons "First page", "Previous" and "Next". "First page" and "Previous" SHALL be hidden on page 1. "Next" SHALL be disabled when the shown page has fewer than 50 rows. Each button SHALL request exactly one page and show only that page's rows, and the table SHALL scroll back to its top.

#### Scenario: Second page
- **GIVEN** the first page returned 50 rows
- **WHEN** the user clicks "Next" and the page returns 20 rows
- **THEN** only those 20 rows are shown, the footer says "Rows 51–70" and "Page 2", and "Next" is disabled

#### Scenario: Back to the first page
- **GIVEN** the user is on page 3
- **WHEN** the user clicks "First page"
- **THEN** page 1 is shown without a cursor in its request

#### Scenario: Previous
- **GIVEN** the user is on page 2
- **WHEN** the user clicks "Previous"
- **THEN** page 1 is shown

#### Scenario: Button while loading
- **WHEN** the user clicks "Next" and the response has not arrived
- **THEN** the buttons are disabled and a second click sends no request

### Requirement: Page position survives opening a transaction
The page position SHALL be kept in the browser history entry of the list, so opening a transaction and going Back shows the same page again. A new filter or sort entry SHALL start at page 1.

#### Scenario: Back from the detail
- **GIVEN** the user is on page 2 and opens a transaction
- **WHEN** the user goes Back
- **THEN** page 2 is shown

### Requirement: Failed page
When a requested page fails, the page SHALL show an error with the ApiError message and a "Retry" button that requests the same page again, and a "First page" button when the page is not the first.

#### Scenario: Retry a failed page
- **GIVEN** the user is on page 1 with 50 rows and clicks "Next" and the page answers 502
- **WHEN** the user clicks "Retry" and the backend now returns 10 rows
- **THEN** page 2 with 10 rows is shown and the retried request had the same `after_id`
