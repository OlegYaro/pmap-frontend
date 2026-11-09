# Spec Delta

## REMOVED Requirements

### Requirement: History behaviour of filter changes
**Reason**: No input writes to the URL while typing any more; the filter panel applies its draft in one step.
**Migration**: Use "History entry of an applied search".

## ADDED Requirements

### Requirement: History entry of an applied search
Applying the filters from the panel's Search button SHALL push one history entry, so Back returns to the previous filters. Removing a chip and resetting all filters SHALL push one entry each.

#### Scenario: Search pushes
- **GIVEN** the user is on `/?rooms=2`
- **WHEN** the draft with `function: "biurowa"` is applied and the user goes Back
- **THEN** the URL is `/?rooms=2` again
