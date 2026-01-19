# Feature Specification: PRF/PO Workflow

**Feature Branch**: `001-prf-po-workflow`
**Created**: 2026-01-19
**Status**: Draft
**Input**: User description: "Implement complete Purchase Requisition Form (PRF) / Purchase Order (PO) workflow with approval chain, email notifications, a new PROCUREMENT_SPECIALIST role, and mandatory delivery-PO linking"

## Clarifications

### Session 2026-01-19

- Q: What is the PRF-to-PO cardinality? → A: One PRF → One PO (1:1 relationship; each PRF can only have one PO created from it)
- Q: How should rejected PRF revision be handled? → A: User can "Clone" a rejected PRF to create a new DRAFT PRF with copied content
- Q: Can PO line items be modified from the source PRF? → A: PO line items are fully editable (can add, remove, modify any field)
- Q: Is a rejection reason required when rejecting a PRF? → A: Mandatory free-text reason (Supervisor must enter explanation before rejecting)
- Q: Can OPEN POs be edited after creation? → A: OPEN POs can be edited anytime (full edit capability until closed)

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Create and Submit Purchase Requisition (Priority: P1)

An Operator needs to request materials or supplies for their location. They create a Purchase Requisition Form specifying what items are needed, quantities, estimated costs, and delivery requirements. Once complete, they submit it for supervisor approval.

**Why this priority**: This is the entry point for the entire procurement workflow. Without the ability to create and submit PRFs, no subsequent workflow steps can occur.

**Independent Test**: Can be fully tested by creating a PRF with multiple line items, saving as draft, then submitting for approval. Delivers value by formalizing purchase requests in the system.

**Acceptance Scenarios**:

1. **Given** an authenticated Operator on the Orders page, **When** they click "New PRF" and fill in required fields (location, category, at least one line item with description, quantity, unit, and estimated price), **Then** the system saves the PRF in DRAFT status with an auto-generated PRF number.

2. **Given** a PRF in DRAFT status, **When** the requester clicks "Submit for Approval", **Then** the PRF status changes to PENDING and becomes read-only for the requester.

3. **Given** a PRF in DRAFT status, **When** the requester adds multiple line items, **Then** the system calculates the total value as the sum of all line values (required_qty × estimated_price).

---

### User Story 2 - Approve or Reject Purchase Requisition (Priority: P1)

A Supervisor reviews pending PRFs and either approves or rejects them. Approved PRFs trigger email notifications to procurement specialists so they can proceed with purchasing.

**Why this priority**: Approval is a critical control point that enables the procurement process to continue. Without it, PRFs cannot progress to POs.

**Independent Test**: Can be tested by having a Supervisor view a PENDING PRF, reviewing details, and clicking Approve or Reject. Delivers value by establishing approval controls.

**Acceptance Scenarios**:

1. **Given** a PRF in PENDING status, **When** a Supervisor clicks "Approve", **Then** the PRF status changes to APPROVED, the approval date and approver are recorded, and email notifications are sent to all PROCUREMENT_SPECIALIST users.

2. **Given** a PRF in PENDING status, **When** a Supervisor clicks "Reject" and enters a mandatory rejection reason, **Then** the PRF status changes to REJECTED, the rejection reason is recorded, and the requester can view the rejection reason but cannot resubmit.

3. **Given** a PRF in PENDING status, **When** a user without Supervisor or Admin role tries to approve/reject, **Then** the system denies the action.

---

### User Story 3 - Create Purchase Order from Approved PRF (Priority: P1)

A Procurement Specialist receives notification of an approved PRF, logs in, selects a supplier, and creates a formal Purchase Order with pricing, VAT calculations, and terms. The PO is then emailed to the supplier.

**Why this priority**: Converting approved PRFs to POs is the core procurement function. This enables actual purchasing to occur.

**Independent Test**: Can be tested by creating a PO from an approved PRF, selecting a supplier, adjusting quantities and prices, and saving. Delivers value by generating formal purchase documents.

**Acceptance Scenarios**:

1. **Given** an approved PRF, **When** a Procurement Specialist clicks "Create PO", **Then** the system creates a new PO pre-populated with PRF line items, requiring supplier selection before save.

2. **Given** a PO being created, **When** the user enters unit prices and quantities, **Then** the system calculates line totals, VAT amounts (15% default), and grand totals automatically.

3. **Given** a completed PO, **When** the user saves the PO, **Then** the system generates a PO number, saves the PO in OPEN status, and sends email notification to all supplier email addresses.

---

### User Story 4 - Link Delivery to Purchase Order (Priority: P2)

When goods arrive, an Operator creates a delivery record. The system requires selecting an existing PO to link the delivery, ensuring all deliveries are tracked against orders.

**Why this priority**: Mandatory PO-delivery linking ensures complete traceability but depends on POs existing first.

**Independent Test**: Can be tested by creating a delivery, selecting a PO, and verifying the system auto-populates supplier and expected items. Delivers value by maintaining procurement traceability.

