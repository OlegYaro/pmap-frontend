# Spec Delta

## REMOVED Requirements

### Requirement: Territories preview at the home route
**Reason**: The preview only proved the backend connection. `/` is now the transactions page (capability
`transactions-page`), which proves the same end to end with real data.
**Migration**: None for users. Territory data is still fetched once per page load for the filter panel
(capability `territory-options`); the preview page and its tests are deleted.

### Requirement: Loading state
**Reason**: Belonged to the removed territories preview page.
**Migration**: The transactions page has its own loading state (skeleton rows, capability `transactions-page`).

### Requirement: Error state
**Reason**: Belonged to the removed territories preview page.
**Migration**: The transactions page has its own error state with retry (capability `transactions-page`).
