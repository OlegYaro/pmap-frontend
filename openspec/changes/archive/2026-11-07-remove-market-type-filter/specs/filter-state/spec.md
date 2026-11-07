# Spec Delta

## MODIFIED Requirements

### Requirement: Filter keys match the backend query
The filter model SHALL have exactly these keys: `voivodeship_code`, `powiat_code`, `gmina_code`, `city_name`,
`district_name`, `date_from`, `date_to`, `price_min`, `price_max`, `area_min`, `area_max`, `rooms`, `floor_min`,
`floor_max`, `function`, `address`, `exclusion_reason`, `run_id`. Every key SHALL be a filter
parameter of `GET /transactions` and of `GET /analytics/timeseries` in the generated API types, checked at build
time. The API parameter `market_type` is deliberately not a key: the app offers no market type filter.

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
