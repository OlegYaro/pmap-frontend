# admin-runs-list Specification

## Purpose
Defines the table of recent sync runs on the admin page: what each row shows, how many runs are listed, how the table
stays current while a run is going, and its loading, empty and error states.

## Requirements

### Requirement: Runs table
The Runs tab SHALL list the runs returned by `GET /admin/runs`, in the order the server returns them (newest first), in a
table with the columns "Run", "Trigger", "Started", "Finished", "Progress", "Not published" and "Failed". "Run" SHALL
show the first 8 characters of the run id, with the whole id as the cell's title. "Trigger" SHALL show "Manual" or
"Scheduled".

#### Scenario: Columns
- **GIVEN** the server returns a run with id `1a2b3c4d-0000-0000-0000-000000000000` and trigger `schedule`
- **WHEN** the tab is shown
- **THEN** the table has the seven listed columns and the row shows `1a2b3c4d` and "Scheduled"

### Requirement: Times, progress and failures
"Started" and "Finished" SHALL be locale date-times, "Finished" reading "Running" while the run has no finish time.
"Progress" SHALL show `done / total` as text together with a bar filled to that share (an empty bar when `total` is 0).
"Failed" SHALL be in the destructive colour when above 0 and also marked by an icon, so colour is not the only cue.

#### Scenario: One finished run
- **GIVEN** the server returns a run with `total` 10, `done` 8, `not_published` 1, `failed` 1, a start and a finish time
- **WHEN** the tab is shown
- **THEN** its row shows `8 / 10`, a bar filled to 80 %, "1" under "Not published" and "1" in the failed cell marked as a problem

#### Scenario: Unfinished run
- **GIVEN** a run has `finished_at` `null`
- **WHEN** the table is shown
- **THEN** its "Finished" cell reads "Running"

#### Scenario: Run without tasks
- **GIVEN** a run has `total` 0
- **WHEN** the table is shown
- **THEN** its progress reads `0 / 0` with an empty bar

### Requirement: Number of runs
A "Show" selector with the choices 20, 50 and 100 SHALL set the `limit` of the request, 20 by default, and SHALL be kept
in the URL as `limit`. A value in the URL that is not one of the three SHALL mean 20.

#### Scenario: Larger list
- **WHEN** the user chooses 50
- **THEN** `GET /admin/runs?limit=50` is requested and the URL has `limit=50`

### Requirement: Live refresh
While any listed run has no finish time the table SHALL be requested again every 5 seconds; when every run is finished
it SHALL stop. It SHALL also refresh when the user presses a "Refresh" button, and stop polling when the page is left.

#### Scenario: Polling while running
- **GIVEN** the list has a run without `finished_at`
- **WHEN** 5 seconds pass
- **THEN** the list is requested again

#### Scenario: Polling stops
- **GIVEN** the list was polling
- **WHEN** a response arrives in which every run is finished
- **THEN** no further automatic requests are made

### Requirement: Selecting a run
Each row SHALL have a control that selects the run, shown as a button named "Details for run <short id>". Selecting SHALL
keep the run id in the URL as `run` and show its detail (see admin-run-detail); the selected row SHALL be marked.

#### Scenario: Select a run
- **WHEN** the user activates "Details for run 1a2b3c4d"
- **THEN** the URL has `run=` that run's id and the detail panel shows it

### Requirement: Runs list states
While loading the tab SHALL show a skeleton table; with no runs it SHALL say "No runs yet"; when the request fails it
SHALL show the error message with a "Retry" button. A response that does not match the documented shape SHALL be
treated as an error. A failed refresh SHALL NOT remove rows already shown.

#### Scenario: Empty
- **GIVEN** the server returns `[]`
- **WHEN** the tab is shown
- **THEN** it reads "No runs yet"

#### Scenario: Error and retry
- **GIVEN** the request fails with 502
- **WHEN** the tab is shown
- **THEN** an error with the message and "Retry" is shown, and "Retry" requests the list again

#### Scenario: Malformed response
- **GIVEN** the server returns a run whose `total` is a string
- **WHEN** the tab is shown
- **THEN** the error state is shown instead of the table
