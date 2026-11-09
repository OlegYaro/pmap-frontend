# Spec Delta

## Purpose

Defines the shared pieces every screen uses to show a title, a loading placeholder, an empty result and a failed
request, so these states look and behave the same everywhere.

## ADDED Requirements

### Requirement: Page header
Each page SHALL be able to show a header with one `h1` title, an optional description, and an optional area for
actions on the right.

#### Scenario: Title and actions
- **WHEN** a page header is rendered with a title and an action button
- **THEN** the title is the page's only level-1 heading and the action is shown beside it

### Requirement: Empty state
An empty result SHALL be shown as a message with an optional explanation and an optional action button.

#### Scenario: Empty with action
- **WHEN** an empty state is rendered with the message "No transactions match these filters" and a "Reset" action
- **THEN** the message and a "Reset" button are visible

### Requirement: Error state with retry
A failed request SHALL be shown as an alert containing the error message and a "Retry" button. Activating the
button SHALL call the retry handler given by the page, and the button SHALL be disabled while a retry is
running.

#### Scenario: Retry
- **WHEN** an error state is shown and the user clicks "Retry"
- **THEN** the retry handler is called once

#### Scenario: Retry in progress
- **WHEN** an error state is shown with a retry that is running
- **THEN** the "Retry" button is disabled

### Requirement: Table skeleton
While table data loads, the app SHALL be able to show placeholder rows with a configurable number of rows and
columns. The placeholder SHALL be hidden from screen readers except for one "Loading" status announcement.

#### Scenario: Skeleton size
- **WHEN** a table skeleton is rendered with 5 rows and 4 columns
- **THEN** 5 placeholder rows with 4 cells each are shown and one status "Loading" is exposed
