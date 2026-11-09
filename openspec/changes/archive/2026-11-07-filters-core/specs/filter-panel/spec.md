# Spec Delta

## Purpose

A reusable panel of transaction filter controls that reads and writes the URL filter state, so the transactions
and analytics pages offer the same filters with the same behaviour and can hide the ones that do not apply.

## ADDED Requirements

### Requirement: Field set and the fields option
The panel SHALL offer these fields in this order: territory, dates, price, area, rooms, floor, market type,
function, rows, address, city, district. A page SHALL be able to pass the list of fields to show; fields not in the
list SHALL not be rendered. Without a list all fields SHALL be shown. The panel SHALL not decide its own placement
on the page.

#### Scenario: Analytics hides the rows field
- **WHEN** the panel is rendered with every field except rows
- **THEN** there is no "Rows" control and all other controls are present

#### Scenario: Default fields
- **WHEN** the panel is rendered without a field list
- **THEN** all twelve fields are shown

### Requirement: Accessible controls
Every control SHALL have a visible label tied to it for assistive technology, SHALL be reachable and operable with
the keyboard alone, and SHALL show the current value from the URL.

#### Scenario: Value from the URL
- **WHEN** the panel is rendered at `/?market_type=wtorny&price_min=300000`
- **THEN** the "Market type" control shows "Secondary" and the minimum price input shows `300000`

#### Scenario: Keyboard choice
- **WHEN** the user focuses the "Function" control, opens it with the keyboard and picks "Office" with arrow keys
  and Enter
- **THEN** the filters have `function: "biurowa"`

### Requirement: Searchable territory selects
Voivodeship, powiat and gmina SHALL each be a select whose list can be filtered by typing. Matching SHALL ignore
case and Polish diacritics and SHALL also match the code. Each select SHALL offer an "Any" choice that clears it.
Choices SHALL follow the territory cascade rules.

#### Scenario: Diacritics-insensitive search
- **GIVEN** the powiat select is open
- **WHEN** the user types `lodz`
- **THEN** "Łódź" is listed and powiats not matching are not

#### Scenario: Any clears
- **GIVEN** powiat `1465` is selected
- **WHEN** the user picks "Any" in the powiat select
- **THEN** the filters have neither `powiat_code` nor `gmina_code`

#### Scenario: Nothing matches
- **GIVEN** the voivodeship select is open
- **WHEN** the user types `zzz`
- **THEN** the list shows "No matches"

### Requirement: Territory loading and error
While the territory list loads, the territory selects SHALL be disabled and say "Loading…"; codes already in the
URL SHALL be shown as codes. When the request fails, the field SHALL show "Could not load territories" with a
"Retry" button that requests the list again; the other fields SHALL keep working.

#### Scenario: Load fails and retry
- **GIVEN** `GET /territories` fails
- **WHEN** the user clicks "Retry" and the request now succeeds
- **THEN** the voivodeship select is enabled and lists the voivodeships

### Requirement: Range inputs
Price (PLN, whole premises price), area (m2) and floor SHALL each have a "Min" and "Max" input, and dates a
"From" and "To" date input. Price and area SHALL accept a comma or a dot as decimal separator; floor SHALL accept
integers, negative allowed.

#### Scenario: Comma decimal
- **WHEN** the user types `42,5` in the minimum area input and waits 400 ms
- **THEN** the filters have `area_min: 42.5`

#### Scenario: Floor below ground
- **WHEN** the user types `-1` in the minimum floor input and waits 400 ms
- **THEN** the filters have `floor_min: -1`

### Requirement: Invalid range input
A value that is not a valid number for its input SHALL not be written to the URL; the input SHALL be marked invalid
with the message "Enter a number" (or "Enter a whole number" for floor). Clearing the input SHALL remove that
filter. When a minimum is greater than its maximum, the field SHALL show "Min is greater than max".

#### Scenario: Not a number
- **WHEN** the user types `abc` in the minimum price input and waits 400 ms
- **THEN** the URL has no `price_min` and the input shows "Enter a number"

#### Scenario: Swapped range
- **WHEN** the panel is rendered at `/?price_min=500000&price_max=100000`
- **THEN** the price field shows "Min is greater than max"

