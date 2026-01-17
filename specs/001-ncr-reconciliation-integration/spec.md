# Feature Specification: NCR Integration with Reconciliations

**Feature Branch**: `001-ncr-reconciliation-integration`
**Created**: 2026-01-17
**Status**: Draft
**Input**: User description: "Comprehensive NCR integration into the Reconciliation system with status-based financial impact tracking"

## Overview

Non-Conformance Reports (NCRs) track issues with deliveries such as price variances, quality defects, or quantity discrepancies. This feature integrates NCRs into the Reconciliation workflow so that:

- NCR credits (supplier refunds/credits) are automatically included in period reconciliations
- NCR losses (rejected claims) are tracked as unrecovered costs
- Users have visibility into pending NCRs before closing periods
- Open NCRs generate warnings (non-blocking) during period close

### NCR Status to Reconciliation Impact

| NCR Status   | Reconciliation Impact                                             |
| ------------ | ----------------------------------------------------------------- |
| **OPEN**     | Warning shown (non-blocking)                                      |
| **SENT**     | Display as "Pending Credits" (informational)                      |
| **CREDITED** | Auto-sum to `ncr_credits` field                                   |
| **REJECTED** | Auto-sum to `ncr_losses` field                                    |
| **RESOLVED** | Based on user-selected `financial_impact` (CREDIT, LOSS, or NONE) |

## Clarifications

### Session 2026-01-17

- Q: How should NCR losses be treated in the consumption formula? → A: Increase consumption (unrecovered costs absorbed)

## User Scenarios & Testing _(mandatory)_

### User Story 1 - View NCR Impact in Reconciliation (Priority: P1)

As a Supervisor preparing a period-end reconciliation, I need to see the total value of NCR credits and losses automatically calculated and displayed in the reconciliation summary, so that my consumption figures accurately reflect supplier credits received and losses from rejected claims.

**Why this priority**: This is the core value proposition - accurate reconciliation figures depend on NCR data being integrated. Without this, reconciliations are incomplete and potentially misleading.

**Independent Test**: Can be fully tested by creating NCRs with CREDITED and REJECTED statuses, then generating a reconciliation and verifying the ncr_credits and ncr_losses values appear correctly in the summary.

**Acceptance Scenarios**:

1. **Given** an NCR exists with status CREDITED and value SAR 500, **When** I generate a reconciliation for that period/location, **Then** the ncr_credits field shows SAR 500 and this is visible in the adjustments section.
2. **Given** an NCR exists with status REJECTED and value SAR 150, **When** I generate a reconciliation for that period/location, **Then** the ncr_losses field shows SAR 150 and this is visible in the adjustments section.
3. **Given** multiple CREDITED NCRs exist totaling SAR 1,200, **When** I generate a reconciliation, **Then** the ncr_credits field shows the combined total of SAR 1,200.

---

### User Story 2 - Resolve NCR with Financial Impact Selection (Priority: P1)

As an Operator or Supervisor resolving an NCR, I need to specify the resolution type and financial impact (NONE, CREDIT, or LOSS) when marking it as RESOLVED, so that the system knows how to treat this NCR in reconciliations.

**Why this priority**: Users cannot properly close NCRs without this capability. It's essential for the workflow completion and directly impacts reconciliation accuracy.

**Independent Test**: Can be fully tested by creating an NCR, updating it to RESOLVED status with resolution_type and financial_impact values, and verifying these values are stored and reflected in reconciliation calculations.

**Acceptance Scenarios**:

