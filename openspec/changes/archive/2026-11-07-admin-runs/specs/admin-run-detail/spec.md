# Spec Delta

## Purpose
Defines the detail panel of one sync run: its stage counters, the rows it excluded and the tasks that failed with their
error traces.

## ADDED Requirements

### Requirement: Run counters
The detail of the selected run, from `GET /admin/runs/{run_id}`, SHALL show the run id and start time, and these
counters with their labels: "Total", "Downloaded", "Assigned", "Cleaned", "Loaded", "Not published", "Failed",
"In progress", plus "Inserted" and "Updated" rows. A `null` start time SHALL be shown as "—". The current stage SHALL be
shown when the run has one.

#### Scenario: Counters
- **GIVEN** the run has `total` 10, `downloaded` 10, `assigned` 9, `cleaned` 9, `loaded` 8, `inserted` 120, `updated` 30
- **WHEN** its detail is shown
- **THEN** each counter is shown with its label and value

### Requirement: Excluded rows
The detail SHALL list the `excluded` counts by reason, largest first, each as the readable reason name, the number and a
bar sized relative to the largest count. Reason names SHALL reuse the transaction status labels; an unknown reason SHALL be
shown as it is. An empty object SHALL read "No rows were excluded".

#### Scenario: Ordered list
- **GIVEN** `excluded` is `{"non_market": 5, "package_deal": 20}`
- **WHEN** the detail is shown
- **THEN** "Package deal" with 20 comes before "Non-market" with 5

#### Scenario: Nothing excluded
- **GIVEN** `excluded` is `{}`
- **WHEN** the detail is shown
- **THEN** it reads "No rows were excluded"

### Requirement: Failed tasks
The detail SHALL list `failed_tasks`: for each the territory code, the failed stage, the status and the update time, with
a control that expands its `error_trace` in a monospace block and a "Copy" button that copies the trace. Traces SHALL be
collapsed by default. A task without a trace SHALL say "No trace recorded" when expanded. With no failed tasks the section
SHALL read "No failed tasks".

#### Scenario: Expand a trace
- **GIVEN** a failed task has the trace "Traceback ..."
- **WHEN** the user activates its expand control
- **THEN** the trace is shown in a monospace block and the control is marked expanded

#### Scenario: Copy
- **GIVEN** a trace is expanded
- **WHEN** the user presses "Copy"
- **THEN** the trace text is copied and the button briefly reads "Copied"

#### Scenario: No failures
- **GIVEN** `failed_tasks` is `[]`
- **WHEN** the detail is shown
- **THEN** the section reads "No failed tasks"

### Requirement: Detail refresh and states
While the selected run has no finish time in the runs list, its detail SHALL be requested again every 5 seconds. Loading
SHALL show a skeleton; a failed request SHALL show the message with "Retry"; a 404 SHALL say the run was not found. A
response that does not match the documented shape SHALL be treated as an error. With no run selected the panel SHALL say
"Select a run to see its details".

#### Scenario: Nothing selected
- **WHEN** the Runs tab is shown without a `run` in the URL
- **THEN** the panel reads "Select a run to see its details"

#### Scenario: Not found
- **GIVEN** the URL has `run=` an id the server answers 404 for
- **WHEN** the tab is shown
- **THEN** the panel says the run was not found

#### Scenario: Live detail
- **GIVEN** the selected run has no finish time
- **WHEN** 5 seconds pass
- **THEN** the detail is requested again
