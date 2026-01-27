# Feature Specification: PRF/PO Workflow

**Feature Branch**: `001-prf-po-workflow`
**Created**: 2026-01-19
**Last Updated**: 2026-01-27
**Status**: Draft
**Input**: User description: "Implement complete Purchase Requisition Form (PRF) / Purchase Order (PO) workflow with approval chain, email notifications, a new PROCUREMENT_SPECIALIST role, and mandatory delivery-PO linking"

## Changelog

### 2026-01-27: Enhanced Document Numbering

**Enhancement**: Updated PRF, PO, and Delivery numbering scheme to include location name and date for better traceability.

**New Format**: `{Prefix}-{LocationName}-{DD}-{Mon}-{YYYY}-{NN}`
- Example: `PRF-KITCHEN-27-Jan-2026-01`, `PO-STORE-27-Jan-2026-02`, `DLV-ALULA-27-Jan-2026-03`
- Location names converted to uppercase
- Sequential numbers (01-99) restart daily per location
- Date format: DD = two-digit day, Mon = three-letter month, YYYY = four-digit year

**Rationale**:
- Better traceability: Location and date visible at a glance
- Easier sorting: Documents naturally group by location and date
- Reduced conflicts: Daily restart per location reduces collision probability
- No migration needed: Existing documents keep old format

**Impact**: FR-002 (PRF numbering) and FR-016 (PO numbering) updated to reflect new format.

## Clarifications

### Session 2026-01-19

- Q: What is the PRF-to-PO cardinality? → A: One PRF → One PO (1:1 relationship; each PRF can only have one PO created from it)
- Q: How should rejected PRF revision be handled? → A: User can "Clone" a rejected PRF to create a new DRAFT PRF with copied content
- Q: Can PO line items be modified from the source PRF? → A: PO line items are fully editable (can add, remove, modify any field)
- Q: Is a rejection reason required when rejecting a PRF? → A: Mandatory free-text reason (Supervisor must enter explanation before rejecting)
- Q: Can OPEN POs be edited after creation? → A: OPEN POs can be edited by PROCUREMENT_SPECIALIST only (ADMIN and SUPERVISOR cannot edit POs after creation, but can close them)

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Create and Submit Purchase Requisition (Priority: P1)

An Operator needs to request materials or supplies for their location. They create a Purchase Requisition Form specifying what items are needed, quantities, estimated costs, and delivery requirements. Once complete, they submit it for supervisor approval.

**Why this priority**: This is the entry point for the entire procurement workflow. Without the ability to create and submit PRFs, no subsequent workflow steps can occur.

**Independent Test**: Can be fully tested by creating a PRF with multiple line items, saving as draft, then submitting for approval. Delivers value by formalizing purchase requests in the system.

**Acceptance Scenarios**:

1. **Given** an authenticated Operator on the Orders page, **When** they click "New PRF" and fill in required fields (location, category, at least one line item with description, quantity, unit, and estimated price), **Then** the system saves the PRF in DRAFT status with an auto-generated PRF number.

2. **Given** a PRF in DRAFT status, **When** the requester clicks "Submit for Approval", **Then** the PRF status changes to PENDING and becomes read-only for the requester.

3. **Given** a PRF in DRAFT status, **When** the requester adds multiple line items, **Then** the system calculates the total value as the sum of all line values (required_qty × estimated_price).

4. **Given** a PRF form with line items, **When** the user enters quantities and estimated prices, **Then** the system displays VAT calculations for each line showing "Before VAT", "VAT (15%)", and "Total" columns, and displays a footer summary showing total before VAT, total VAT amount, and grand total.

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

A Procurement Specialist receives notification of an approved PRF, logs in, selects a supplier, and creates a formal Purchase Order with pricing, VAT calculations, and terms.

**Why this priority**: Converting approved PRFs to POs is the core procurement function. This enables actual purchasing to occur.

**Independent Test**: Can be tested by creating a PO from an approved PRF, selecting a supplier, adjusting quantities and prices, and saving. Delivers value by generating formal purchase documents.

**Acceptance Scenarios**:

1. **Given** an approved PRF, **When** a Procurement Specialist clicks "Create PO", **Then** the system creates a new PO pre-populated with PRF line items, requiring supplier selection before save.

