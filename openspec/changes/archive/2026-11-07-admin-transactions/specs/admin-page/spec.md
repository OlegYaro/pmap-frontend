# Spec Delta

## ADDED Requirements

### Requirement: Transactions tab content
The "Transactions" panel SHALL contain a short description of what an admin can do there and a "New transaction" button
that opens the create form (see the admin-transaction-create capability). It SHALL NOT show a "not available" text.

#### Scenario: Transactions panel
- **WHEN** the "Transactions" tab is selected
- **THEN** the panel shows the "New transaction" button

## REMOVED Requirements

### Requirement: Transactions tab placeholder
**Reason**: Manual transaction management now exists, so the placeholder text is replaced by the create control.
**Migration**: See "Transactions tab content" in this capability and the admin-transaction-create capability.
