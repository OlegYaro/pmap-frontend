# Spec Delta

## Purpose

Decides in the UI who may see the `/admin` area, by session status and role, so users get a login prompt or a clear
"forbidden" page instead of failing admin requests. The gateway still enforces access.

## ADDED Requirements

### Requirement: Admin area for admins only
Every page under `/admin` SHALL be shown only when the session is authenticated with the admin role. These rules SHALL
apply to the whole `/admin` area, including pages added under it later.

#### Scenario: Admin opens the admin page
- **GIVEN** the user is authenticated as admin
- **WHEN** the user opens `/admin`
- **THEN** the admin page is shown

### Requirement: Admin area while restoring
While the session status is `loading`, opening the `/admin` area SHALL show a loading skeleton with a "Loading" status
for screen readers, and SHALL NOT redirect, open the login dialog or show the 403 page until the status is known.

#### Scenario: Reload on the admin page
- **GIVEN** an admin is on `/admin` and reloads the tab
- **WHEN** the session refresh has not answered yet
- **THEN** a skeleton is shown on `/admin` and, once the refresh succeeds, the admin page is shown without a
  redirect

### Requirement: Anonymous user sent to login
When an anonymous user opens the `/admin` area, the app SHALL replace the location with `/` (so Back does not return to
`/admin`) and SHALL open the login dialog with the reason "Admin area, please log in".

#### Scenario: Anonymous visit
- **GIVEN** the session is anonymous
- **WHEN** the user opens `/admin`
- **THEN** the page `/` is shown and the login dialog is open with the text "Admin area, please log in"

#### Scenario: Session ends on the admin page
- **GIVEN** an admin is on `/admin`
- **WHEN** the session ends because a refresh failed
- **THEN** the page `/` is shown with the login dialog open and the "Session expired, please log in again" toast

### Requirement: Forbidden page for non-admins
When an authenticated user without the admin role opens the `/admin` area, the app SHALL stay on that URL and show a
403 page with the heading "Access denied", a short explanation that the area is for administrators, and a link to `/`.

#### Scenario: Regular user opens the admin page
- **GIVEN** the user is authenticated with role `user`
- **WHEN** the user opens `/admin`
- **THEN** the heading "Access denied" and a link back to `/` are shown, the admin page is not, and the login dialog
  is not opened