2. **Given** a PO being created, **When** the user enters unit prices and quantities, **Then** the system calculates line totals, VAT amounts (15% default), and grand totals automatically.

3. **Given** a completed PO, **When** the user saves the PO, **Then** the system generates a PO number and saves the PO in OPEN status.

---

### User Story 4 - Link Delivery to Purchase Order (Priority: P2)

When goods arrive, an Operator creates a delivery record. The system requires selecting an existing PO to link the delivery, ensuring all deliveries are tracked against orders. The system tracks how much of each PO line has been delivered and pre-fills remaining quantities.

**Why this priority**: Mandatory PO-delivery linking ensures complete traceability but depends on POs existing first.

**Independent Test**: Can be tested by creating a delivery, selecting a PO, and verifying the system auto-populates supplier and expected items with remaining quantities. Delivers value by maintaining procurement traceability.

**Acceptance Scenarios**:

1. **Given** an Operator creating a new delivery, **When** they reach the PO selection field, **Then** the system requires a PO to be selected (field is mandatory, not optional).

2. **Given** a PO selected during delivery creation, **When** the user confirms selection, **Then** the system auto-populates the supplier and pre-fills delivery lines with the **remaining quantities** (not full PO quantities).

3. **Given** a delivery being created, **When** no open POs exist, **Then** the system displays a message indicating no open POs are available and the user cannot proceed until a PO exists.

4. **Given** a PO with partial deliveries already posted, **When** creating a new delivery for that PO, **Then** the system shows "Delivered" and "Remaining" columns to indicate fulfillment status.

5. **Given** a PO line that has been fully delivered (delivered_qty >= quantity), **When** viewing the PO detail page, **Then** that line shows a green checkmark indicating it's complete.

---

### User Story 5 - Close Purchase Order (Priority: P2)

An Admin or Supervisor can manually close a PO when needed, or the system automatically closes a PO when all items have been fully delivered. Closed POs can no longer have deliveries linked to them. When manually closing a PO with unfulfilled quantities, a closure reason is required.

**Why this priority**: Closing POs completes the procurement cycle and prevents further deliveries against completed orders.

**Independent Test**: Can be tested by selecting an open PO with linked deliveries and closing it, or by posting a delivery that completes all PO lines. Delivers value by providing order lifecycle management.

**Acceptance Scenarios**:

1. **Given** an OPEN PO with at least one linked delivery, **When** an Admin or Supervisor clicks "Close PO", **Then** the PO status changes to CLOSED and it no longer appears in the delivery PO selection dropdown.

2. **Given** a CLOSED PO, **When** an Operator tries to create a delivery linked to it, **Then** the system does not show the closed PO as an option.

3. **Given** a user with PROCUREMENT_SPECIALIST role, **When** they view an OPEN PO, **Then** they do NOT see a "Close PO" button (only Admins and Supervisors can close POs).

4. **Given** an OPEN PO where all line items have `delivered_qty >= quantity`, **When** a delivery is posted that completes the final line, **Then** the PO is automatically closed and the linked PRF is also closed.

5. **Given** a delivery that fully satisfies all PO lines, **When** the delivery is posted, **Then** the success message indicates "PO has been automatically closed (all items fully delivered)".

6. **Given** an OPEN PO with unfulfilled quantities (any line where `delivered_qty < quantity`), **When** an Admin or Supervisor clicks "Close PO", **Then** the system displays a warning modal showing unfulfilled items with ordered/delivered/remaining quantities and requires a mandatory closure reason.

7. **Given** a PO closure modal with unfulfilled items, **When** the user attempts to close without providing a closure reason, **Then** the "Close PO" button is disabled and an error message is displayed requiring a reason.

8. **Given** a PO closed with unfulfilled items and a closure reason, **When** the PO is closed, **Then** the closure reason is stored in the PO notes with timestamp and username, and the closure notification email includes the fulfillment status and reason.

9. **Given** an OPEN PO that is 100% fulfilled (all items fully delivered), **When** an Admin or Supervisor clicks "Close PO", **Then** the closure modal does not require a reason (optional notes can be added).

---

### User Story 5b - Over-Delivery Approval Workflow (Priority: P2)