### Requirement: Debounced text and number input
Text, number and date inputs SHALL write to the URL only after 400 ms without further input, replacing the history
entry. Enter or leaving the input SHALL write the pending value at once. When the value in the URL changes from
elsewhere and the input has no pending edit, the input SHALL show the new value.

#### Scenario: One write after typing
- **WHEN** the user types `M`, `a`, `r` in the address input within 400 ms and waits 400 ms
- **THEN** the URL is written once, with `address=Mar`

#### Scenario: Enter commits at once
- **WHEN** the user types `Mar` in the address input and presses Enter
- **THEN** the URL has `address=Mar` without waiting

#### Scenario: Cleared from elsewhere
- **GIVEN** the address input shows `Mar` from the URL
- **WHEN** the address chip is removed
- **THEN** the address input is empty

### Requirement: Rooms choice
Rooms SHALL be a group of checkboxes "1", "2", "3", "4" and "5+". "5+" SHALL be checked when any room count of 5
or more is in the filters; checking it SHALL add the counts 5 to 10, and unchecking it SHALL remove every count of 5
or more. Each change SHALL push a history entry.

#### Scenario: Two and five plus
- **WHEN** the user checks "2" and "5+"
- **THEN** the URL has `rooms=2&rooms=5&rooms=6&rooms=7&rooms=8&rooms=9&rooms=10`

#### Scenario: Unchecking five plus
- **GIVEN** the URL is `/?rooms=2&rooms=7`
- **WHEN** the user unchecks "5+"
- **THEN** the filters have `rooms: [2]`

### Requirement: Market type and function selects
"Market type" SHALL offer Any, Primary (`pierwotny`) and Secondary (`wtorny`). "Function" SHALL offer Any,
Residential (`mieszkalna`), Garage (`garaz`), Other (`inne`), Retail and services (`handlowoUslugowa`), Office
(`biurowa`), Industrial (`produkcyjna`). Any SHALL remove the filter. A value from the URL that is not listed
SHALL be shown as an extra choice with the raw value.

#### Scenario: Readable label
- **WHEN** the user picks "Primary" in "Market type"
- **THEN** the filters have `market_type: "pierwotny"` and a history entry was pushed

#### Scenario: Unlisted value
- **WHEN** the panel is rendered at `/?function=magazyn`
- **THEN** the "Function" control shows `magazyn`

### Requirement: Rows choice
"Rows" SHALL be a multi-choice control over the row status: "Clean" (`clean`) and one choice per exclusion reason
with a readable label. No choice SHALL mean all rows. The control SHALL summarise the choice as "All rows",
"Clean only", the single reason's label, or "<n> selected".

#### Scenario: Clean only
- **WHEN** the user checks only "Clean" in "Rows"
- **THEN** the URL has `exclusion_reason=clean` and the control shows "Clean only"

#### Scenario: Several reasons
- **WHEN** the user checks "Package deal" and "Non-market"
- **THEN** the URL has `exclusion_reason=package_deal&exclusion_reason=non_market` and the control shows
  "2 selected"

### Requirement: Address, city and district inputs
"Address" SHALL filter by part of the address, with the helper text "Part of the address". "City" and
"District" SHALL filter by the exact name, each with the helper text "Exact name".

#### Scenario: Helper texts
- **WHEN** the panel is rendered
- **THEN** "Address" is described by "Part of the address" and "City" and "District" by "Exact name"

### Requirement: Collapsible on small screens
Below the medium breakpoint the panel SHALL be hidden behind a "Filters" button showing the number of active
filters, which toggles it and reports its expanded state. From the medium breakpoint up the panel SHALL always be
shown and the button hidden. Collapsing SHALL keep typed values.

#### Scenario: Toggle on a phone
- **GIVEN** the viewport is 360px wide and two filters are active
- **WHEN** the user presses "Filters (2)"
- **THEN** the panel is shown and the button reports it is expanded

### Requirement: Fits a narrow screen
The panel SHALL lay out its fields without horizontal scrolling down to a 360px wide viewport, with one field per
row at that width.

#### Scenario: 360px
- **WHEN** the panel is expanded on a 360px wide viewport
- **THEN** every control is fully visible and the page does not scroll horizontally
