# Spec Delta

## MODIFIED Requirements

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
the keyboard alone, and SHALL show the current value from the URL.

#### Scenario: Value from the URL
- **WHEN** the panel is rendered at `/?function=biurowa&price_min=300000`
- **THEN** the "Function" control shows "Office" and the minimum price input shows `300000`

#### Scenario: Keyboard choice
- **WHEN** the user focuses the "Function" control, opens it with the keyboard and picks "Office" with arrow keys
  and Enter
- **THEN** the filters have `function: "biurowa"`

### Requirement: Market type and function selects
The panel SHALL have no "Market type" control. "Function" SHALL offer Any,
Residential (`mieszkalna`), Garage (`garaz`), Other (`inne`), Retail and services (`handlowoUslugowa`), Office
(`biurowa`), Industrial (`produkcyjna`). Any SHALL remove the filter. A value from the URL that is not listed
SHALL be shown as an extra choice with the raw value.

#### Scenario: Readable label
- **WHEN** the user picks "Office" in "Function"
- **THEN** the filters have `function: "biurowa"` and a history entry was pushed

#### Scenario: No market type control
- **WHEN** the panel is rendered
- **THEN** there is no "Market type" control

#### Scenario: Unlisted value
- **WHEN** the panel is rendered at `/?function=magazyn`
- **THEN** the "Function" control shows `magazyn`
