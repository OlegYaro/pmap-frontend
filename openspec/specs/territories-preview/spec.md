# territories-preview Specification

## Purpose

A temporary home page that proves the app can reach the backend end to end, until the analytics screen replaces it.

## Requirements

### Requirement: Territories preview at the home route
The page at `/` SHALL request `GET /territories` through the typed client and show the first 10 returned
territories, each with its voivodeship, powiat and gmina names. A missing powiat or gmina name SHALL be shown
as an em dash. When the response is empty the page SHALL say so.

#### Scenario: Rows are shown
- **GIVEN** the backend returns 25 territories
- **WHEN** the user opens `/`
- **THEN** exactly the first 10 are listed with their names

#### Scenario: Empty list
- **GIVEN** the backend returns an empty list
- **WHEN** the user opens `/`
- **THEN** the page shows a "no territories" message

### Requirement: Loading state
While the request is pending the page SHALL show a loading message and no rows.

#### Scenario: Pending request
- **WHEN** the user opens `/` and the response has not arrived
- **THEN** a loading message is shown

### Requirement: Error state
When the request fails the page SHALL show an error message containing the ApiError message, with an action
that sends the request again.

#### Scenario: Backend fails
- **WHEN** the user opens `/` and the backend answers 404 with `{"detail": "Not found"}`
- **THEN** the page shows an error containing `Not found` and a retry button

#### Scenario: Retry succeeds
- **GIVEN** the page shows the error state
- **WHEN** the user clicks retry and the backend now returns territories
- **THEN** the rows are shown and the error is gone