**Acceptance Scenarios**:

1. **Given** an Operator creating a new delivery, **When** they reach the PO selection field, **Then** the system requires a PO to be selected (field is mandatory, not optional).

2. **Given** a PO selected during delivery creation, **When** the user confirms selection, **Then** the system auto-populates the supplier and offers PO line items as delivery line suggestions.

3. **Given** a delivery being created, **When** no open POs exist, **Then** the system displays a message indicating no open POs are available and the user cannot proceed until a PO exists.

---

### User Story 5 - Close Purchase Order (Priority: P2)

A Procurement Specialist closes a PO when all expected deliveries have been received or when the order is complete. Closed POs can no longer have deliveries linked to them.

**Why this priority**: Closing POs completes the procurement cycle and prevents further deliveries against completed orders.

**Independent Test**: Can be tested by selecting an open PO with linked deliveries and closing it. Delivers value by providing order lifecycle management.

**Acceptance Scenarios**:

1. **Given** an OPEN PO with at least one linked delivery, **When** a Procurement Specialist clicks "Close PO", **Then** the PO status changes to CLOSED and it no longer appears in the delivery PO selection dropdown.

2. **Given** a CLOSED PO, **When** an Operator tries to create a delivery linked to it, **Then** the system does not show the closed PO as an option.

---

### User Story 6 - Procurement Specialist Access Control (Priority: P2)

A new PROCUREMENT_SPECIALIST role is added with specific permissions limited to procurement-related functions. These users can manage orders and view related deliveries but cannot access master data, issues, transfers, or reconciliations.

**Why this priority**: Role-based access control is foundational for security but depends on the core features being in place.

**Independent Test**: Can be tested by logging in as a PROCUREMENT_SPECIALIST and verifying menu items and page access. Delivers value by enforcing separation of duties.

**Acceptance Scenarios**:

1. **Given** a user with PROCUREMENT_SPECIALIST role, **When** they log in, **Then** they see only Dashboard, Orders (full access), and Deliveries (view only for PO-linked) in the navigation menu.

2. **Given** a user with PROCUREMENT_SPECIALIST role, **When** they try to access Master Data, Issues, Transfers, or Reconciliations pages, **Then** the system denies access.

3. **Given** a user with PROCUREMENT_SPECIALIST role, **When** they access the Orders page, **Then** they can view all approved PRFs and create/edit/close POs.

---

### User Story 7 - Manage Supplier Email Contacts (Priority: P3)

Administrators can add and manage multiple email addresses for each supplier. These emails are used when sending PO notifications.

**Why this priority**: Supplier email management supports the notification feature but is lower priority than core workflow.

**Independent Test**: Can be tested by editing a supplier and adding/removing email addresses. Delivers value by enabling multi-recipient PO notifications.

**Acceptance Scenarios**:

1. **Given** a supplier edit form, **When** an Admin adds multiple email addresses, **Then** the system saves all email addresses and validates each one's format.

2. **Given** a PO being created for a supplier with multiple emails, **When** the PO is saved, **Then** email notifications are sent to all supplier email addresses.

---

### Edge Cases

- What happens when a PRF is submitted but no PROCUREMENT_SPECIALIST users exist? → The PRF is approved but no email notification is sent; system logs a warning.
- How does the system handle PO creation if the supplier has no email addresses? → The PO is created successfully but no email is sent; a warning is displayed to the user.
- What happens if a user tries to delete a PRF that has been converted to a PO? → The system prevents deletion; PRFs with linked POs are archived, not deleted.
- How does the system behave when delivery quantities exceed PO quantities? → The system displays a warning but allows the delivery to proceed (over-delivery scenario).
- What happens if email sending fails? → The PO/PRF action completes but the system logs the email failure; users can manually resend from the detail page.

## Requirements _(mandatory)_

### Functional Requirements

**PRF Management**
- **FR-001**: System MUST allow Operators, Supervisors, and Admins to create Purchase Requisition Forms (PRFs)
- **FR-002**: System MUST auto-generate unique PRF numbers in a sequential format (e.g., PRF-001, PRF-002)
- **FR-003**: System MUST support PRF types: URGENT, DPA (Direct Purchase Approval), and NORMAL
- **FR-004**: System MUST support PRF categories: MATERIAL, CONSUMABLES, SPARE_PARTS, ASSET, and SERVICES
- **FR-005**: System MUST allow PRF line items to reference existing inventory items or use custom item descriptions
- **FR-006**: System MUST calculate PRF line values as required_qty × estimated_price
- **FR-007**: System MUST calculate PRF total value as sum of all line values
- **FR-008**: System MUST support PRF statuses: DRAFT, PENDING, APPROVED, REJECTED, CLOSED
- **FR-009**: System MUST allow only the requester to edit or delete DRAFT PRFs
- **FR-010**: System MUST make PRFs read-only after submission (status change from DRAFT)

