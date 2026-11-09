# Spec Delta

## Purpose
Defines how an admin starts a sync run for one powiat or for all of Poland, including the confirmation step and the
protection against starting a second run.

## ADDED Requirements

### Requirement: Start form
The Runs tab SHALL have a "Start sync" control with a searchable powiat select whose first choice is "All of Poland"
(selected by default) and a "Start sync" button. The powiat choices SHALL come from the territory list. While the
territory list loads, only "All of Poland" SHALL be available.

#### Scenario: Default scope
- **WHEN** the tab is shown
- **THEN** the select reads "All of Poland" and the "Start sync" button is enabled

#### Scenario: Choose a powiat
- **GIVEN** the territory list is loaded
- **WHEN** the user types `lodz` in the select and chooses the powiat
- **THEN** the select shows that powiat

### Requirement: Confirmation
Pressing "Start sync" SHALL open a confirmation dialog that states the scope ("Start a sync for all of Poland?" or
"Start a sync for <powiat name> (<code>)?") with the buttons "Start" and "Cancel". Nothing SHALL be requested before
"Start" is pressed; "Cancel" and Escape SHALL close the dialog without a request.

#### Scenario: Cancel
- **WHEN** the user presses "Start sync" and then "Cancel"
- **THEN** the dialog closes and no `POST /admin/runs` was sent

#### Scenario: Scope in the dialog
- **GIVEN** the powiat `0264` is selected
- **WHEN** the user presses "Start sync"
- **THEN** the dialog names that powiat and its code

### Requirement: Starting a run
Confirming SHALL send `POST /admin/runs` with `territory_code` set to the powiat code, or without it for all of Poland.
On success (202, body `{run_id}`) the dialog SHALL close, the runs list SHALL be refreshed, and the new run SHALL be
selected (see admin-runs-list). While the request is pending the dialog's "Start" button SHALL be disabled so a second
request cannot be sent.

#### Scenario: One powiat
- **GIVEN** the powiat `0264` is selected and the dialog is open
- **WHEN** the user presses "Start"
- **THEN** `POST /admin/runs?territory_code=0264` is sent

#### Scenario: Whole country
- **GIVEN** "All of Poland" is selected
- **WHEN** the user confirms
- **THEN** `POST /admin/runs` is sent without `territory_code`

#### Scenario: Success
- **GIVEN** the server answers 202 with `{"run_id": "r1"}`
- **WHEN** the user confirms
- **THEN** the dialog closes, the list is requested again and the detail of run `r1` is shown

### Requirement: Run in progress
The backend turns an "already running" answer into an indistinguishable error, so the page SHALL decide from the loaded
list: while any listed run has no finish time, the "Start sync" button SHALL be disabled (`aria-disabled`, still
focusable) and show the text "A run is in progress".

#### Scenario: Blocked
- **GIVEN** the list has a run with `finished_at` `null`
- **WHEN** the tab is shown
- **THEN** the button reads "A run is in progress" and activating it opens no dialog

#### Scenario: Unblocked
- **GIVEN** the button was blocked
- **WHEN** a refresh shows every run finished
- **THEN** the button reads "Start sync" and is enabled

### Requirement: Start errors
When the start request fails, the dialog SHALL stay open and show the error message with a "Retry" button that sends the
request again. A 502 or any other error SHALL be handled the same way.

#### Scenario: 502
- **GIVEN** the server answers the start request with 502
- **WHEN** the user confirms
- **THEN** the dialog shows the message and a "Retry" button, and no run is selected

#### Scenario: Retry succeeds
- **GIVEN** the dialog shows a start error
- **WHEN** the user presses "Retry" and the server answers 202
- **THEN** the dialog closes and the new run is selected
