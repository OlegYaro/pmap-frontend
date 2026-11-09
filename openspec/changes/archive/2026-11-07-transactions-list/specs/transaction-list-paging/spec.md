# Spec Delta

## Purpose

Defines how the transactions page requests `GET /transactions` from the URL filters and sort, and how it walks
the result with keyset paging when the backend gives no total count.

## ADDED Requirements

### Requirement: List request parameters
The first page SHALL be requested from `GET /transactions` with the current filters (arrays as repeated params),
the current `sort` and `order` (always sent, defaults included) and `limit=100`. No other query parameter SHALL be
sent; the request needs no token.

#### Scenario: Filters and sort in the request
- **WHEN** the user opens `/?powiat_code=0264&rooms=2&rooms=3&sort=price_premises&order=asc`
- **THEN** one request is sent to `/api/transactions` with exactly `voivodeship_code=02`, `powiat_code=0264`,
  `rooms=2`, `rooms=3`, `sort=price_premises`, `order=asc` and `limit=100`

#### Scenario: Defaults in the request
- **WHEN** the user opens `/`
- **THEN** the request has exactly `sort=transaction_date`, `order=desc` and `limit=100`

### Requirement: Keyset cursor for the next page
The next page SHALL be requested with the same parameters plus `after_id` set to the last loaded row's `id` and
`after_value` set to that row's value of the sort field as a string (numbers in plain decimal form). `after_value`
SHALL be omitted when the sort field is `id` or the row's value is null.

#### Scenario: Cursor from a date sort
- **GIVEN** the last loaded row has `id` 731 and `transaction_date` `2024-05-17`, sorted by `transaction_date`
- **WHEN** the next page is requested
- **THEN** the request has `after_id=731` and `after_value=2024-05-17`

#### Scenario: Cursor from a numeric sort
- **GIVEN** the last loaded row has `id` 12 and `price_premises` 455000.5, sorted by `price_premises`
- **WHEN** the next page is requested
- **THEN** the request has `after_id=12` and `after_value=455000.5`

#### Scenario: Null sort value
- **GIVEN** the last loaded row has `id` 90 and no `district_name`, sorted by `district_name`
- **WHEN** the next page is requested
- **THEN** the request has `after_id=90` and no `after_value`

#### Scenario: Sorted by id
- **GIVEN** the last loaded row has `id` 500, sorted by `id`
- **WHEN** the next page is requested
- **THEN** the request has `after_id=500` and no `after_value`

### Requirement: End of the list
The backend gives no total count. A page with fewer than 100 rows SHALL be treated as the last one, and a page
of exactly 100 rows SHALL mean more rows may follow.

#### Scenario: Short page
- **WHEN** the first page returns 37 rows
- **THEN** no further page can be requested

#### Scenario: Full page
- **WHEN** the first page returns 100 rows
- **THEN** a next page can be requested

#### Scenario: Full page followed by an empty one
- **GIVEN** the first page returned 100 rows
- **WHEN** the next page returns no rows
- **THEN** the 100 rows stay and no further page can be requested

### Requirement: Load more and loaded counter
Below the table the page SHALL show how many rows are loaded ("N loaded") and, while a next page can be
requested, a "Load more" button. Activating it SHALL request exactly one next page and append its rows; the
button SHALL be disabled while that request runs.

#### Scenario: Loading a second page
- **GIVEN** the first page returned 100 rows
- **WHEN** the user clicks "Load more" and the next page returns 20 rows
- **THEN** 120 rows are shown, the counter says "120 loaded" and "Load more" is gone

#### Scenario: Button while loading
- **WHEN** the user clicks "Load more" and the response has not arrived
- **THEN** "Load more" is disabled and a second click sends no request

### Requirement: Paging restarts on filter or sort change
When the filters or the sort change, the loaded rows SHALL be dropped and the list SHALL start again from a
first page without a cursor.

#### Scenario: Filter change after loading more
- **GIVEN** two pages are loaded
- **WHEN** the user removes a filter chip
- **THEN** the next request has no `after_id` and only its rows are shown

### Requirement: Failed next page
When a next page fails, the loaded rows SHALL stay, and an error with a "Retry" button SHALL replace "Load more".
Retry SHALL request the same page again.

#### Scenario: Retry a failed next page
- **GIVEN** 100 rows are loaded and the next page answers 502
- **WHEN** the user clicks "Retry" and the backend now returns 10 rows
- **THEN** 110 rows are shown, the error is gone, and the retried request had the same `after_id`
