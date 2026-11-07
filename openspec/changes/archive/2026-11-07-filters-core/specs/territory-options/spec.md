# Spec Delta

## Purpose

Turns the flat territory list from `GET /territories` into voivodeship, powiat and gmina choices with names, and
defines how choosing one level affects the others, for the territory filter and for showing territory names.

## ADDED Requirements

### Requirement: Territory list is loaded once
The territory choices SHALL come from `GET /territories`, sent without a token requirement. The list SHALL be
requested at most once per page load while it stays cached, however many components use it, and SHALL NOT be
refetched on window focus or remount.

#### Scenario: Shared request
- **GIVEN** a filter panel and filter chips are both shown
- **WHEN** the page loads
- **THEN** exactly one `GET /territories` request is sent

### Requirement: Option levels from flat rows
Voivodeship options SHALL be the distinct voivodeships of the rows, powiat options the distinct non-null powiats
with their voivodeship, and gmina options the distinct non-null gminas with their powiat. Each option SHALL have
the TERYT code and the name. Options SHALL be sorted by name with Polish collation.

#### Scenario: Rows to levels
- **GIVEN** rows for voivodeship `14` "mazowieckie", powiat `1465` "Warszawa" and gmina `1465011` "Warszawa", and
  voivodeship `12` "małopolskie" with powiat `1261` "Kraków"
- **WHEN** the options are built
- **THEN** voivodeships are "małopolskie", "mazowieckie"; powiats are "Kraków", "Warszawa"; gminas are
  "Warszawa" under `1465`

#### Scenario: Rows without lower levels
- **GIVEN** a row with a voivodeship and null powiat and gmina
- **WHEN** the options are built
- **THEN** the voivodeship is an option and no empty powiat or gmina option exists

### Requirement: Duplicate gmina names are told apart
When two gminas under the same powiat have the same name, the label of each SHALL include its code, so the user
can tell them apart.

#### Scenario: Urban and rural gmina
- **GIVEN** gminas `0201011` and `0201022` under powiat `0201`, both named "Bolesławiec"
- **WHEN** the options are built
- **THEN** their labels are "Bolesławiec (0201011)" and "Bolesławiec (0201022)"

### Requirement: Choices narrow by parent
Powiat choices SHALL be the powiats of the selected voivodeship, or all powiats when none is selected. Gmina
choices SHALL be the gminas of the selected powiat, and SHALL be unavailable until a powiat is selected.

#### Scenario: Powiats of a voivodeship
- **GIVEN** voivodeship `12` is selected
- **WHEN** the powiat choices are listed
- **THEN** only powiats whose code starts with `12` are offered

#### Scenario: No powiat selected
- **GIVEN** no powiat is selected
- **WHEN** the user looks at the gmina choice
- **THEN** it is disabled

### Requirement: Selecting a level updates the others
Selecting a voivodeship or powiat SHALL clear the levels below it when the value changes. Clearing a level SHALL
clear the levels below it. Selecting a powiat or gmina SHALL set the levels above it from its code prefix. Each
selection SHALL be one filter change.

#### Scenario: Parent clears children
- **GIVEN** the filters are voivodeship `14`, powiat `1465`, gmina `1465011`
- **WHEN** the user selects voivodeship `12`
- **THEN** the filters are `{voivodeship_code: "12"}` and one history entry was pushed

#### Scenario: Child fills parents
- **GIVEN** no territory is selected
- **WHEN** the user selects powiat `1261`
- **THEN** the filters are `{voivodeship_code: "12", powiat_code: "1261"}`

### Requirement: Names by code
Any component SHALL be able to look up the name of a voivodeship, powiat or gmina by code. A code that is not in
the list, or a lookup while the list is loading or failed, SHALL give the code itself.

#### Scenario: Unknown code
- **GIVEN** the territory list has no powiat `9999`
- **WHEN** the name of powiat `9999` is looked up
- **THEN** the result is `9999`
