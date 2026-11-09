# Spec Delta

## Purpose
Defines the monthly price chart of the analytics page: the median line with its p25–p75 band, the transaction count
bars, the tooltip and the table that gives the same data without the chart.

## ADDED Requirements

### Requirement: Monthly series
The chart SHALL plot one point per month of the timeseries response, in time order: the median as a line, the range
from p25 to p75 as a shaded band behind it, and the transaction count as bars on a second value axis on the right.
The price axis SHALL be labelled "PLN/m²" and the count axis "Transactions". The month axis SHALL show short month
names with the year.

#### Scenario: Full month
- **GIVEN** a point `{month: "2025-03-01", count: 12, p25: 9000, median: 10000, p75: 11000}`
- **WHEN** the chart is shown
- **THEN** March 2025 has a median at 10000, a band from 9000 to 11000 and a bar of height 12 on the count axis

#### Scenario: Month without a median
- **GIVEN** a month with `median` `null` between two months with values
- **WHEN** the chart is shown
- **THEN** the line is broken at that month and the neighbours are not joined

#### Scenario: Month is unknown
- **GIVEN** a point whose `month` is `null`
- **WHEN** the chart and table are built
- **THEN** that point appears in neither

### Requirement: Missing values in the series
A month with a `null` median SHALL leave a gap in the line, a month with `null` p25 or p75 SHALL have no band, and a
point whose month is `null` SHALL be ignored.

#### Scenario: Month without p25
- **GIVEN** a month with `p25` `null` and a median
- **WHEN** the chart is shown
- **THEN** the month has its median and bar but no band

### Requirement: Tooltip
Pointing at or keyboard-focusing a month SHALL show a tooltip with the month, the median, p25, p75 and the count, each
formatted like the KPI values and labelled, with "n/a" for missing ones.

#### Scenario: Tooltip content
- **WHEN** the user hovers March 2025 of the point above
- **THEN** the tooltip reads "March 2025", "Median 10,000 PLN/m²", "P25 9,000 PLN/m²", "P75 11,000 PLN/m²" and
  "Transactions 12" (locale `en-US`)

### Requirement: Table alternative
A "View as table" toggle SHALL replace the chart with a table of the same months with the columns "Month", "Median",
"P25", "P75" and "Transactions", and the toggle SHALL then read "View as chart". The chart SHALL be exposed to assistive
technology as an image with a label that gives the number of months and the overall range of the median; the table
SHALL be the accessible way to read every value. The toggle state SHALL NOT be stored in the URL.

#### Scenario: Toggle to table
- **GIVEN** the chart is shown
- **WHEN** the user activates "View as table"
- **THEN** the table with one row per month replaces the chart and the toggle reads "View as chart"

#### Scenario: Missing values in the table
- **GIVEN** a month with a `null` median
- **WHEN** the table is shown
- **THEN** that row shows "n/a" in the "Median" cell

### Requirement: Chart colours and size
Series colours SHALL come from theme tokens that differ for the light and the dark theme, keep at least a 3:1 contrast
with the background and stay distinguishable for common colour-vision deficiencies; the band and bars SHALL differ from
the line in more than hue (opacity or shape). The chart SHALL resize with its container and SHALL stay readable at
360 px wide, with no overlapping axis labels. The chart code SHALL be loaded only when the analytics page is opened.

#### Scenario: Narrow screen
- **WHEN** the viewport is 360 px wide
- **THEN** the chart fills the width, the month labels do not overlap and the page does not scroll sideways

#### Scenario: Theme change
- **WHEN** the user switches from the light to the dark theme
- **THEN** the series, axes and grid use the dark theme colours without reloading

#### Scenario: Lazy loading
- **WHEN** the user opens `/` and never visits `/analytics`
- **THEN** the chart library is not downloaded

### Requirement: Empty series
When the timeseries response is an empty list, or every point has a `null` month, the section SHALL show "No data for
this period" instead of the chart and the toggle.

#### Scenario: Empty list
- **GIVEN** the timeseries response is `[]`
- **WHEN** the section is shown
- **THEN** it reads "No data for this period" and has no chart and no "View as table" toggle
