# Spec Delta

## ADDED Requirements

### Requirement: Admin edit action
The header of a loaded transaction SHALL contain an "Edit" button only when the session is an admin one. Activating it SHALL
open the edit form (see the admin-transaction-edit capability). Anonymous users and non-admin users SHALL NOT see the
button, and it SHALL NOT be present in the not-found, error and loading states.

#### Scenario: Admin sees Edit
- **GIVEN** the user is an admin and transaction 42 is loaded
- **WHEN** the page is shown
- **THEN** the header has an "Edit" button

#### Scenario: Others do not
- **GIVEN** the user is anonymous, or authenticated without the admin role
- **WHEN** transaction 42 is shown
- **THEN** the header has no "Edit" button

#### Scenario: Not found
- **GIVEN** the user is an admin and the server answers 404
- **WHEN** the page is shown
- **THEN** there is no "Edit" button
