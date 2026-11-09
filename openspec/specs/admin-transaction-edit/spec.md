# admin-transaction-edit Specification

## Purpose
Defines how an admin corrects an existing transaction from its page, sending only what changed, and how a record is handed
back to the registry data.

## Requirements

### Requirement: Prefilled edit form
The "Edit" button SHALL open the shared form titled "Edit transaction <id>" with every field set from the loaded
transaction (date as a date, numbers as numbers, status from the exclusion reason).

#### Scenario: Prefilled
- **GIVEN** transaction 42 has powiat `0264`, price 450000 and rooms 3
- **WHEN** the admin presses "Edit"
- **THEN** the form shows that powiat, the price 450000 and the rooms 3

### Requirement: Only changed fields are sent
Submitting SHALL send `PATCH /admin/transactions/{id}` with the fields whose value differs from the loaded transaction and
nothing else. A text, number or date field that held a value and was emptied SHALL be sent as `null`. A field that was empty
and stayed empty SHALL NOT be sent. Changing the status to "Clean" SHALL send `exclusion_reason` `null`. When no field changed
and the registry checkbox is off, the submit button SHALL be disabled.

#### Scenario: One field changed
- **GIVEN** the form was opened for transaction 42 and only the price changed to 460000
- **WHEN** the admin submits
- **THEN** the body is `{"price_premises": 460000}`

#### Scenario: Field cleared
- **GIVEN** transaction 42 has a district "Śródmieście"
- **WHEN** the admin empties "District" and submits
- **THEN** the body has `district_name` `null` and nothing else

#### Scenario: Nothing changed
- **WHEN** the form is open and nothing was changed
- **THEN** the submit button is disabled

### Requirement: Accept registry value
The edit form SHALL have a checkbox "Accept registry value" with the helper text that it hands the record back to the registry
data, so that later syncs may overwrite manual changes. When checked, the body SHALL contain `accept_registry` `true` (in
addition to any changed fields); when unchecked, `accept_registry` SHALL NOT be sent. Checking it alone SHALL enable the
submit button.

#### Scenario: Only the flag
- **WHEN** the admin checks "Accept registry value" and submits without changing a field
- **THEN** the body is `{"accept_registry": true}`

#### Scenario: Flag with a change
- **GIVEN** the price was changed to 460000
- **WHEN** the admin also checks "Accept registry value" and submits
- **THEN** the body is `{"price_premises": 460000, "accept_registry": true}`

#### Scenario: Flag off
- **WHEN** the admin submits a changed form with the checkbox unchecked
- **THEN** the body has no `accept_registry`

### Requirement: After saving
On success (200) the dialog SHALL close, a success toast SHALL say that the transaction was saved, and the transaction detail
and the cached transaction lists SHALL be refetched so the page shows the new values. On 404 the form SHALL show that the
transaction no longer exists; other errors follow the shared form rules.

#### Scenario: Page updates
- **GIVEN** the admin changed the price and the server answers 200
- **WHEN** the admin submits
- **THEN** the dialog closes and the page shows the new price after the detail is refetched

#### Scenario: Transaction vanished
- **GIVEN** the server answers 404
- **WHEN** the admin submits
- **THEN** the form shows that the transaction no longer exists and stays open
