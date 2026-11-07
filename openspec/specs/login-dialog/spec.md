# login-dialog Specification

## Purpose
The single place where a user or an admin logs in: a modal form reachable from anywhere in the app, opened by the
header button, a locked action or the admin guard.

## Requirements

### Requirement: Login dialog opening
The login SHALL be a modal dialog titled "Log in", not a separate page. Any part of the app SHALL be able to open it
with an optional reason, which the dialog SHALL show above the form. Without a reason no reason text SHALL be shown.

#### Scenario: Opened with a reason
- **WHEN** the dialog is opened with the reason "Admin area, please log in"
- **THEN** a modal dialog "Log in" is shown with the text "Admin area, please log in"

#### Scenario: Closing
- **GIVEN** the dialog is open
- **WHEN** the user presses Escape or the close button
- **THEN** the dialog closes, no request is sent, and the next opening shows an empty form

### Requirement: Login form fields and validation
The dialog SHALL contain a "Login" text field and a "Password" password field, each with a visible label. Submitting
with an empty login (after trimming spaces) or an empty password SHALL send no request and SHALL show a message next to
each empty field, linked to it for screen readers.

#### Scenario: Empty fields
- **WHEN** the user submits the form with both fields empty
- **THEN** no `/auth/login` request is sent and the messages "Enter your login" and "Enter your password" are shown
  next to their fields, which are marked invalid

### Requirement: Login submission
Submitting a valid form SHALL send `POST /auth/login` with the trimmed login and the password as typed. Pressing Enter
in a field SHALL submit. While the request runs, the submit button SHALL be disabled and read "Logging in…". On success
the dialog SHALL close and the session SHALL become authenticated.

#### Scenario: Successful login
- **WHEN** the user types `anna` and `secret` and presses Enter, and the backend answers 200 with a token pair
- **THEN** one `POST /auth/login` with `{"login": "anna", "password": "secret"}` is sent, the dialog closes and the
  header shows the user menu for `anna`

#### Scenario: Submit in progress
- **GIVEN** the login request has not answered yet
- **WHEN** the user looks at the dialog
- **THEN** the submit button is disabled and reads "Logging in…"

### Requirement: Login failure message
When the login fails, the dialog SHALL stay open with the entered login kept and SHALL show the failure in an alert:
the message of the backend error when there is one, otherwise "Could not reach the server, please try again". The
alert SHALL disappear on the next submit.

#### Scenario: Wrong password
- **WHEN** the backend answers 401 `{"detail": "Invalid login or password"}`
- **THEN** the dialog stays open, an alert shows "Invalid login or password", and the session stays anonymous

#### Scenario: Network failure
- **WHEN** the login request fails without a response
- **THEN** an alert shows "Could not reach the server, please try again"

### Requirement: Login dialog focus
When the dialog opens, focus SHALL move to the "Login" field and SHALL stay inside the dialog while it is open. When it
closes, focus SHALL return to the element that had it before opening, when that element is still on the page.

#### Scenario: Focus on open and close
- **GIVEN** the "Log in" header button has focus
- **WHEN** the user activates it and then presses Escape
- **THEN** focus is on the "Login" field while the dialog is open and back on the "Log in" button after it closes
