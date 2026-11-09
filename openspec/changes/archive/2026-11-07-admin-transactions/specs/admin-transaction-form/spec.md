# Spec Delta

## Purpose
Defines the form an admin uses to enter or correct a transaction by hand: which fields it has, how they are checked
before sending, and how errors returned by the server appear on the fields.

## ADDED Requirements

### Requirement: Fields
The form SHALL have these labelled fields in this order: "Powiat" (required), "Gmina", "City", "District", "Address",
"Date", "Price (PLN)", "Area (m²)", "Rooms", "Floor", "Market", "Function", "Building id" and "Status". "Powiat" and
"Gmina" SHALL be searchable selects fed by the territory list, with the gmina choices limited to the chosen powiat;
changing the powiat SHALL clear the gmina.

#### Scenario: Gmina follows powiat
- **GIVEN** the territory list is loaded
- **WHEN** the user chooses a powiat
- **THEN** the "Gmina" select lists only the gminas of that powiat

#### Scenario: Powiat change clears gmina
- **GIVEN** a powiat and one of its gminas are chosen
- **WHEN** the user chooses another powiat
- **THEN** "Gmina" is empty

### Requirement: Select choices
"Market" and "Function" SHALL be selects with an empty choice. "Status" SHALL be a select with "Clean" (no exclusion
reason) and the known exclusion reasons by their readable names. A stored value that is not among a select's choices (for
example another spelling of a market type) SHALL still be shown and kept as a choice.

#### Scenario: Unknown stored value
- **GIVEN** the form is prefilled with `market_type` `rynekWtorny`
- **WHEN** the form is shown
- **THEN** "Market" shows that value readably and it stays selectable

#### Scenario: Status choices
- **WHEN** the user opens "Status"
- **THEN** it lists "Clean" first, then the readable names of the exclusion reasons

### Requirement: Validation
Before sending, the form SHALL require a powiat; require a positive price and a positive area when they are filled; require
whole-number rooms of at least 1 and a whole-number floor when filled; require a valid calendar date when filled; and
trim text fields. An invalid field SHALL show its message next to it, be marked invalid for assistive technology, and
focus SHALL move to the first invalid field on submit. Nothing SHALL be sent while a field is invalid.

#### Scenario: Missing powiat
- **WHEN** the user submits the form without a powiat
- **THEN** "Powiat" shows an error, focus moves to it and no request is sent

#### Scenario: Non-positive price
- **WHEN** the user enters a price of 0 and submits
- **THEN** "Price (PLN)" shows an error and no request is sent

#### Scenario: Fractional rooms
- **WHEN** the user enters 2.5 rooms and submits
- **THEN** "Rooms" shows an error

### Requirement: Server errors
When the server answers 422, each message whose location names a form field SHALL be shown on that field; messages that
match no field SHALL be shown at the top of the form. Any other failure SHALL be shown at the top of the form with its
message. The form SHALL stay open with the user's input in every error case, and the submit button SHALL be disabled while
a request is pending.

#### Scenario: Field error from the server
- **GIVEN** the server answers 422 with a message for `body.area_usable`
- **WHEN** the user submits
- **THEN** the message is shown on "Area (m²)" and the dialog stays open

#### Scenario: Other failure
- **GIVEN** the server answers 502
- **WHEN** the user submits
- **THEN** an error with the message is shown at the top of the form and the input is kept

#### Scenario: Pending
- **WHEN** a request is pending
- **THEN** the submit button is disabled

### Requirement: Keyboard and dialog behaviour
The form SHALL be shown in a dialog that traps focus, closes on Escape and on "Cancel", labels itself with its title, and
returns focus to the control that opened it. Closing it SHALL discard the input. It SHALL fit a 360 px wide screen and
scroll inside the dialog when it is taller than the screen.

#### Scenario: Escape
- **GIVEN** the form is open
- **WHEN** the user presses Escape
- **THEN** the dialog closes without a request and focus returns to the button that opened it