1. **Given** an NCR in OPEN or SENT status, **When** I update the status to RESOLVED, **Then** the system requires me to enter a resolution_type (e.g., "Replacement") and select a financial_impact (NONE, CREDIT, or LOSS).
2. **Given** I attempt to mark an NCR as RESOLVED without providing resolution_type, **When** I submit the update, **Then** the system displays a validation error indicating resolution_type is required.
3. **Given** I attempt to mark an NCR as RESOLVED without selecting financial_impact, **When** I submit the update, **Then** the system displays a validation error indicating financial_impact is required.
4. **Given** an NCR resolved with financial_impact=CREDIT and value SAR 300, **When** I generate a reconciliation, **Then** the ncr_credits field includes this SAR 300.
5. **Given** an NCR resolved with financial_impact=LOSS and value SAR 100, **When** I generate a reconciliation, **Then** the ncr_losses field includes this SAR 100.
6. **Given** an NCR resolved with financial_impact=NONE (e.g., replacement received), **When** I generate a reconciliation, **Then** this NCR does not affect ncr_credits or ncr_losses.

---

### User Story 3 - View Open NCR Warning During Period Close (Priority: P2)

As an Admin attempting to close a period, I need to see a warning listing any OPEN NCRs for that period, so that I can decide whether to resolve them first or proceed with closing the period anyway (non-blocking).

**Why this priority**: Important for visibility and audit trails, but the warning is non-blocking so it doesn't prevent business operations.

**Independent Test**: Can be fully tested by creating OPEN NCRs for a period, then initiating period close and verifying the warning message appears with the correct count and list of NCRs.

**Acceptance Scenarios**:

1. **Given** 3 NCRs exist with OPEN status for the period, **When** I attempt to close the period, **Then** a warning displays listing the 3 open NCRs with their reference numbers and values.
2. **Given** OPEN NCRs exist across multiple locations, **When** I attempt to close the period, **Then** the warning groups NCRs by location.
3. **Given** OPEN NCRs exist, **When** I acknowledge the warning and proceed with period close, **Then** the period closes successfully (non-blocking behavior).
4. **Given** no OPEN NCRs exist for the period, **When** I close the period, **Then** no NCR-related warning appears.

---

### User Story 4 - View Pending Credits from SENT NCRs (Priority: P2)

As a Supervisor reviewing a reconciliation, I need to see the total value of NCRs that have been sent to suppliers but not yet resolved (SENT status) displayed as "Pending Credits", so that I know how much credit is expected but not yet confirmed.

**Why this priority**: Provides valuable visibility into expected credits, though these don't affect the official reconciliation numbers until confirmed.

**Independent Test**: Can be fully tested by creating NCRs with SENT status, generating a reconciliation, and verifying the pending credits total appears in an informational display.

**Acceptance Scenarios**:

1. **Given** an NCR exists with status SENT and value SAR 200, **When** I view a reconciliation for that period, **Then** I see "Pending Credits: SAR 200" with a note that these are awaiting supplier response.
2. **Given** multiple SENT NCRs totaling SAR 750, **When** I view the reconciliation, **Then** the pending credits display shows SAR 750 total with a count of NCRs.
3. **Given** a SENT NCR is updated to CREDITED, **When** I regenerate or refresh the reconciliation, **Then** the value moves from pending credits to ncr_credits.

---

### User Story 5 - View NCR Summary by Period/Location (Priority: P3)

As a Supervisor or Admin, I need to retrieve a summary of NCRs for a specific period and location categorized by status (credited, losses, pending, open), so that I can quickly assess the NCR situation before or during reconciliation.

**Why this priority**: A convenience feature for reporting and analysis. Core functionality works without it, but it improves user experience.

**Independent Test**: Can be fully tested by creating NCRs with various statuses, calling the summary endpoint, and verifying the breakdown is accurate.

**Acceptance Scenarios**:

1. **Given** I request an NCR summary for period X and location Y, **When** the summary returns, **Then** I see totals and counts for credited, losses, pending, and open categories.
2. **Given** I have NCRs in each status category, **When** I request the summary, **Then** each category lists the individual NCRs with key details (NCR number, delivery reference, value, item).

---

### Edge Cases

- What happens when an NCR is linked to a delivery that spans multiple periods?
  - NCRs are associated with the period of their linked delivery (`delivery.period_id`). Manual NCRs without a delivery link fall back to the period containing their creation date.
