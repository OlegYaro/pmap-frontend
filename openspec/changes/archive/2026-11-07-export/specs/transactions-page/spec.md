# Spec Delta

## MODIFIED Requirements

### Requirement: Page layout
The page at `/` SHALL show a page header titled "Transactions", the filter panel with all fields, the active filter
chips, and the table below them. The header's actions area SHALL contain the "Export CSV" button (see the csv-export capability).

#### Scenario: Layout
- **WHEN** the user opens `/`
- **THEN** the heading "Transactions", the filter controls, the "Active filters" region and the table are shown in
  that order

#### Scenario: Export slot is empty
- **WHEN** the user opens `/`
- **THEN** the export slot in the page header is no longer empty: it contains the "Export CSV" button
