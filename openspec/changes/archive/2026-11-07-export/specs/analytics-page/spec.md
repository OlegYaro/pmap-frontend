# Spec Delta

## MODIFIED Requirements

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
