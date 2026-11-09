# analytics-kpis Specification

## Purpose
Defines the four KPI cards at the top of the analytics page: which figure each shows, how it is formatted and how
missing values are presented.

## Requirements

### Requirement: Four cards
The KPI section SHALL show four cards in this order, each with a visible title and a value: "Median price per m²",
"Transactions", "Change vs year earlier" and "Previous-year median". The values SHALL come from the summary:
`median`, `count`, `change_pct` and `previous_median`.

#### Scenario: Cards in order
- **GIVEN** the summary has `median` 11000, `count` 40, `change_pct` 10 and `previous_median` 10000
- **WHEN** the section is shown
- **THEN** the four cards read, in order, "Median price per m²" `11,000 PLN/m²`, "Transactions" `40`,
  "Change vs year earlier" `+10%` and "Previous-year median" `10,000 PLN/m²` (locale `en-US`)

### Requirement: Value formatting
Prices SHALL be locale numbers rounded to whole złoty followed by "PLN/m²". The count SHALL be a locale integer. The
change SHALL be shown with a sign, at most one decimal and a percent sign (`+10%`, `-3.4%`, `0%`), with an up arrow in
the success colour when positive, a down arrow in the destructive colour when negative and no arrow when zero. The
direction SHALL also be available as text for assistive technology ("up" or "down"), so colour is never the only cue.

#### Scenario: Negative change
- **GIVEN** `change_pct` is -3.4
- **WHEN** the card is shown
- **THEN** it reads `-3.4%` with a down arrow and the text "down" for assistive technology

#### Scenario: Whole-złoty rounding
- **GIVEN** `median` is 10999.6
- **WHEN** the card is shown
- **THEN** it reads `11,000 PLN/m²`

#### Scenario: No change
- **GIVEN** `change_pct` is 0
- **WHEN** the card is shown
- **THEN** it reads `0%` with no arrow

### Requirement: Missing values
A `null` median or previous median SHALL be shown as "n/a", and a `null` change SHALL be shown as "n/a" without an
arrow. A count of 0 SHALL be shown as `0`, not as missing. The cards SHALL keep their layout and titles when values are
missing.

#### Scenario: No previous year
- **GIVEN** `previous_median` and `change_pct` are `null` and `median` is 9000
- **WHEN** the section is shown
- **THEN** "Change vs year earlier" and "Previous-year median" read "n/a" and the other two cards show their values

#### Scenario: No median
- **GIVEN** `median` is `null` and `count` is 0
- **WHEN** the section is shown
- **THEN** the page shows "No data for this period" in place of the cards (see analytics-page)
