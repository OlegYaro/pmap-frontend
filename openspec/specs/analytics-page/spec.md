# analytics-page Specification

## Purpose
Defines the `/analytics` page: its layout, the required period with presets, the default filters, which filter
controls it offers, the data it requests and how each section shows loading, empty and error states.

## Requirements

### Requirement: Page layout
The page at `/analytics` SHALL show, in this order: a page header titled "Analytics", the period presets, the filter
panel, the active filter chips, the KPI cards, the monthly price chart, the rooms and floor distribution charts, and a
note. The note SHALL say that only clean transactions are counted. The header's actions area SHALL contain the "Export CSV" button (see the csv-export capability).

#### Scenario: Layout
- **WHEN** the user opens `/analytics`
- **THEN** the heading "Analytics", the period presets, the filter controls, the "Active filters" region, the four KPI
  cards, the monthly chart, the two distribution sections and the note are shown in that order

#### Scenario: Export slot is empty
- **WHEN** the user opens `/analytics`
- **THEN** the export slot in the page header is no longer empty: it contains the "Export CSV" button

### Requirement: Required period
The period SHALL be the URL filters `date_from` and `date_to` and SHALL always be set on this page. When the page is
opened with either missing, it SHALL add the missing one by replacing the history entry: `date_to` is today, `date_from`
is the same calendar day 12 months before `date_to`. No data SHALL be requested before both are set.

#### Scenario: Default period
- **GIVEN** today is 2026-11-07
- **WHEN** the user opens `/analytics` with no filters
- **THEN** the URL gets `date_from=2025-11-07` and `date_to=2026-11-07`, replacing the entry, and Back leaves the page

#### Scenario: Only one end given
- **WHEN** the user opens `/analytics?date_from=2024-01-01`
- **THEN** the URL gets `date_to` set to today and `date_from` stays `2024-01-01`

#### Scenario: Removed period comes back
- **GIVEN** the page shows a period
- **WHEN** the user removes the date chip or resets all filters
- **THEN** the period is set to the default again

### Requirement: Period presets
Above the filter panel the page SHALL offer the presets "3 months", "6 months", "12 months", "3 years" and "Custom".
Choosing a preset SHALL set `date_to` to today and `date_from` to the same calendar day that many months earlier, as one
pushed history entry, and SHALL apply at once.

#### Scenario: Preset applies
- **GIVEN** today is 2026-11-07
- **WHEN** the user chooses "3 months"
- **THEN** the URL has `date_from=2026-08-07` and `date_to=2026-11-07` and "3 months" is marked as selected

#### Scenario: Month end
- **GIVEN** today is 2026-08-31
- **WHEN** the user chooses "6 months"
- **THEN** `date_from` is `2026-02-28`, the last day of the shorter month

### Requirement: Selected preset
The preset that matches the current period SHALL be marked as selected; a period that matches none SHALL mark "Custom".
Choosing "Custom" SHALL move focus to the date inputs of the filter panel and SHALL NOT change the period.

#### Scenario: Custom period marked
- **WHEN** the URL has `date_from=2024-01-01` and `date_to=2024-06-30`
- **THEN** "Custom" is marked as selected and no other preset is

#### Scenario: Custom keeps the period
- **GIVEN** the period is 3 months
- **WHEN** the user chooses "Custom"
- **THEN** the period is unchanged and focus is on the "From" date input

### Requirement: Default filters
Opening `/analytics` with no query SHALL also set `function=mieszkalna` together with the default period, so the
median is not mixed with garages and offices. It SHALL be shown as the chip "Function: Residential" (the label the
panel uses for `mieszkalna`) and SHALL be removable like any filter; removing it SHALL NOT bring it back.

#### Scenario: Fresh visit
- **WHEN** the user opens `/analytics` with no query
- **THEN** the URL has `function=mieszkalna` and the chip for it is shown

#### Scenario: Chip removed
- **GIVEN** the page shows the function chip
- **WHEN** the user removes it
- **THEN** the URL has no `function` and the requests are sent without it

#### Scenario: Shared link
- **WHEN** the user opens `/analytics?powiat_code=0264`
- **THEN** only the period is added; `function` is not

### Requirement: Filters that do not apply
The filter panel and the chips SHALL offer every field except "Rows" and "Address". The page SHALL remove the URL keys
`exclusion_reason`, `address` and `run_id` when it finds them, by replacing the history entry, and SHALL never send them
to the analytics requests.

#### Scenario: No Rows or Address control
- **WHEN** the user opens `/analytics`
- **THEN** there is no "Rows" control and no "Address" control, and every other control is present

#### Scenario: Stray keys are dropped
- **WHEN** the user opens `/analytics?exclusion_reason=non_market&run_id=abc&address=Main&powiat_code=0264`
- **THEN** the URL keeps `powiat_code=0264` and the period, and the other three keys are gone

### Requirement: Data requests
The page SHALL request `GET /analytics/summary` and `GET /analytics/timeseries` with the URL filters (the period always
included) once the period is set. The requests SHALL NOT contain `sort`, `order`, `limit`, `after_id`, `after_value`,
`exclusion_reason`, `address` or `run_id`. A new search SHALL replace the shown data; results SHALL count as fresh for
5 minutes and SHALL NOT refetch on window focus.

#### Scenario: Request parameters
- **WHEN** the user opens `/analytics?powiat_code=0264&rooms=2&rooms=3&date_from=2025-01-01&date_to=2025-12-31`
- **THEN** both endpoints are requested with `powiat_code=0264`, `rooms=2`, `rooms=3`, `date_from=2025-01-01` and
  `date_to=2025-12-31`, and with no `sort`, `order`, `limit` or `exclusion_reason`

#### Scenario: Nothing before the period
- **WHEN** the page is opened with no period and the default period has not yet been written to the URL
- **THEN** no analytics request is made until it has been

#### Scenario: Searching again
- **GIVEN** the page shows data
- **WHEN** the user changes a filter and presses "Search"
- **THEN** both endpoints are requested again with the new filters

### Requirement: Section states
Each section (KPI cards, monthly chart, rooms chart, floor chart) SHALL show a skeleton while its data loads, the text
"No data for this period" when the data it needs is empty, and, when the request failed, an error with the message and
a "Retry" button that repeats only the failed request. A failed request SHALL NOT hide the sections that loaded. The KPI
cards and both distribution sections share the summary request and fail and recover together.

#### Scenario: Loading
- **WHEN** the requests are pending
- **THEN** each section shows a skeleton and no chart or number

#### Scenario: Empty summary
- **GIVEN** the summary has `count` 0 and empty distributions
- **WHEN** the page is shown
- **THEN** the KPI section and both distribution sections show "No data for this period"

#### Scenario: Timeseries fails alone
- **GIVEN** the summary succeeds and the timeseries request fails
- **WHEN** the page is shown
- **THEN** the KPI cards and distributions show data and the monthly chart section shows an error with "Retry"

#### Scenario: Retry
- **GIVEN** the summary request failed
- **WHEN** the user presses "Retry" in the KPI section
- **THEN** only the summary is requested again and, on success, the KPIs and distributions appear

### Requirement: Narrow screens and keyboard
The page SHALL have no horizontal page scroll down to 360 px wide. Every control, toggle and chart alternative SHALL be
reachable and operable with the keyboard alone.

#### Scenario: 360 px
- **WHEN** the viewport is 360 px wide
- **THEN** the presets wrap, the cards stack and the charts fit the width

#### Scenario: Keyboard
- **WHEN** the user tabs through the page
- **THEN** focus visits the presets, the filter controls, the chips and every toggle in page order
