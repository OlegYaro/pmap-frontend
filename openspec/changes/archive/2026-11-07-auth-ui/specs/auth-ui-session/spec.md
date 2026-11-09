# Spec Delta

## Purpose

Turns the stored tokens into a session state the UI can show: whether the user is logged in, who they are and which
role they have, restoring it after a reload and telling the user when it ends.

## ADDED Requirements

### Requirement: Session status
The app SHALL expose one session status: `loading` while the session is being restored on start, `anonymous` when no
session is held, and `authenticated` when the user is logged in. Every part of the UI that depends on the login SHALL
read this one status.

#### Scenario: Fresh visit without a stored session
- **GIVEN** no refresh token is stored
- **WHEN** the app opens
- **THEN** no `/auth/refresh` request is sent and the status becomes `anonymous`

#### Scenario: Successful login
- **GIVEN** the status is `anonymous`
- **WHEN** the user logs in successfully
- **THEN** the status becomes `authenticated`

### Requirement: Role from the access token
The user's role SHALL be read from the `role` claim of the access token's JWT payload, decoded from base64url without
checking the signature. The role SHALL only decide what the UI shows. The user SHALL count as admin only when the role
is exactly `admin`; a missing, non-string or unreadable claim SHALL count as not admin.

#### Scenario: Admin token
- **WHEN** the user logs in and the access token payload is `{"sub": "1", "role": "admin", "exp": ...}`
- **THEN** the user is shown as admin

#### Scenario: Regular user token
- **WHEN** the access token payload has `"role": "user"`
- **THEN** the user is authenticated and not admin

#### Scenario: Unreadable token payload
- **WHEN** login succeeds but the access token payload cannot be decoded
- **THEN** the user is authenticated and not admin, and no error is shown

### Requirement: Displayed login
The UI SHALL show the user by the login they entered in the login dialog. Because the access token carries only the
user id, the login SHALL be remembered per user id across reloads and shown again when the restored token has the same
user id. When no login is known for that user id, the UI SHALL show `User <id>`. Logging out SHALL forget it.

#### Scenario: Login shown after a reload
- **GIVEN** the user logged in as `anna` (user id `7`) and the tab is reloaded
- **WHEN** the session is restored with a token whose `sub` is `7`
- **THEN** the user menu shows `anna`

#### Scenario: Unknown login
- **GIVEN** no login is remembered for user id `9`
- **WHEN** the session is restored with a token whose `sub` is `9`
- **THEN** the user menu shows `User 9`

### Requirement: Session restore on start
On start, when a refresh token is stored, the app SHALL get a new token pair through one refresh before deciding the
status. The status SHALL stay `loading` until that refresh finishes, then become `authenticated` on success or
`anonymous` on failure. Public pages SHALL render meanwhile.

#### Scenario: Reload keeps the user logged in
- **GIVEN** a refresh token is stored and no access token is held
- **WHEN** the app opens and `POST /auth/refresh` returns a token pair with role `admin`
- **THEN** exactly one refresh request is sent, the status is `loading` until it answers, and then the user is
  authenticated as admin

#### Scenario: Stored refresh token no longer valid
- **GIVEN** a refresh token is stored
- **WHEN** the app opens and `POST /auth/refresh` answers 401
- **THEN** the status becomes `anonymous` and the "Log in" button is shown

### Requirement: Session-ended notice
When the token layer reports that the session ended (a refresh failed), the status SHALL become `anonymous` and the app
SHALL show the toast "Session expired, please log in again". An explicit logout SHALL NOT show this toast.

#### Scenario: Refresh fails during use
- **GIVEN** the user is authenticated
- **WHEN** a protected request gets 401 and the refresh answers 401
- **THEN** the status becomes `anonymous` and the toast "Session expired, please log in again" is shown

#### Scenario: Logout shows no toast
- **WHEN** the user logs out
- **THEN** no "Session expired" toast is shown

### Requirement: Account control in the header
The header's login slot SHALL show a placeholder while the status is `loading`, a "Log in" button when `anonymous`, and
a user menu when `authenticated`. The menu trigger SHALL name the user's login; the menu SHALL show the login, a role
badge and a "Log out" item. The control SHALL work by keyboard and fit a 360px wide screen.

#### Scenario: Anonymous header
- **WHEN** the status is `anonymous`
- **THEN** the header shows a "Log in" button and no user menu

#### Scenario: Log in button opens the dialog
- **WHEN** the user activates the "Log in" button
- **THEN** the login dialog opens without a reason text

#### Scenario: Header while restoring
- **WHEN** the status is `loading`
- **THEN** the header shows neither the "Log in" button nor the user menu

#### Scenario: User menu
- **GIVEN** the user `anna` with role `admin` is authenticated
- **WHEN** the user opens the user menu
- **THEN** it shows `anna`, a badge `admin` and a "Log out" item

### Requirement: Logout from the UI
Choosing "Log out" SHALL end the session through the token layer and set the status to `anonymous`. When the current
page is in the `/admin` area, the app SHALL go to `/` without opening the login dialog.

#### Scenario: Log out
- **GIVEN** the user is authenticated
- **WHEN** the user chooses "Log out"
- **THEN** `POST /auth/logout` is sent, the status becomes `anonymous` and the "Log in" button is shown

#### Scenario: Log out on the admin page
- **GIVEN** an admin is on `/admin`
- **WHEN** the admin chooses "Log out"
- **THEN** the page `/` is shown and the login dialog is not open