When a delivery quantity exceeds the remaining PO quantity (over-delivery), the system requires Supervisor or Admin approval before the delivery can be posted. This ensures proper oversight of purchase order variances.

**Why this priority**: Over-delivery control is a critical business rule that prevents unauthorized receipt of goods beyond ordered quantities.

**Independent Test**: Can be tested by creating a delivery with quantities exceeding PO remaining, saving as draft, and having a Supervisor approve or reject the over-delivery.

**Acceptance Scenarios**:

1. **Given** a delivery line with quantity exceeding the PO line's remaining quantity, **When** an Operator saves the delivery as draft, **Then** the system displays an "Over-Delivery Requires Approval" warning and notifies Supervisors via email.

2. **Given** a draft delivery with unapproved over-delivery items, **When** an Operator attempts to post the delivery, **Then** the system blocks the action and displays "Supervisor or Admin approval is required."

3. **Given** a draft delivery with over-delivery items, **When** a Supervisor views the delivery detail page, **Then** they see "Approve" and "Reject" buttons for the over-delivery items.

4. **Given** a Supervisor approving over-delivery items, **When** they click "Approve", **Then** the system marks the items as approved and sends an email notification to the delivery creator.

5. **Given** a Supervisor rejecting over-delivery items, **When** they enter a rejection reason and click "Reject", **Then** the rejection reason is recorded in the delivery notes with error styling, the delivery is permanently locked (all actions disabled), and an email notification is sent to the creator.

6. **Given** an Operator viewing a draft delivery with pending over-delivery approval, **When** they access the delivery detail page, **Then** the Edit, Delete, and Post buttons are disabled until approval.

7. **Given** a Supervisor or Admin creating a delivery with over-delivery, **When** they save or post the delivery, **Then** the over-delivery is implicitly approved (no separate approval workflow needed).

8. **Given** a delivery that has been rejected due to over-delivery, **When** any user views the delivery detail page, **Then** all actions (Delete, Edit, Post) are permanently disabled, an "Over-Delivery Rejected" alert is displayed indicating the delivery is locked, and the user must create a new delivery with correct quantities.

9. **Given** a delivery list page, **When** viewing deliveries with over-delivery approval workflow states, **Then** the status badge displays the appropriate state: "Draft" (gray) for normal drafts, "Pending Approval" (amber) for drafts awaiting approval, "Approved" (amber) for approved drafts ready to post, "Rejected" (red) for rejected drafts, and "Posted" (green) for posted deliveries.

10. **Given** a delivery detail page for a delivery with pending over-delivery approval, **When** viewing the page, **Then** the status badge displays "Pending Approval" (amber) and shows which items are pending or approved.

11. **Given** a delivery where all over-delivery items have been approved but not yet posted, **When** viewing the delivery list or detail page, **Then** the status badge displays "Approved" (amber) indicating the delivery is ready to be posted but not yet finalized.

---

### User Story 6 - Procurement Specialist Access Control (Priority: P2)

A new PROCUREMENT_SPECIALIST role is added with specific permissions limited to procurement-related functions. These users can only access the Orders page to manage PRFs and POs. They cannot access dashboard, deliveries, master data, issues, transfers, or reconciliations.

**Why this priority**: Role-based access control is foundational for security but depends on the core features being in place.

**Independent Test**: Can be tested by logging in as a PROCUREMENT_SPECIALIST and verifying menu items and page access. Delivers value by enforcing separation of duties.

**Acceptance Scenarios**:

1. **Given** a user with PROCUREMENT_SPECIALIST role, **When** they log in, **Then** they are redirected to the Orders page and see only "Orders" in the navigation menu (under Transactions).

2. **Given** a user with PROCUREMENT_SPECIALIST role, **When** they try to access Dashboard, Deliveries, Master Data, Issues, Transfers, or Reconciliations pages, **Then** the system denies access.

3. **Given** a user with PROCUREMENT_SPECIALIST role, **When** they access the Orders page, **Then** they can view all approved PRFs and create/edit POs (but NOT close POs or create deliveries).

---

### User Story 7 - Manage Supplier Email Contacts (Priority: P3)

Administrators can add and manage multiple email addresses for each supplier. These emails are used when sending PO notifications.