**PRF Approval**
- **FR-011**: System MUST allow only Supervisors and Admins to approve or reject PENDING PRFs
- **FR-012**: System MUST record the approver and approval date when a PRF is approved
- **FR-013**: System MUST send email notifications to all PROCUREMENT_SPECIALIST users when a PRF is approved
- **FR-014**: System MUST prevent re-submission of REJECTED PRFs
- **FR-014a**: System MUST require Supervisors to enter a mandatory free-text rejection reason when rejecting a PRF
- **FR-014b**: System MUST allow users to "Clone" a REJECTED PRF, creating a new DRAFT PRF with copied content (new PRF number assigned, original rejection preserved for audit)

**PO Management**
- **FR-015**: System MUST allow Procurement Specialists and Admins to create exactly one PO from each approved PRF (1:1 relationship)
- **FR-016**: System MUST auto-generate unique PO numbers in a sequential format (e.g., PO-001, PO-002)
- **FR-017**: System MUST require supplier selection when creating a PO
- **FR-018**: System MUST pre-populate PO line items from the source PRF when creating from an approved PRF; line items are fully editable (add, remove, modify any field)
- **FR-019**: System MUST calculate PO line totals including discount and VAT (15% default for Saudi Arabia)
- **FR-020**: System MUST calculate PO grand totals (before discount, discount, after discount, VAT, final total)
- **FR-021**: System MUST support PO statuses: OPEN and CLOSED
- **FR-021a**: System MUST allow OPEN POs to be fully edited (all fields, line items) until closed
- **FR-022**: System MUST send email notifications to all supplier email addresses when a PO is created
- **FR-023**: System MUST allow only Procurement Specialists and Admins to close POs

**Delivery Integration**
- **FR-024**: System MUST require PO selection when creating deliveries (mandatory, not optional)
- **FR-025**: System MUST filter PO selection dropdown to show only OPEN POs
- **FR-026**: System MUST auto-populate supplier when a PO is selected for delivery
- **FR-027**: System MUST display a warning when delivery quantities exceed PO quantities

**Role & Permissions**
- **FR-028**: System MUST support a new PROCUREMENT_SPECIALIST role
- **FR-029**: PROCUREMENT_SPECIALIST role MUST have access to: Dashboard, Orders (full), Deliveries (view PO-linked only)
- **FR-030**: PROCUREMENT_SPECIALIST role MUST NOT have access to: Master Data, Issues, Transfers, Reconciliations, Period Close

**Supplier Management**
- **FR-031**: System MUST support multiple email addresses per supplier
- **FR-032**: System MUST validate email address format before saving

**Email Notifications**
- **FR-033**: System MUST send PRF approval notifications to all PROCUREMENT_SPECIALIST users
- **FR-034**: System MUST send PO notifications to all email addresses configured for the supplier
- **FR-035**: System MUST log email failures without blocking the primary transaction
- **FR-036**: System MUST allow manual email resend from detail pages

### Key Entities

- **PRF (Purchase Requisition Form)**: A formal request for purchasing goods or services, containing header information (type, category, requester, dates, rejection_reason if rejected) and line items detailing what is being requested
- **PRFLine**: Individual line item on a PRF with item reference (optional), description, quantity, unit, estimated price, and calculated value
- **PO (Purchase Order)**: A formal order document sent to suppliers, created from exactly one approved PRF (1:1 relationship), containing pricing, VAT calculations, terms, and delivery instructions
- **POLine**: Individual line item on a PO with item details, quantity, unit price, discount, VAT, and calculated totals
- **Supplier**: Extended to include multiple email addresses for PO notification delivery
- **User**: Extended to support the new PROCUREMENT_SPECIALIST role

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can create and submit a PRF in under 5 minutes for up to 10 line items
- **SC-002**: Supervisors can review and approve/reject a PRF in under 2 minutes
- **SC-003**: Procurement specialists receive email notification within 1 minute of PRF approval
- **SC-004**: Users can create a PO from an approved PRF in under 5 minutes for up to 10 line items
- **SC-005**: Suppliers receive PO email notification within 1 minute of PO creation
- **SC-006**: 100% of deliveries are linked to a PO (mandatory enforcement)
- **SC-007**: PROCUREMENT_SPECIALIST users cannot access restricted pages (0% unauthorized access)
- **SC-008**: VAT and total calculations are 100% accurate on all PO line items and totals
- **SC-009**: PRF and PO numbers are unique with no duplicates in the system
- **SC-010**: Email failures do not block transaction completion (0% transaction failures due to email issues)

## Assumptions

- The existing period management system will be used to associate PRFs with accounting periods
- VAT rate is fixed at 15% for Saudi Arabia (configurable in the future if needed)
- Email service will be configured using environment variables (SMTP settings)
- Users with PROCUREMENT_SPECIALIST role will be created through the existing user management system
- The existing authentication and session management will be used for all new pages
- The existing navigation sidebar structure will accommodate the new "Orders" menu item
