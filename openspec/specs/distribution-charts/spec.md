# distribution-charts Specification

## Purpose
Defines the two distribution sections of the analytics page, by rooms and by floor: the bar chart, the table
alternative and how the table sorts.

## Requirements

### Requirement: Two distributions
The page SHALL show two sections titled "By rooms" and "By floor", built from the summary's `rooms` and `floors`. Each
SHALL be a bar chart with one bar per group, the number of clean transactions as the bar height, and the count shown as
text on or above each bar. A group of `null` SHALL be labelled "Unknown". Bars SHALL be ordered by the group as a number
ascending, with "Unknown" last; a group that is not a number SHALL follow the numbers in alphabetical order.

#### Scenario: Bars in order
- **GIVEN** `rooms` is `[{group: "3", count: 15}, {group: null, count: 2}, {group: "1", count: 5}]`
- **WHEN** the section is shown
- **THEN** the bars are "1" (5), "3" (15), "Unknown" (2), in that order

#### Scenario: Numeric order
- **GIVEN** `floors` has groups "10", "2" and "0"
- **WHEN** the section is shown
- **THEN** the bars are "0", "2", "10"

### Requirement: Chart or table
Each section SHALL have its own toggle between "Chart" and "Table" (the chart is shown first). The table SHALL list the
same groups with the columns "Group" and "Transactions". The toggle state SHALL be per section and SHALL NOT be stored in
the URL. The chart SHALL be exposed to assistive technology as an image labelled with the number of groups and the
largest group; the table SHALL be the accessible way to read every value.

#### Scenario: Switching one section
- **GIVEN** both sections show charts
- **WHEN** the user activates "Table" in "By rooms"
- **THEN** "By rooms" shows its table and "By floor" still shows its chart

### Requirement: Client-side sorting
The table SHALL sort on the client, without any request. Activating the "Group" or "Transactions" header SHALL sort by
that column ascending, activating it again SHALL sort descending, and a third time ascending again. The shown header
SHALL carry the sort direction for assistive technology, and every header SHALL be a button reachable by keyboard. The
initial order SHALL be the order of the chart. Group SHALL sort as in the chart (numbers first, "Unknown" last in
ascending order).

#### Scenario: Sort by count
- **GIVEN** the table of the rooms section is shown with groups "1" (5), "3" (15), "Unknown" (2)
- **WHEN** the user activates the "Transactions" header twice
- **THEN** the rows read "3" (15), "1" (5), "Unknown" (2) and the header is marked as sorted descending

#### Scenario: Sort by group descending
- **WHEN** the user activates the "Group" header twice
- **THEN** the rows read "Unknown", "3", "1"

#### Scenario: No request
- **WHEN** the user sorts a table
- **THEN** no network request is made

### Requirement: Empty distribution
When a distribution has no rows, its section SHALL show "No data for this period" instead of the chart, the toggle and
the table.

#### Scenario: Empty floors
- **GIVEN** `floors` is `[]`
- **WHEN** the page is shown
- **THEN** "By floor" reads "No data for this period" and has no toggle
