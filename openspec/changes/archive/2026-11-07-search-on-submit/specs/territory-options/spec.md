# Spec Delta

## MODIFIED Requirements

### Requirement: Selecting a level updates the others
Selecting a voivodeship or powiat SHALL clear the levels below it when the value changes. Clearing a level SHALL
clear the levels below it. Selecting a powiat or gmina SHALL set the levels above it from its code prefix. Each
selection SHALL be one change of the draft.

#### Scenario: Parent clears children
- **GIVEN** the filters are voivodeship `14`, powiat `1465`, gmina `1465011`
- **WHEN** the user selects voivodeship `12`
- **THEN** the draft is `{voivodeship_code: "12"}` and the URL is unchanged

#### Scenario: Child fills parents
- **GIVEN** no territory is selected
- **WHEN** the user selects powiat `1261`
- **THEN** the draft is `{voivodeship_code: "12", powiat_code: "1261"}`
