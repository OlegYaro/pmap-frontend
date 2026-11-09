# filter-state Specification

## Purpose
Defines the shared transaction filter model, how it is stored in the URL search params, and how pages read and
change it, so every page sends the backend only valid, known filter parameters.

## Requirements

### Requirement: Filter keys match the backend query
The filter model SHALL have exactly these keys: `voivodeship_code`, `powiat_code`, `gmina_code`, `city_name`,
`district_name`, `date_from`, `date_to`, `price_min`, `price_max`, `area_min`, `area_max`, `rooms`, `floor_min`,
`floor_max`, `function`, `address`, `exclusion_reason`, `run_id`. Each SHALL be a filter parameter of the generated
API types, checked at build time. `market_type` is deliberately not a key.

#### Scenario: Backend renames a parameter
- **GIVEN** the regenerated API types no longer contain `district_name`
- **WHEN** the project is built
- **THEN** the type check fails

#### Scenario: Paging keys are not filters
- **WHEN** the model is compared with the `GET /transactions` query
- **THEN** `sort`, `order`, `limit`, `after_value` and `after_id` are not filter keys

#### Scenario: Market type is not a filter
- **WHEN** the search params are `?market_type=wtorny&rooms=2`
- **THEN** the filters are `{rooms: [2]}`

### Requirement: Unknown and empty params are ignored
Reading filters from URL search params SHALL ignore every key that is not a filter key, and SHALL ignore values
that are empty or only whitespace. Text values SHALL be trimmed. For a single-value key given more than once, the
first valid value SHALL be used.

#### Scenario: Unknown key
- **WHEN** the search params are `?foo=1&city_name=Warszawa`
- **THEN** the filters are `{city_name: "Warszawa"}`

#### Scenario: Empty and padded values
- **WHEN** the search params are `?address=%20&district_name=%20Mokot%C3%B3w%20`
- **THEN** the filters are `{district_name: "Mokotów"}`

#### Scenario: Repeated single-value key
- **WHEN** the search params are `?city_name=Kraków&city_name=Warszawa`
- **THEN** `city_name` is `Kraków`

### Requirement: Territory codes are validated
`voivodeship_code` SHALL be read only when it has 2 digits, `powiat_code` 4 digits and `gmina_code` 7 digits;
other values are ignored. A missing parent code SHALL be filled from the child's prefix, and a child code that
does not start with the parent code given in the URL SHALL be ignored together with its own children.

#### Scenario: Malformed code
- **WHEN** the search params are `?powiat_code=26`
- **THEN** the filters have no `powiat_code`

#### Scenario: Parents filled from a gmina
- **WHEN** the search params are `?gmina_code=1465011`
- **THEN** the filters are `{voivodeship_code: "14", powiat_code: "1465", gmina_code: "1465011"}`

#### Scenario: Contradicting child
- **WHEN** the search params are `?voivodeship_code=12&powiat_code=1465&gmina_code=1465011`
- **THEN** the filters are `{voivodeship_code: "12"}`

### Requirement: Numbers are validated
`price_min`, `price_max`, `area_min` and `area_max` SHALL be read only as finite decimal numbers greater than or
equal to 0. `floor_min` and `floor_max` SHALL be read only as integers, negative allowed. Other values SHALL be
ignored. A minimum greater than its maximum SHALL be kept as given.

#### Scenario: Valid numbers
- **WHEN** the search params are `?price_min=200000&area_max=55.5&floor_min=-1`
- **THEN** the filters are `{price_min: 200000, area_max: 55.5, floor_min: -1}`

#### Scenario: Invalid numbers
- **WHEN** the search params are `?price_min=-5&area_min=abc&floor_max=2.5`
- **THEN** the filters are empty

### Requirement: Rooms are validated
`rooms` SHALL be read from every repeated `rooms` param that is an integer from 1 to 99. Other values SHALL be
ignored, duplicates removed and the list sorted ascending. An empty result SHALL mean no rooms filter.

#### Scenario: Repeated rooms
- **WHEN** the search params are `?rooms=3&rooms=2&rooms=3&rooms=x&rooms=0`
- **THEN** `rooms` is `[2, 3]`