**Why this priority**: Supplier email management supports the notification feature but is lower priority than core workflow.

**Independent Test**: Can be tested by editing a supplier and adding/removing email addresses. Delivers value by enabling multi-recipient PO notifications.

**Acceptance Scenarios**:

1. **Given** a supplier edit form, **When** an Admin adds multiple email addresses, **Then** the system saves all email addresses and validates each one's format.

2. **Given** a supplier with multiple email addresses, **When** the supplier record is saved, **Then** all email addresses are stored for future reference and communication needs.

---

### Edge Cases

- What happens when a PRF is submitted but no PROCUREMENT_SPECIALIST users exist? → The PRF is approved but no email notification is sent; system logs a warning.
- How does the system handle PO creation if the supplier has no email addresses? → The PO is created successfully; email addresses are optional and stored for future use only.
- What happens if a user tries to delete a PRF that has been converted to a PO? → The system prevents deletion; PRFs with linked POs are archived, not deleted.
- How does the system behave when delivery quantities exceed PO remaining quantities? → **Over-delivery requires Supervisor/Admin approval**:
  - Operators can save drafts with over-delivery but cannot post without approval
  - Supervisors/Admins can approve or reject over-delivery items
  - Once approved, the delivery can be posted
  - Supervisors/Admins can directly post over-delivery (implicit approval)
- What happens if email sending fails? → The PRF approval action completes but the system logs the email failure (applies to PRF approval notifications to procurement specialists only; POs do not send emails).
- What happens when all PO items are fully delivered? → The system automatically closes the PO and its linked PRF. The delivery API returns `po_auto_closed: true`.
- What happens when manually closing a PO with unfulfilled items? → The system requires a mandatory closure reason. A warning modal displays all unfulfilled items with ordered/delivered/remaining quantities. The reason is stored in notes with timestamp, and the closure notification email includes fulfillment status.
- What happens if a delivery is created against a fully-delivered PO line? → This is treated as over-delivery and requires approval, since remaining_qty is 0.
- What happens when Supervisor rejects over-delivery? → The rejection reason is prepended to the delivery notes with error styling, the delivery is **permanently locked** (all actions disabled including Edit, Delete, Post), creator is notified via email, and **the operator must create a new delivery** with correct quantities instead of editing the rejected one.

## Requirements _(mandatory)_

### Functional Requirements

**PRF Management**

- **FR-001**: System MUST allow Operators, Supervisors, and Admins to create Purchase Requisition Forms (PRFs)
- **FR-002**: System MUST auto-generate unique PRF numbers in the format PRF-{LocationName}-{DD}-{Mon}-{YYYY}-{NN} (e.g., PRF-KITCHEN-27-Jan-2026-01, PRF-STORE-27-Jan-2026-01)
- **FR-003**: System MUST support PRF types: URGENT, DPA (Direct Purchase Approval), and NORMAL
- **FR-004**: System MUST support PRF categories: FOOD, CLEANING, and OTHER
- **FR-005**: System MUST allow PRF line items to reference existing inventory items or use custom item descriptions
- **FR-006**: System MUST calculate PRF line values as required_qty × estimated_price
- **FR-006a**: System MUST display PRF line-level VAT calculations (Before VAT, VAT 15%, Total After VAT) in the UI
- **FR-006b**: System MUST display PRF footer summary showing total before VAT, total VAT amount (15%), and grand total
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

**PRF Display Statuses**

- **FR-014c**: System MUST display PRF status badges that reflect the approval workflow state
- **FR-014d**: System MUST show "Draft" (gray/neutral) for PRFs in DRAFT status
- **FR-014e**: System MUST show "Pending Approval" (amber/warning) for PRFs in PENDING status awaiting supervisor approval
- **FR-014f**: System MUST show "Approved" (green/success) for PRFs in APPROVED status
- **FR-014g**: System MUST show "Rejected" (red/error) for PRFs in REJECTED status
- **FR-014h**: System MUST show "Closed" (blue/info) for PRFs in CLOSED status

**PO Management**

