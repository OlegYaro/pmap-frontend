# Spec Delta

## Purpose
Lets a logged-in user export the transactions matching the current filters to a CSV file: starting the export,
following its progress, receiving the file, and the states of the export button that show all of this.

## ADDED Requirements

### Requirement: Locked for anonymous users
For an anonymous user the export button SHALL be the locked action for "export": grey, with a lock icon, labelled
"Export CSV", with the tooltip "Log in to export". Activating it SHALL open the login dialog and SHALL NOT call the
API. After the user logs in, the export SHALL NOT start by itself; the button becomes a normal button and the user
presses it again.

#### Scenario: Anonymous click
- **GIVEN** the session is anonymous
- **WHEN** the user clicks "Export CSV"
- **THEN** the login dialog opens and no request to `/exports` is made

#### Scenario: Login does not start the export
- **GIVEN** the login dialog was opened from the export button
- **WHEN** the user logs in successfully
- **THEN** the dialog closes, the button is an enabled "Export CSV" button and no request to `/exports` has been made

### Requirement: Starting an export
For a logged-in user, activating "Export CSV" SHALL send `POST /exports` with the current page's filters as query
parameters, and never `sort`, `order`, `limit`, `after_id` or `after_value`. The response `{id}` identifies the export.
A failed start (any error response or network failure) SHALL show an error toast with the message and leave the button
ready for another try.

#### Scenario: Filters are sent
- **GIVEN** the user is logged in and the transactions page has `powiat_code=0264`, `rooms=2` and `sort=price_premises`
- **WHEN** the user clicks "Export CSV"
- **THEN** `POST /exports` is sent with `powiat_code=0264` and `rooms=2` and without `sort`, `order` or `limit`

#### Scenario: Start fails
- **GIVEN** the server answers the start request with 502
- **WHEN** the user clicks "Export CSV"
- **THEN** an error toast shows the failure, no polling starts and the button is enabled again

### Requirement: Following the export
After a successful start the app SHALL poll `GET /exports/{id}` every 2 seconds. After 30 seconds the interval SHALL
become 5 seconds. A response `pending` keeps polling. The poll SHALL give up 10 minutes after the start with an error
toast saying that the export is taking too long, and the button SHALL become ready again. A failed poll request SHALL
count as an error: polling stops with an error toast.

#### Scenario: Interval backs off
- **GIVEN** an export was started and keeps answering `pending`
- **WHEN** 31 seconds have passed
- **THEN** the status was requested at 2 s, 4 s, ... 30 s, and the next request comes 5 s after the previous one

#### Scenario: Timeout
- **GIVEN** an export keeps answering `pending`
- **WHEN** 10 minutes have passed since the start
- **THEN** polling stops, an error toast says the export is taking too long and the button is enabled

#### Scenario: Poll request fails
- **GIVEN** an export is being followed
- **WHEN** a status request fails with an error
- **THEN** polling stops, an error toast shows the message and the button is enabled

### Requirement: Finished export
When the status is `done`, the app SHALL start the download of the returned `url` and the button SHALL become ready
again. When the status is `failed`, the app SHALL show an error toast with the returned `error` text (or a generic
text when there is none) and the button SHALL become ready again. A response that does not match the documented shape
(status `pending`, `done` or `failed`; `done` needs a `url`) SHALL be treated as an error.

#### Scenario: Done
- **GIVEN** an export is being followed
- **WHEN** the status answers `{"status": "done", "url": "https://files.example/e.csv"}`
- **THEN** the download of that URL starts, polling stops and the button is enabled

#### Scenario: Failed
- **GIVEN** an export is being followed
- **WHEN** the status answers `{"status": "failed", "error": "No rows"}`
- **THEN** an error toast shows "No rows", polling stops and the button is enabled

#### Scenario: Done without a link
- **WHEN** the status answers `{"status": "done"}`
- **THEN** polling stops with an error toast and no download starts

### Requirement: Button states
While an export runs the button SHALL show a spinner and the text "Preparing export...", SHALL stay in the layout at a
stable size, and SHALL be disabled so a second export cannot start. A polite live region SHALL announce that the export
is being prepared and when it has finished or failed.

#### Scenario: Running
- **GIVEN** an export has started
- **WHEN** the status is still `pending`
- **THEN** the button reads "Preparing export...", shows a spinner and is disabled

#### Scenario: No second export
- **GIVEN** an export is running
- **WHEN** the user presses the button or Enter on it
- **THEN** no second `POST /exports` is made

#### Scenario: Announcement
- **WHEN** an export finishes
- **THEN** the live region says that the export is ready

### Requirement: Leaving the page
Leaving the page or unmounting the button SHALL stop the polling and clear its timers. An export that has finished by
then SHALL NOT start a download or show a toast.

#### Scenario: Unmount
- **GIVEN** an export is being followed
- **WHEN** the user navigates to another page
- **THEN** no further status requests are made and no toast or download follows

### Requirement: Export scope on the analytics page
On the analytics page the export SHALL contain the transactions that match the page's current filters (not the
aggregated figures), and the button's tooltip for a logged-in user SHALL say so. The request SHALL contain only the
filters that page uses.

#### Scenario: Tooltip
- **GIVEN** the user is logged in and on the analytics page
- **WHEN** the export button receives focus
- **THEN** the tooltip says that the export contains the transactions matching the current filters

#### Scenario: Analytics filters
- **GIVEN** the user is logged in and the analytics page has the default period and `function=mieszkalna`
- **WHEN** the user clicks "Export CSV"
- **THEN** `POST /exports` carries `date_from`, `date_to` and `function`, and no `exclusion_reason`, `address` or `run_id`
