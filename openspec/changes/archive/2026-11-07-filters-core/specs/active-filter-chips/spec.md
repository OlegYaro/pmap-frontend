# Spec Delta

## Purpose

Shows the active transaction filters as readable, removable chips with a "Reset all" action, so users see at a
glance what narrows the data and can undo any part of it in one step.

## ADDED Requirements

### Requirement: One chip per active filter
The chip list SHALL show one chip per active filter in the order of the filter panel fields. A range (dates,
price, area, floor) SHALL be one chip for both ends. Rooms and rows SHALL have one chip per value, except that all
room counts of 5 or more SHALL be one "Rooms: 5+" chip. `run_id` SHALL be one chip with the first 8 characters of
the id.

#### Scenario: Chips for a mixed URL
- **WHEN** the chips are rendered at `/?rooms=2&rooms=6&rooms=7&price_min=200000&price_max=500000`
- **THEN** the chips are "Price: 200,000 – 500,000 PLN", "Rooms: 2" and "Rooms: 5+"

#### Scenario: Run chip
- **WHEN** the chips are rendered at `/?run_id=1b4e28ba-2fa1-11d2-883f-0016d3cca427`
- **THEN** a chip "Run: 1b4e28ba" is shown

### Requirement: Readable chip labels
Chip labels SHALL use the panel's readable names: territory names from the territory list (the code while it is
missing), market type, function and rows labels (the raw value when unknown), dates as locale dates, prices in PLN
and areas in m² with locale number formatting. A one-sided range SHALL read "from" or "up to".

#### Scenario: Territory name
- **GIVEN** the territory list has voivodeship `14` named "mazowieckie" and its powiat `1465` named "Warszawa"
- **WHEN** the chips are rendered at `/?powiat_code=1465`
- **THEN** the chips are "Voivodeship: mazowieckie" and "Powiat: Warszawa"

#### Scenario: One-sided range in en-US
- **GIVEN** the locale is `en-US`
- **WHEN** the chips are rendered at `/?area_min=40&date_to=2024-12-31`
- **THEN** the chips are "Date: up to 12/31/2024" and "Area: from 40 m²"

#### Scenario: Labels for categories
- **WHEN** the chips are rendered at `/?market_type=wtorny&exclusion_reason=clean&address=Marsz`
- **THEN** the chips are "Market type: Secondary", "Rows: Clean" and `Address: "Marsz"`

### Requirement: Removing a chip
Each chip SHALL have a remove button whose accessible name is "Remove" followed by the chip label. Removing a chip
SHALL remove only that filter (both ends of a range, all counts of 5 or more for "Rooms: 5+") as one pushed
history entry. Removing a territory chip SHALL also remove the levels below it.

#### Scenario: Remove a range
- **GIVEN** the URL is `/?price_min=200000&price_max=500000&rooms=2`
- **WHEN** the user activates "Remove Price: 200,000 – 500,000 PLN"
- **THEN** the URL is `/?rooms=2`

#### Scenario: Remove a parent territory
- **GIVEN** the URL is `/?voivodeship_code=14&powiat_code=1465&gmina_code=1465011`
- **WHEN** the user removes the "Voivodeship" chip
- **THEN** the URL has no territory params

### Requirement: Focus after removal
After a chip is removed, focus SHALL move to the next chip's remove button, or to the previous one when the removed
chip was last. When no chip remains, focus SHALL move to the chip list region, which announces "No active
filters".

#### Scenario: Remove the middle chip with the keyboard
- **GIVEN** three chips are shown and focus is on the second chip's remove button
- **WHEN** the user presses Enter
- **THEN** two chips remain and focus is on the remove button of the chip that was third

### Requirement: Reset all
When at least one chip is shown, the list SHALL show a "Reset all" button that removes every filter param (also
those of fields not shown) as one pushed history entry, keeping `sort` and `order`. With no active filters the
button SHALL not be shown.

#### Scenario: Reset
- **GIVEN** the URL is `/?city_name=Gdańsk&rooms=3&sort=price_premises`
- **WHEN** the user clicks "Reset all"
- **THEN** the URL is `/?sort=price_premises` and no chips are shown

#### Scenario: Nothing to reset
- **WHEN** the chips are rendered at `/`
- **THEN** there is no "Reset all" button

### Requirement: Chips follow the shown fields
The chip list SHALL accept the same field list as the filter panel and SHALL not show chips for fields that are not
in it. The active filter count shown by the panel's "Filters" button SHALL equal the number of chips for the same
field list.

#### Scenario: Hidden rows field
- **WHEN** the chips are rendered at `/?exclusion_reason=clean&rooms=2` with every field except rows
- **THEN** only the chip "Rooms: 2" is shown
