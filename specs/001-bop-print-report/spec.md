# Feature Specification: POB Print Report

**Feature Branch**: `001-bop-print-report`
**Created**: 2026-01-18
**Status**: Draft
**Input**: User description: "We need to introduce a new feature on the BOP page. A print button that prints the BOP as a report with three signature places at the bottom of the report. One for the 'Operator Signature', and one for the 'Manager Signature' and the last one should be for 'Client Signature'. The report heading should display the period and the total Mandays and the Manday Cost. It should look nice, professional, and informative."

## Clarifications

### Session 2026-01-18

- Q: Should the report display Manday Cost (which requires consumption data from reconciliation) or only Total Mandays? → A: Display only Total Mandays; exclude Manday Cost since consumption data isn't available on the POB page.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Print POB Report for Period Sign-off (Priority: P1)

As an operator or manager, I want to print a professional POB report showing the period's manday data with signature fields so that all parties (Operator, Manager, Client) can review and physically sign off on the recorded personnel counts.

**Why this priority**: This is the core functionality requested. The printed report serves as an official document for multi-party verification and approval of manday records, which is critical for billing and contract compliance in catering operations.

**Independent Test**: Can be fully tested by clicking the print button on the POB page and verifying a properly formatted report opens in the browser's print dialog with all required elements visible.

**Acceptance Scenarios**:

1. **Given** a user is on the POB page with data loaded for a period, **When** they click the "Print Report" button, **Then** a print-optimized view opens showing the report with period header, manday summary, daily entries table, and three signature blocks.

2. **Given** the print report is displayed, **When** the user inspects the header section, **Then** it shows the period name, date range, location name, and total mandays.

3. **Given** the print report is displayed, **When** the user inspects the footer section, **Then** three signature blocks are visible with labels "Operator Signature", "Manager Signature", and "Client Signature", each with a signature line and space for date.

---

### User Story 2 - View Print Preview Before Printing (Priority: P2)

As a user, I want to see a print preview of the report before sending it to the printer so that I can verify the content and layout are correct.

**Why this priority**: Prevents wasted paper and allows users to verify data accuracy before creating a physical document.

**Independent Test**: Can be tested by clicking the print button and verifying the browser's print preview shows an accurate representation of the final printed document.

**Acceptance Scenarios**:

1. **Given** a user clicks the print button, **When** the print dialog opens, **Then** the preview displays all report sections in a professional layout optimized for A4 paper.

2. **Given** a user is in print preview, **When** they review the daily entries table, **Then** all dates in the period are visible with their corresponding crew counts, visitor meals, and totals.

---

### User Story 3 - Print Report with Proper Formatting (Priority: P3)

As a user printing the report, I want the printed output to look professional and be properly formatted for standard paper sizes so that it can be filed or shared as an official document.

**Why this priority**: Professional appearance and proper formatting ensure the document is suitable for official records and client-facing use.

**Independent Test**: Can be tested by actually printing the report and verifying margins, fonts, and layout are appropriate for standard A4 paper.

**Acceptance Scenarios**:

1. **Given** a user prints the report, **When** reviewing the physical output, **Then** all content fits within standard print margins without cutoff or overflow.

2. **Given** a user prints a report with many daily entries, **When** the entries exceed one page, **Then** the report paginates cleanly with headers repeated on each page and signature blocks appearing only on the final page.

---

### Edge Cases

- What happens when no POB data exists for the period? The print button should be disabled or hidden with appropriate messaging.
- How does the system handle very long location names? Names should truncate gracefully without breaking the layout.
- What happens when manday cost cannot be calculated (e.g., zero mandays)? Display "N/A" or a dash instead of showing an error or division by zero.
- How does the report handle periods spanning multiple months? The date range should display correctly regardless of period length.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST display a "Print Report" button on the POB page when valid POB data is loaded for the current period.
- **FR-002**: System MUST generate a print-optimized report layout when the print button is clicked.
- **FR-003**: The report header MUST display: period name, period date range, location name, and total mandays count.
- **FR-004**: The report body MUST display a table of daily POB entries showing: date, crew count (mandays), visitor meals, and daily total for each day in the period.
- **FR-005**: The report footer MUST include three signature blocks labeled "Operator Signature", "Manager Signature", and "Client Signature".
- **FR-006**: Each signature block MUST include a signature line and a date field for the signatory to complete.
- **FR-007**: System MUST disable the print button when the POB page is in a loading state or when no data is available.
- **FR-008**: The print layout MUST be optimized for standard A4 paper size with appropriate margins.
- **FR-009**: System MUST use CSS print media queries to hide non-printable UI elements (navigation, buttons, etc.) from the printed output.
- **FR-010**: The printed report MUST include a company/system header or logo placeholder for branding consistency.

### Key Entities

- **POBEntry**: Represents a single day's personnel count with date, crew count, extra count (visitor meals), and total count.
- **POBSummary**: Aggregated totals including total crew count, total extra count, total mandays, and entries count.
- **Period**: The accounting period with name, start date, end date, and status.
- **Location**: The site/location with id, code, and name.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can generate a printable POB report within 3 seconds of clicking the print button.
- **SC-002**: The printed report fits on standard A4 paper without horizontal scrolling or content cutoff for periods up to 31 days.
- **SC-003**: All three signature blocks are visible on the printed document without requiring users to manually adjust print settings.
- **SC-004**: 100% of required data fields (period name, date range, location, total mandays, daily entries, signature blocks) are present on every generated report.
- **SC-005**: Users can successfully print the report using standard browser print functionality without requiring additional software or plugins.
