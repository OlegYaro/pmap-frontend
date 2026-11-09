# Spec Delta

## Purpose

A shared button for actions that need a login (such as CSV export): it shows anonymous users that the action exists
and leads them to log in, and behaves as a plain button once they are logged in.

## ADDED Requirements

### Requirement: Locked look for anonymous users
When the session is anonymous, a locked action SHALL be shown as a muted (grey) button with a lock icon and its usual
label, marked `aria-disabled="true"` but not with the `disabled` attribute, so it stays in the tab order and can be
focused by keyboard.

#### Scenario: Anonymous rendering
- **GIVEN** the session is anonymous
- **WHEN** a locked action "Export CSV" for the action "export" is rendered
- **THEN** a button "Export CSV" with a lock icon is shown, it has `aria-disabled="true"`, no `disabled` attribute, and
  it can receive focus with Tab

### Requirement: Login hint tooltip
When the session is anonymous, hovering or focusing a locked action SHALL show the tooltip "Log in to <action>", and
the tooltip SHALL describe the button for screen readers.

#### Scenario: Tooltip on focus
- **GIVEN** the session is anonymous
- **WHEN** the locked "export" action receives keyboard focus
- **THEN** the tooltip "Log in to export" is shown

### Requirement: Locked action opens the login dialog
When the session is anonymous, activating a locked action by click, Enter or Space SHALL NOT run the action and SHALL
open the login dialog with the reason "Log in to <action>". While the status is `loading`, the action SHALL look locked
and activating it SHALL do nothing.

#### Scenario: Click while anonymous
- **GIVEN** the session is anonymous
- **WHEN** the user clicks the locked "export" action
- **THEN** the action's handler is not called and the login dialog opens with the text "Log in to export"

#### Scenario: Click while restoring
- **GIVEN** the session status is `loading`
- **WHEN** the user clicks the locked action
- **THEN** the handler is not called and the login dialog does not open

### Requirement: Normal button when logged in
When the session is authenticated, a locked action SHALL be a normal enabled button with its label, without the lock
icon, `aria-disabled` or the tooltip, and activating it SHALL run the action.

#### Scenario: Click while authenticated
- **GIVEN** the user is authenticated
- **WHEN** the user clicks the "Export CSV" action
- **THEN** its handler is called once and the login dialog does not open
