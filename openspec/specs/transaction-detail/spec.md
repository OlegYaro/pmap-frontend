# transaction-detail Specification

## Purpose
Shows one transaction with every field the backend returns, so a user who opened a row of the list can read all its values, the three price levels and the raw source attributes.

## Requirements

### Requirement: Transaction is requested by the id in the URL
The page at `/transactions/:id` SHALL request `GET /transactions/{id}` once for the id in the URL and show its result. The request needs no token. An id that is not a positive whole number SHALL not be requested and SHALL show the "not found" state.

#### Scenario: Request
- **WHEN** the user opens `/transactions/42`
- **THEN** one request is sent to `/api/transactions/42`

#### Scenario: Bad id
- **WHEN** the user opens `/transactions/abc`
- **THEN** no request is sent and the "Transaction not found" state is shown

### Requirement: Header and status
The page header SHALL show the title "Transaction" followed by the id, and the address as its description (or a dash when missing). A status badge SHALL show "Clean" for a transaction without an exclusion reason, or the readable reason. A "Back to the list" button SHALL return to the previous list page with its filters, page and sort when the user came from the list, and otherwise go to `/`.

#### Scenario: Clean transaction
- **GIVEN** transaction 42 has `address` "ul. Marszałkowska 1" and no exclusion reason
- **WHEN** the page is shown
- **THEN** the header reads "Transaction 42", the address is the description and the badge says "Clean"

#### Scenario: Excluded transaction
- **GIVEN** transaction 42 has `exclusion_reason` `package_deal`
- **WHEN** the page is shown
- **THEN** the badge says "Package deal"

#### Scenario: Back to the list
- **GIVEN** the user opened the transaction from page 2 of a filtered list
- **WHEN** the user clicks "Back to the list"
- **THEN** page 2 of the same list is shown

#### Scenario: Opened directly
- **GIVEN** the page was opened by a direct link
- **WHEN** the user clicks "Back to the list"
- **THEN** the transactions page at `/` is shown

### Requirement: Fields in groups
The page SHALL show every field of the transaction in labelled groups: Prices (premises, property, transaction, premises price per m²), Premises (usable area, rooms, floor, function, market type), Location (address, city, district, powiat, gmina), and Source (external transaction id, external building id, source version, run id, last update).

#### Scenario: Three price levels
- **GIVEN** a transaction with `price_premises` 500000, `price_property` 520000 and `price_transaction` 600000 and `area_usable` 40
- **WHEN** the page is shown
- **THEN** it shows "500,000 PLN", "520,000 PLN", "600,000 PLN" and the premises price per m² "12,500 PLN" (en-US)

### Requirement: Value formatting
Money SHALL be shown in PLN, areas in m², dates as locale dates, and a missing value as a dash. Powiat and gmina SHALL show their name with the code in brackets, and the code alone while the names are not loaded.

#### Scenario: Missing values
- **GIVEN** a transaction without `rooms`, `district_name` and `price_property`
- **WHEN** the page is shown
- **THEN** each of these shows a dash

#### Scenario: Territory names
- **GIVEN** `powiat_code` `1465` named "Warszawa" and `gmina_code` `1465011` named "Warszawa" in the territory list
- **WHEN** the page is shown
- **THEN** powiat reads "Warszawa (1465)" and gmina reads "Warszawa (1465011)"

### Requirement: Source attributes
The page SHALL list the keys and values of the transaction's `attributes` in a section "Source attributes" that is collapsed by default and can be expanded with the keyboard. A value that is null SHALL be shown as a dash. When there are no attributes the section SHALL say "No attributes".

#### Scenario: Expand
- **GIVEN** a transaction with attributes `{"tran_rodzaj_trans": "wolnyRynek", "lok_vat": null}`
- **WHEN** the user expands "Source attributes"
- **THEN** `tran_rodzaj_trans` shows `wolnyRynek` and `lok_vat` shows a dash

#### Scenario: Manual record
- **GIVEN** a transaction with attributes `{"source": "manual"}`
- **WHEN** the page is shown
- **THEN** a "Manual" badge is shown next to the status

### Requirement: Loading, not found and error
While the transaction loads, the page SHALL show a skeleton with a "Loading" status. A 404 answer SHALL show "Transaction not found" with a link to the list. Any other failure SHALL show the error message with a "Retry" button that requests the transaction again.

#### Scenario: Loading
- **WHEN** the user opens `/transactions/42` and the response has not arrived
- **THEN** a "Loading" status is shown and no field value is shown

#### Scenario: Not found
- **WHEN** the backend answers 404 for `/transactions/999`
- **THEN** "Transaction not found" and a link to the list are shown

#### Scenario: Error and retry
- **GIVEN** the backend answers 502
- **WHEN** the user clicks "Retry" and the backend now returns the transaction
- **THEN** the fields are shown and the error is gone

### Requirement: Admin edit action
The header of a loaded transaction SHALL contain an "Edit" button only when the session is an admin one. Activating it SHALL
open the edit form (see the admin-transaction-edit capability). Anonymous users and non-admin users SHALL NOT see the
button, and it SHALL NOT be present in the not-found, error and loading states.

#### Scenario: Admin sees Edit
- **GIVEN** the user is an admin and transaction 42 is loaded
- **WHEN** the page is shown
- **THEN** the header has an "Edit" button

#### Scenario: Others do not
- **GIVEN** the user is anonymous, or authenticated without the admin role
- **WHEN** transaction 42 is shown
- **THEN** the header has no "Edit" button

#### Scenario: Not found
- **GIVEN** the user is an admin and the server answers 404
- **WHEN** the page is shown
- **THEN** there is no "Edit" button
