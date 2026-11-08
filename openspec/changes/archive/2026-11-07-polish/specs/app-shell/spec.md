# Spec Delta

## MODIFIED Requirements

### Requirement: Not-found page
A path that matches no route SHALL show a not-found page inside the shared layout, with a link back to `/`.
The page SHALL use the same empty-state look as the other states of the app: a heading "Page not found", a short
explanation and the link as a button.

#### Scenario: Unknown path
- **WHEN** the user opens `/does-not-exist`
- **THEN** the not-found page is shown and the header navigation is still present

## ADDED Requirements

### Requirement: Skip link and main landmark
The first focusable element of every page SHALL be a link "Skip to main content" that is visible only while it has focus.
Activating it SHALL move focus to the main content area, which SHALL be a `main` landmark. The link SHALL work without
changing the URL path or the filters in it.

#### Scenario: First tab stop
- **WHEN** the user presses Tab once on a freshly loaded page
- **THEN** the "Skip to main content" link has focus and is visible

#### Scenario: Skipping
- **GIVEN** the skip link has focus
- **WHEN** the user presses Enter
- **THEN** focus is inside the main area and the URL is unchanged