### Requirement: Dates are validated
`date_from` and `date_to` SHALL be read only as `YYYY-MM-DD` strings that name a real calendar date; other values
SHALL be ignored. A start after the end SHALL be kept as given.

#### Scenario: Real date
- **WHEN** the search params are `?date_from=2024-02-29`
- **THEN** `date_from` is `2024-02-29`

#### Scenario: Impossible or non-ISO date
- **WHEN** the search params are `?date_from=2023-02-29&date_to=01.02.2024`
- **THEN** the filters are empty

### Requirement: Categorical values are validated
`function` SHALL accept any non-empty text, since new values can appear in the data.
`exclusion_reason` SHALL keep only the known values `clean`, `fractional_share`, `package_deal`, `non_market`,
`missing_fields`, `implausible_area`, `unassigned`, `no_city_district`, `implausible_price`, without duplicates, in
this order. `run_id` SHALL be read only as a UUID.

#### Scenario: Known and unknown reasons
- **WHEN** the search params are `?exclusion_reason=package_deal&exclusion_reason=bogus&exclusion_reason=clean`
- **THEN** `exclusion_reason` is `["clean", "package_deal"]`

#### Scenario: Malformed run id
- **WHEN** the search params are `?run_id=123`
- **THEN** the filters have no `run_id`

#### Scenario: New market type
- **WHEN** the search params are `?market_type=nowy`
- **THEN** the filters are empty, because `market_type` is not a filter

#### Scenario: New function
- **WHEN** the search params are `?function=nowa`
- **THEN** `function` is `nowa`

### Requirement: Canonical serialization
Writing filters to search params SHALL emit only filter keys with a value, in the fixed key order of the model,
with one repeated param per array item and numbers in plain decimal form. Empty text and empty arrays SHALL be
omitted. Reading the written params SHALL give back the same filters.

#### Scenario: Arrays repeat the key
- **WHEN** the filters `{powiat_code: "0264", rooms: [2, 3], city_name: ""}` are written
- **THEN** the result is `powiat_code=0264&rooms=2&rooms=3`

#### Scenario: Round trip
- **GIVEN** filters with every key set to a valid value
- **WHEN** they are written to search params and read back
- **THEN** the result equals the original filters

### Requirement: Filters read from the current URL
Pages SHALL read the current filters from the URL search params of the current location. The filters value SHALL
keep its identity while the filter part of the URL is unchanged, including when only non-filter params change.

#### Scenario: Shared link
- **WHEN** the user opens `/?powiat_code=0264&rooms=2&rooms=3`
- **THEN** the current filters are `{voivodeship_code: "02", powiat_code: "0264", rooms: [2, 3]}`

#### Scenario: Sort change keeps the filters value
- **GIVEN** the URL is `/?city_name=Wrocław&sort=price_premises`
- **WHEN** only `sort` changes to `area_usable`
- **THEN** the filters value is the same object as before

### Requirement: Changing filters updates the URL
Setting, removing or resetting filters SHALL write the new filters into the URL in canonical form. Every other
search param SHALL be removed, except `sort` and `order`, which SHALL be kept. A change that leaves the filters
equal SHALL not navigate.

#### Scenario: Paging params are dropped
- **GIVEN** the URL is `/?sort=price_premises&order=asc&after_id=10&after_value=5&city_name=Łódź`
- **WHEN** `rooms` is set to `[2]`
- **THEN** the URL search is `?city_name=%C5%81%C3%B3d%C5%BA&rooms=2&sort=price_premises&order=asc`

#### Scenario: Reset
- **GIVEN** the URL is `/?powiat_code=0264&rooms=2&sort=rooms`
- **WHEN** the filters are reset
- **THEN** the URL search is `?sort=rooms`

#### Scenario: No-op change
- **GIVEN** the URL is `/?rooms=2`
- **WHEN** `rooms` is set to `[2]`
- **THEN** no navigation happens and the history length is unchanged

### Requirement: History entry of an applied search
Applying the filters from the panel's Search button SHALL push one history entry, so Back returns to the previous filters. Removing a chip and resetting all filters SHALL push one entry each.

#### Scenario: Search pushes
- **GIVEN** the user is on `/?rooms=2`
- **WHEN** the draft with `function: "biurowa"` is applied and the user goes Back
- **THEN** the URL is `/?rooms=2` again
