# filter-panel Specification

## Purpose
A reusable panel of transaction filter controls that reads and writes the URL filter state, so the transactions
and analytics pages offer the same filters with the same behaviour and can hide the ones that do not apply.

## Requirements

### Requirement: Field set and the fields option
The panel SHALL offer these fields in this order: territory, dates, price, area, rooms, floor, function,
rows, address, city, district. A page SHALL be able to pass the list of fields to show; fields not in the
list SHALL not be rendered. Without a list all fields SHALL be shown. The panel SHALL not decide its own placement
on the page.

#### Scenario: Analytics hides the rows field
- **WHEN** the panel is rendered with every field except rows
- **THEN** there is no "Rows" control and all other controls are present

#### Scenario: Default fields
- **WHEN** the panel is rendered without a field list
- **THEN** all eleven fields are shown

### Requirement: Accessible controls
Every control SHALL have a visible label tied to it for assistive technology, SHALL be reachable and operable with
the keyboard alone, and SHALL show the current value of the draft, which starts from the applied filters in the URL.

#### Scenario: Value from the URL
- **WHEN** the panel is rendered at `/?function=biurowa&price_min=300000`
- **THEN** the "Function" control shows "Office" and the minimum price input shows `300000`

#### Scenario: Keyboard choice
- **WHEN** the user focuses the "Function" control, opens it with the keyboard and picks "Office" with arrow keys
  and Enter
- **THEN** the draft has `function: "biurowa"` and the URL is unchanged

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
- **THEN** the draft has neither `powiat_code` nor `gmina_code`

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
- **WHEN** the user types `42,5` in the minimum area input
- **THEN** the draft has `area_min: 42.5` and no request is sent

#### Scenario: Floor below ground
- **WHEN** the user types `-1` in the minimum floor input
- **THEN** the draft has `floor_min: -1` and no request is sent

### Requirement: Invalid range input
A value that is not a valid number for its input SHALL not enter the draft and SHALL not be searched; the input SHALL be marked invalid
with the message "Enter a number" (or "Enter a whole number" for floor). Clearing the input SHALL remove that
filter. When a minimum is greater than its maximum, the field SHALL show "Min is greater than max".

#### Scenario: Not a number
- **WHEN** the user types `abc` in the minimum price input and presses Search
- **THEN** the URL has no `price_min` and the input shows "Enter a number"

#### Scenario: Swapped range
- **WHEN** the panel is rendered at `/?price_min=500000&price_max=100000`
- **THEN** the price field shows "Min is greater than max"

### Requirement: Rooms choice
Rooms SHALL be a group of checkboxes "1", "2", "3", "4" and "5+". "5+" SHALL be checked when any room count of 5
or more is in the filters; checking it SHALL add the counts 5 to 10, and unchecking it SHALL remove every count of 5
or more. Each change SHALL update the draft only.

#### Scenario: Two and five plus
- **WHEN** the user checks "2" and "5+"
- **THEN** the draft has `rooms` `[2, 5, 6, 7, 8, 9, 10]` and the URL is unchanged

#### Scenario: Unchecking five plus
- **GIVEN** the applied filters are `/?rooms=2&rooms=7`
- **WHEN** the user unchecks "5+"
- **THEN** the draft has `rooms: [2]`

### Requirement: Market type and function selects
The panel SHALL have no "Market type" control. "Function" SHALL offer Any,
Residential (`mieszkalna`), Garage (`garaz`), Other (`inne`), Retail and services (`handlowoUslugowa`), Office
(`biurowa`), Industrial (`produkcyjna`). Any SHALL remove the filter. A value from the URL that is not listed
SHALL be shown as an extra choice with the raw value.

#### Scenario: Readable label
- **WHEN** the user picks "Office" in "Function"
- **THEN** the draft has `function: "biurowa"` and no history entry was pushed

#### Scenario: No market type control
- **WHEN** the panel is rendered
- **THEN** there is no "Market type" control

#### Scenario: Unlisted value
- **WHEN** the panel is rendered at `/?function=magazyn`
- **THEN** the "Function" control shows `magazyn`

### Requirement: Rows choice
"Rows" SHALL be a multi-choice control over the row status: "Clean" (`clean`) and one choice per exclusion reason
with a readable label. No choice SHALL mean all rows. The control SHALL summarise the choice as "All rows",
"Clean only", the single reason's label, or "<n> selected".

#### Scenario: Clean only
- **WHEN** the user checks only "Clean" in "Rows"
- **THEN** the draft has `exclusion_reason: ["clean"]` and the control shows "Clean only"

#### Scenario: Several reasons
- **WHEN** the user checks "Package deal" and "Non-market"
- **THEN** the draft has `exclusion_reason: ["package_deal", "non_market"]` and the control shows
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

### Requirement: Draft text, number and date input
Text, number and date inputs SHALL update the draft on every change and SHALL NOT write to the URL or start a request by themselves. When the applied filters change from elsewhere (chip removal, reset, Back or forward), every input SHALL show the new applied value.

#### Scenario: Typing sends nothing
- **WHEN** the user types `Mar` in the address input
- **THEN** the draft has `address: "Mar"`, the URL is unchanged and no request is sent

#### Scenario: Cleared from elsewhere
- **GIVEN** the address input shows `Mar` from the applied filters
- **WHEN** the address chip is removed
- **THEN** the address input is empty

### Requirement: Search button
The panel SHALL have a "Search" button that applies the draft: it writes the draft to the URL as one pushed history entry, which starts the search. The button SHALL be visible also while the panel is collapsed on a small screen. Pressing Enter in a text, number or date input SHALL do the same as the button. Applying a draft equal to the applied filters SHALL not navigate.

#### Scenario: One search
- **GIVEN** the user changed the address, the rooms and the powiat in the panel
- **WHEN** the user presses "Search"
- **THEN** the URL has all three changes, one history entry was pushed and one request is sent

#### Scenario: Enter searches
- **WHEN** the user types `Mar` in the address input and presses Enter
- **THEN** the URL has `address=Mar`

#### Scenario: Nothing changed
- **GIVEN** the draft equals the applied filters
- **WHEN** the user presses "Search"
- **THEN** no navigation happens and the history length is unchanged

#### Scenario: Visible on a phone
- **GIVEN** the viewport is 360px wide and the panel is collapsed
- **WHEN** the panel is rendered
- **THEN** the "Search" button is visible

### Requirement: Unapplied changes hint
While the draft differs from the applied filters, the panel SHALL show the status text "Unapplied changes". When the draft equals the applied filters the text SHALL not be shown.

#### Scenario: Hint appears and goes
- **WHEN** the user picks a function and then presses "Search"
- **THEN** "Unapplied changes" is shown after the pick and is gone after the search

### Requirement: Draft follows the applied filters
The draft SHALL start equal to the applied filters and SHALL be replaced by them whenever they change. Removing a chip or resetting all filters therefore applies at once and discards unapplied edits.

#### Scenario: Chip removal discards the draft
- **GIVEN** the applied filters have `rooms: [2]` and the user picked a function without searching
- **WHEN** the user removes the "Rooms: 2" chip
- **THEN** the URL has no `rooms` and the draft has no `function`