- What happens when a reconciliation is regenerated after NCR status changes?
  - The reconciliation recalculates ncr_credits and ncr_losses based on current NCR statuses.
- How does the system handle NCRs with zero value?
  - Zero-value NCRs are included in counts but contribute SAR 0 to totals.
- What happens to existing RESOLVED NCRs that lack financial_impact?
  - They default to NONE impact until manually updated (no retroactive effect on reconciliations).

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST calculate ncr_credits as the sum of NCR values where status=CREDITED OR (status=RESOLVED AND financial_impact=CREDIT)
- **FR-002**: System MUST calculate ncr_losses as the sum of NCR values where status=REJECTED OR (status=RESOLVED AND financial_impact=LOSS)
- **FR-003**: System MUST require resolution_type (free text) when updating an NCR status to RESOLVED
- **FR-004**: System MUST require financial_impact selection (NONE, CREDIT, or LOSS) when updating an NCR status to RESOLVED
- **FR-005**: System MUST store ncr_credits and ncr_losses fields on each Reconciliation record
- **FR-006**: System MUST display SENT NCRs as "Pending Credits" with a note indicating they are awaiting supplier response
- **FR-007**: System MUST show a non-blocking warning listing OPEN NCRs (grouped by location) when attempting period close
- **FR-008**: System MUST allow period close to proceed even when OPEN NCRs exist (warning only)
- **FR-009**: System MUST include ncr_credits (subtracted, reducing consumption) and ncr_losses (added, increasing consumption as unrecovered costs) in the consumption calculation formula
- **FR-010**: System MUST provide an NCR summary endpoint returning counts and totals for credited, losses, pending, and open categories
- **FR-011**: System MUST associate NCRs to periods via their linked delivery's period_id, or fall back to creation date range for manual NCRs without deliveries

### Key Entities

- **NCR**: Represents a Non-Conformance Report. Extended with:
  - `resolution_type` (optional string): Free-text description of how the NCR was resolved (e.g., "Replacement", "Writeoff", "Price Adjustment")
  - `financial_impact` (optional enum): NONE, CREDIT, or LOSS - determines reconciliation treatment when status=RESOLVED

- **NCRFinancialImpact** (new enum): NONE | CREDIT | LOSS
  - NONE: No financial adjustment (e.g., replacement received, no money exchanged)
  - CREDIT: Value recovered as credit (treated like CREDITED status in reconciliations)
  - LOSS: Value lost (treated like REJECTED status in reconciliations)

- **Reconciliation**: Extended with:
  - `ncr_credits`: Sum of NCR values from CREDITED status and RESOLVED with CREDIT impact
  - `ncr_losses`: Sum of NCR values from REJECTED status and RESOLVED with LOSS impact

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of CREDITED and REJECTED NCRs are automatically reflected in reconciliation figures without manual entry
- **SC-002**: Users can complete NCR resolution with financial impact selection in under 30 seconds
- **SC-003**: Open NCR warnings appear within the period close workflow for 100% of periods that have open NCRs
- **SC-004**: NCR summary retrieval returns complete categorized data for a period/location
- **SC-005**: Reconciliation consumption formula correctly includes ncr_credits (subtracted to reduce consumption) and ncr_losses (added to increase consumption as absorbed costs)
- **SC-006**: Zero data entry errors from manual NCR credit/loss tracking (previously done via spreadsheets or manual credits field)

## Assumptions

- The existing NCR model has a `value` or `total_value` field representing the monetary amount of the NCR
- NCRs are already linked to deliveries via a `delivery_id` foreign key (for delivery-related NCRs)
- The Period model has date range fields (start_date, end_date) for filtering manual NCRs by creation date
- Users understand the distinction between CREDITED (supplier confirmed credit), REJECTED (supplier denied claim), and RESOLVED (custom resolution with financial impact selection)
- The consumption formula currently includes a `credits` field for manual credits, and this will remain separate from `ncr_credits`
