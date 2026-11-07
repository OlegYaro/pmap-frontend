# Spec Delta

## Purpose

Gives the app light and dark colour themes and lets the user pick light, dark or follow the system, remembering
the choice between visits.

## ADDED Requirements

### Requirement: Theme choice
The app SHALL offer three theme choices: light, dark and system. With system, the theme SHALL follow the
operating system preference (`prefers-color-scheme`) and update when that preference changes. The default
choice SHALL be system.

#### Scenario: Default follows the system
- **GIVEN** no choice is stored and the system prefers dark
- **WHEN** the app opens
- **THEN** the dark theme is applied

#### Scenario: Explicit choice overrides the system
- **GIVEN** the system prefers dark
- **WHEN** the user picks light in the toggle
- **THEN** the light theme is applied

#### Scenario: System preference changes
- **GIVEN** the choice is system and the light theme is applied
- **WHEN** the operating system switches to dark
- **THEN** the dark theme is applied without a reload

### Requirement: Theme toggle
The header SHALL contain a theme toggle, reachable by keyboard and labelled for screen readers, that shows the
current choice and offers light, dark and system.

#### Scenario: Toggle lists the choices
- **WHEN** the user opens the theme toggle
- **THEN** the options Light, Dark and System are listed and the current one is marked

### Requirement: Theme persistence
The chosen theme SHALL be stored in `localStorage` and applied before the first paint on the next visit. If
`localStorage` cannot be read or written, the app SHALL still work and fall back to system.

#### Scenario: Choice survives a reload
- **GIVEN** the user picked dark
- **WHEN** the page is reloaded
- **THEN** the dark theme is applied from the start, without a flash of the light theme

#### Scenario: Storage unavailable
- **GIVEN** `localStorage` throws on access
- **WHEN** the app opens and the user picks dark
- **THEN** the dark theme is applied for the session and no error is shown
