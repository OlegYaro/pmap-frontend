# Spec Delta

## Purpose

Defines how the transaction list sort (field and direction) lives in the URL search params, its defaults and
validation, so a shared link reproduces the same server-side order.

## ADDED Requirements

### Requirement: Sort fields
The list sort SHALL be one of the 14 fields the `GET /transactions` API accepts: `id`, `transaction_date`,
`price_premises`, `area_usable`, `rooms`, `floor`, `market_type`, `function`, `address`, `powiat_code`,
`gmina_code`, `city_name`, `district_name`, `updated_at`. The direction SHALL be `asc` or `desc`. The set SHALL be
checked against the generated API types at build time.

#### Scenario: Backend drops a sort field
- **GIVEN** the regenerated API types no longer allow `sort=updated_at`
- **WHEN** the project is built
- **THEN** the type check fails

### Requirement: Sort read from the URL
The current sort SHALL be read from the `sort` and `order` search params. A missing or unknown `sort` SHALL mean
`transaction_date`; a missing or unknown `order` SHALL mean `desc`. Each param SHALL be validated on its own.

#### Scenario: Default sort
- **WHEN** the user opens `/`
- **THEN** the sort is `transaction_date` `desc`

#### Scenario: Shared link with a sort
- **WHEN** the user opens `/?sort=price_premises&order=asc`
- **THEN** the sort is `price_premises` `asc`

#### Scenario: Sort field without a column
- **WHEN** the user opens `/?sort=updated_at`
- **THEN** the sort is `updated_at` `desc`

#### Scenario: Unknown values
- **WHEN** the user opens `/?sort=price&order=up`
- **THEN** the sort is `transaction_date` `desc`

### Requirement: Changing the sort updates the URL
Setting the sort SHALL write `sort` and `order` into the URL and keep the filter params as they are. A field equal
to the default `transaction_date` SHALL be written without `sort`, and the direction `desc` without `order`. Each
change SHALL push a new history entry; a change that leaves the sort equal SHALL not navigate.

#### Scenario: Sort by price ascending
- **GIVEN** the URL is `/?rooms=2`
- **WHEN** the sort is set to `price_premises` `asc`
- **THEN** the URL search is `?rooms=2&sort=price_premises&order=asc`

#### Scenario: Back to the default
- **GIVEN** the URL is `/?rooms=2&sort=price_premises&order=asc`
- **WHEN** the sort is set to `transaction_date` `desc`
- **THEN** the URL search is `?rooms=2`

#### Scenario: Back restores the previous sort
- **GIVEN** the URL is `/?sort=rooms&order=asc`
- **WHEN** the sort is set to `rooms` `desc` and the user goes Back
- **THEN** the URL is `/?sort=rooms&order=asc` again

#### Scenario: Unchanged sort
- **GIVEN** the URL is `/?sort=rooms`
- **WHEN** the sort is set to `rooms` `desc`
- **THEN** no navigation happens and the history length is unchanged
