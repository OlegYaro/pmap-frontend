# admin-transaction-create Specification

## Purpose
Defines how an admin adds a transaction by hand from the admin Transactions tab.

## Requirements

### Requirement: New transaction
The "New transaction" button SHALL open the shared form (see admin-transaction-form) titled "New transaction" with every
field empty and the status "Clean". Submitting SHALL send `POST /admin/transactions` containing only the fields the user
filled in (empty fields are left out), with numbers as numbers and the date as `YYYY-MM-DD`.

#### Scenario: Minimal transaction
- **GIVEN** the user chose the powiat `0264` and left everything else empty
- **WHEN** the user submits
- **THEN** the request body is `{"powiat_code": "0264"}`

#### Scenario: Full transaction
- **GIVEN** the user filled powiat `0264`, gmina `0264011`, city "Bielsko", price 450000, area 52.5, rooms 3, floor 2 and date 2026-03-15
- **WHEN** the user submits
- **THEN** the body has those values with `price_premises` 450000, `area_usable` 52.5, `rooms` 3, `floor` 2 and `transaction_date` "2026-03-15"

#### Scenario: Excluded status
- **GIVEN** the user chose the status "Non-market"
- **WHEN** the user submits
- **THEN** the body has `exclusion_reason` `non_market`

### Requirement: After creating
On success (201) the dialog SHALL close, a success toast SHALL say that the transaction was created and contain a link
"View transaction" to `/transactions/<id>` of the new record, and the cached transaction lists SHALL be marked stale so the
next view of the list refetches. The user SHALL stay on the Transactions tab.

#### Scenario: Success
- **GIVEN** the server answers 201 with a transaction of id 777
- **WHEN** the user submits a valid form
- **THEN** the dialog closes and a toast with a link to `/transactions/777` is shown

#### Scenario: Lists refetch
- **GIVEN** the transactions list was loaded earlier
- **WHEN** a transaction is created and the user opens the list
- **THEN** the list is requested again