- **FR-015**: System MUST allow only Procurement Specialists to create exactly one PO from each approved PRF (1:1 relationship)
- **FR-016**: System MUST auto-generate unique PO numbers in the format PO-{LocationName}-{DD}-{Mon}-{YYYY}-{NN} (e.g., PO-KITCHEN-27-Jan-2026-01, PO-STORE-27-Jan-2026-01), using the PRF's location name
- **FR-017**: System MUST require supplier selection when creating a PO
- **FR-018**: System MUST pre-populate PO line items from the source PRF when creating from an approved PRF; line items are fully editable (add, remove, modify any field)
- **FR-019**: System MUST calculate PO line totals including discount and VAT (15% default for Saudi Arabia)
- **FR-020**: System MUST calculate PO grand totals (before discount, discount, after discount, VAT, final total)
- **FR-021**: System MUST support PO statuses: OPEN and CLOSED
- **FR-021a**: System MUST allow OPEN POs to be fully edited (all fields, line items) by PROCUREMENT_SPECIALIST only; ADMIN and SUPERVISOR cannot edit POs after creation
- **FR-022**: ~~System MUST send email notifications to all supplier email addresses when a PO is created~~ (REMOVED - email notifications are not sent on PO creation; supplier email addresses are stored for future use)
- **FR-023**: System MUST allow only Admins and Supervisors to close POs (PROCUREMENT_SPECIALIST cannot close POs)
- **FR-023a**: System MUST require a mandatory closure reason when manually closing a PO with unfulfilled quantities (any line where delivered_qty < quantity)
- **FR-023b**: System MUST display a warning modal showing unfulfilled items with ordered/delivered/remaining quantities when closing a PO with unfulfilled items
- **FR-023c**: System MUST store the closure reason in PO notes with timestamp and username when closing with unfulfilled items
- **FR-023d**: System MUST NOT require a closure reason when closing a fully fulfilled PO (100% delivered)

**Delivery Integration**

- **FR-024**: System MUST require PO selection when creating deliveries (mandatory, not optional)
- **FR-025**: System MUST filter PO selection dropdown to show only OPEN POs
- **FR-026**: System MUST auto-populate supplier when a PO is selected for delivery
- **FR-027**: System MUST display a warning when delivery quantities exceed PO remaining quantities

**Delivery Tracking (PO Line Fulfillment)**

- **FR-037**: System MUST track cumulative delivered quantity (`delivered_qty`) on each PO line
- **FR-038**: System MUST compute and display remaining quantity (`remaining_qty = quantity - delivered_qty`) on PO lines
- **FR-039**: System MUST pre-fill delivery lines with remaining quantities (not full PO quantities) when selecting a PO
- **FR-040**: System MUST display "Delivered" and "Remaining" columns on PO detail page

**Over-Delivery Approval Workflow**

- **FR-041**: System MUST detect over-delivery when delivery quantity exceeds PO line's remaining quantity
- **FR-042**: Operators MUST NOT post deliveries with unapproved over-delivery items
- **FR-043**: Supervisors and Admins MUST be able to approve or reject over-delivery items
- **FR-044**: System MUST send email notification to Supervisors when Operator saves draft with over-delivery
- **FR-045**: System MUST send email notification to delivery creator when over-delivery is approved
- **FR-046**: System MUST send email notification to delivery creator when over-delivery is rejected (with reason)
- **FR-047**: Operators MUST NOT edit, delete, or post drafts with pending over-delivery approval
- **FR-047a**: Rejected deliveries MUST be permanently locked (all actions disabled) and require a new delivery to be created
- **FR-047b**: Rejection notes MUST be displayed with error styling to clearly indicate rejection status
- **FR-048**: Supervisors/Admins creating deliveries with over-delivery MUST have implicit approval (no separate workflow)

**Delivery Display Statuses**

- **FR-052**: System MUST display delivery status badges that reflect the over-delivery approval workflow state
- **FR-053**: System MUST show "Draft" (gray/neutral) for normal draft deliveries without over-delivery
- **FR-054**: System MUST show "Pending Approval" (amber/warning) for draft deliveries awaiting over-delivery approval
- **FR-055**: System MUST show "Approved" (amber/warning) for draft deliveries where all over-delivery items have been approved but not yet posted
- **FR-056**: System MUST show "Rejected" (red/error) for deliveries where over-delivery was rejected
- **FR-057**: System MUST show "Posted" (green/success) for posted deliveries
- **FR-058**: System MUST compute effective delivery status from database fields: `status`, `pending_approval`, `over_delivery_rejected`, and line-level `over_delivery_approved`

