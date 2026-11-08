# admin-page Specification

## Purpose
Defines the frame of the `/admin` page for administrators: its heading and the tabs that group the admin tools.

## Requirements

### Requirement: Heading and tabs
The admin page SHALL show the heading "Admin" and a tab list with the tabs "Runs" and "Transactions", "Runs" first.
Exactly one tab SHALL be selected and its panel shown. The selected tab SHALL be kept in the URL as `tab=runs` or
`tab=transactions`, and a missing or unknown value SHALL mean "Runs". Changing the tab SHALL push a history entry.

#### Scenario: Default tab
- **GIVEN** the user is an admin
- **WHEN** the user opens `/admin`
- **THEN** the heading "Admin" is shown, the tab "Runs" is selected and the runs panel is shown

#### Scenario: Tab from the URL
- **WHEN** an admin opens `/admin?tab=transactions`
- **THEN** the tab "Transactions" is selected and its panel is shown

#### Scenario: Unknown tab
- **WHEN** an admin opens `/admin?tab=nope`
- **THEN** the tab "Runs" is selected

### Requirement: Keyboard operation
The tabs SHALL follow the tabs pattern: the list is one tab stop, arrow keys move between tabs, and each panel is
labelled by its tab.

#### Scenario: Arrow keys
- **GIVEN** the "Runs" tab has focus
- **WHEN** the user presses the right arrow key
- **THEN** focus and selection move to the "Transactions" tab

### Requirement: Transactions tab content
The "Transactions" panel SHALL contain a short description of what an admin can do there and a "New transaction" button
that opens the create form (see the admin-transaction-create capability). It SHALL NOT show a "not available" text.

#### Scenario: Transactions panel
- **WHEN** the "Transactions" tab is selected
- **THEN** the panel shows the "New transaction" button
