# Spec Delta

## MODIFIED Requirements

### Requirement: Readable chip labels
Chip labels SHALL use the panel's readable names: territory names from the territory list (the code while it is
missing), function and rows labels (the raw value when unknown), dates as locale dates, prices in PLN
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
- **WHEN** the chips are rendered at `/?function=biurowa&exclusion_reason=clean&address=Marsz`
- **THEN** the chips are "Function: Office", "Rows: Clean" and `Address: "Marsz"`