**Automatic PO Closure**

- **FR-049**: System MUST automatically close PO when all lines have `delivered_qty >= quantity`
- **FR-050**: System MUST automatically close linked PRF when PO is auto-closed
- **FR-051**: System MUST return `po_auto_closed: true` flag in delivery API response when auto-close occurs

**Role & Permissions**

- **FR-028**: System MUST support a new PROCUREMENT_SPECIALIST role
- **FR-029**: PROCUREMENT_SPECIALIST role MUST have access to: Orders only (can view PRFs, create/edit POs, but NOT close POs or create deliveries)
- **FR-030**: PROCUREMENT_SPECIALIST role MUST NOT have access to: Dashboard, Deliveries, Master Data, Issues, Transfers, Reconciliations, Period Close

**Supplier Management**

- **FR-031**: System MUST support multiple email addresses per supplier
- **FR-032**: System MUST validate email address format before saving

**Email Notifications**

- **FR-033**: System MUST send PRF approval notifications to all PROCUREMENT_SPECIALIST users
- **FR-033a**: System MUST send PRF submission notifications to all SUPERVISOR and ADMIN users when an Operator submits a PRF for approval
- **FR-033b**: System MUST send PRF rejection notifications to the original requester when a Supervisor/Admin rejects a PRF (includes rejection reason)
- **FR-034**: ~~System MUST send PO notifications to all email addresses configured for the supplier~~ (REMOVED - PO email notifications are not sent)
- **FR-034a**: System MUST send PO closed notifications to the original PRF requester when a Supervisor/Admin closes a PO (includes PO details, supplier information, fulfillment status per line item, and closure reason if provided)
- **FR-035**: System MUST log email failures without blocking the primary transaction (applies to all email notifications)
- **FR-036**: ~~System MUST allow manual email resend from detail pages~~ (REMOVED - no email resend functionality for POs)

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
- **SC-005**: ~~Suppliers receive PO email notification within 1 minute of PO creation~~ (REMOVED - PO email notifications are not sent)
- **SC-006**: 100% of deliveries are linked to a PO (mandatory enforcement)
- **SC-007**: PROCUREMENT_SPECIALIST users cannot access restricted pages (0% unauthorized access)
- **SC-008**: VAT and total calculations are 100% accurate on all PO line items and totals
- **SC-009**: PRF and PO numbers are unique with no duplicates in the system
- **SC-010**: Email failures do not block transaction completion (0% transaction failures due to email issues)
- **SC-011**: PO line delivery tracking is 100% accurate (delivered_qty matches sum of posted delivery quantities)
- **SC-012**: Over-delivery detection is 100% accurate (flags when quantity > remaining_qty)
- **SC-013**: Operators cannot post deliveries with unapproved over-delivery (100% enforcement)
- **SC-014**: POs auto-close within the same transaction when all lines are fully delivered
- **SC-015**: Over-delivery approval/rejection emails are sent within 1 minute of action

## Assumptions

- The existing period management system will be used to associate PRFs with accounting periods
- VAT rate is fixed at 15% for Saudi Arabia (configurable in the future if needed)
- PRF VAT calculations are computed client-side for display purposes only; VAT fields are not stored in the database since PRFs are internal requisitions (only PO VAT is stored for formal orders)
- Email service will be configured using environment variables (SMTP settings)
- Users with PROCUREMENT_SPECIALIST role will be created through the existing user management system
- The existing authentication and session management will be used for all new pages
- The existing navigation sidebar structure will accommodate the new "Orders" menu item
- Document numbering format includes location name and date: PRF-{LocationName}-{DD}-{Mon}-{YYYY}-{NN} and PO-{LocationName}-{DD}-{Mon}-{YYYY}-{NN}, where location names are converted to uppercase and sequential numbers restart daily per location
- Delivery numbers follow the same enhanced format: DLV-{LocationName}-{DD}-{Mon}-{YYYY}-{NN} (note: DLV not DEL prefix)
