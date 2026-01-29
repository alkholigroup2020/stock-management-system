# Feature Specification: NCR Email Notification System

**Feature Branch**: `003-ncr-email-notification`
**Created**: 2026-01-28
**Status**: Draft
**Input**: User description: "Implement a new email notification trigger anytime when an NCR is manually or automatically created, and send this notification to three parties: finance team members, procurement team members, and the supplier defined email address(es). Currently only supplier email addresses are saved within the app's database. Other two parties need a way to define them and save them for later notifications sending."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Configure Notification Recipients (Priority: P1)

As an Administrator, I need to configure which email addresses receive NCR notifications for finance and procurement teams, so that the right people are automatically notified when NCRs are created.

**Why this priority**: Without configured recipients, no notifications can be sent. This is the foundational capability that enables all other notification features.

**Independent Test**: Can be fully tested by configuring email addresses in the admin settings panel and verifying they persist correctly - delivers value by establishing the notification recipient list.

**Acceptance Scenarios**:

1. **Given** I am an Admin user and the notification settings exist, **When** I navigate to the notification settings page, **Then** I see separate sections for Finance Team emails and Procurement Team emails.
2. **Given** I am viewing notification settings, **When** I add one or more email addresses to the Finance Team section and save, **Then** the email addresses are persisted and displayed on reload.
3. **Given** I am viewing notification settings, **When** I add an invalid email format, **Then** I see a validation error and the invalid email is not saved.
4. **Given** I am viewing notification settings, **When** I remove an email address and save, **Then** that email no longer appears in the list.
5. **Given** I am an Operator or Supervisor user, **When** I attempt to access notification settings, **Then** I am denied access or do not see the menu option.

---

### User Story 2 - Automatic NCR Creation Notification (Priority: P1)

As a stakeholder (finance team member, procurement team member, or supplier), I need to receive an email notification whenever an NCR is automatically created due to price variance, so that I am immediately aware of pricing discrepancies requiring attention.

**Why this priority**: Price variance NCRs are automatically generated during delivery posting - the primary use case for immediate notification to prevent delayed response to pricing issues.

**Independent Test**: Can be fully tested by posting a delivery with a price different from the period-locked price and verifying emails are sent to all configured recipients - delivers value by enabling immediate visibility into price discrepancies.

**Acceptance Scenarios**:

1. **Given** notification recipients are configured and a delivery is posted with a unit price different from the period price, **When** the system auto-generates a PRICE_VARIANCE NCR, **Then** an email notification is sent to all configured Finance Team emails.
2. **Given** notification recipients are configured and a PRICE_VARIANCE NCR is auto-generated, **When** the NCR is created, **Then** an email notification is sent to all configured Procurement Team emails.
3. **Given** the delivery has an associated supplier with email addresses, **When** a PRICE_VARIANCE NCR is auto-generated, **Then** an email notification is sent to all of the supplier's email addresses.
4. **Given** the supplier has no email addresses configured, **When** a PRICE_VARIANCE NCR is auto-generated, **Then** notifications are still sent to Finance and Procurement teams, and the system logs that supplier notification was skipped.
5. **Given** no Finance Team emails are configured, **When** a PRICE_VARIANCE NCR is auto-generated, **Then** the system logs that Finance Team notification was skipped but continues sending to other recipients.

---

### User Story 3 - Manual NCR Creation Notification (Priority: P2)

As a stakeholder, I need to receive an email notification whenever an NCR is manually created by a user, so that I am aware of quality issues, quantity discrepancies, or other non-conformances reported by operations staff.

**Why this priority**: Manual NCRs cover broader scenarios beyond price variance (damage, quality issues, quantity discrepancies). While important, they occur less frequently than auto-generated NCRs.

**Independent Test**: Can be fully tested by manually creating an NCR and verifying emails are sent to all configured recipients - delivers value by enabling stakeholder awareness of operational issues.

**Acceptance Scenarios**:

1. **Given** notification recipients are configured and I am an authorized user creating a manual NCR, **When** I submit the NCR, **Then** email notifications are sent to Finance Team, Procurement Team, and Supplier (if linked).
2. **Given** the manual NCR is not linked to a specific delivery or supplier, **When** I submit the NCR, **Then** notifications are sent only to Finance and Procurement teams.
3. **Given** the manual NCR is linked to a delivery with an associated supplier, **When** I submit the NCR, **Then** the supplier receives an email notification with NCR details.

---

### User Story 4 - NCR Email Content (Priority: P2)

As a notification recipient, I need the NCR email to contain relevant details about the issue, so that I can understand the nature and urgency of the non-conformance without logging into the system.

**Why this priority**: Valuable email content reduces time-to-action. However, notifications can technically function with minimal content, making this a secondary priority.

**Independent Test**: Can be fully tested by triggering an NCR notification and reviewing the email content for completeness and clarity - delivers value by enabling informed decision-making from email alone.

**Acceptance Scenarios**:

1. **Given** an NCR notification email is sent, **When** I receive it, **Then** it includes: NCR number, NCR type (Manual/Price Variance), creation date, location name, item details (if applicable), reason/description, and monetary value.
2. **Given** the NCR is linked to a delivery, **When** I receive the notification, **Then** the email includes the delivery number, supplier name, and a link to view the NCR in the system.
3. **Given** the NCR is a Price Variance type, **When** I receive the notification, **Then** the email clearly shows expected price, actual price, variance amount, and variance percentage.
4. **Given** I am a supplier receiving the notification, **When** I receive the email, **Then** the email is professionally formatted with company branding and includes clear instructions for next steps.

---

### User Story 5 - View and Manage Notification History (Priority: P3)

As an Administrator, I want to see a history of NCR notifications sent, so that I can verify notifications are working and troubleshoot any delivery issues.

**Why this priority**: Notification history is useful for troubleshooting and auditing but is not required for core functionality. The system can operate without it initially.

**Independent Test**: Can be fully tested by viewing the notification log after NCR creation and verifying entries show send status - delivers value by enabling operational visibility and troubleshooting.

**Acceptance Scenarios**:

1. **Given** I am an Admin user, **When** I view an NCR's detail page, **Then** I see a section showing notification history (who was notified, when, and delivery status).
2. **Given** a notification failed to send, **When** I view the notification history, **Then** I see the failure reason and can manually trigger a resend for that specific recipient group only.
3. **Given** I trigger a resend for a failed notification, **When** the resend completes, **Then** a new log entry is created showing the resend attempt result (success or failure).
4. **Given** I have already resent a notification within the last 5 minutes, **When** I attempt another resend for the same recipient group, **Then** the system prevents the resend and displays a rate-limit message.
5. **Given** multiple notifications were sent for an NCR, **When** I view the history, **Then** all recipients and their delivery statuses are listed.

---

### Edge Cases

- What happens when SMTP is not configured or unavailable? → Notifications are logged but not sent; system continues to function; users see warning in UI.
- What happens when an email address becomes invalid after configuration? → Email service returns bounce; logged in notification history; does not affect other recipients.
- What happens when the same person is in both Finance and Procurement teams? → They receive two separate emails (one for each role); future enhancement could deduplicate.
- How does the system handle very large NCR values (e.g., >100,000 SAR)? → No special handling; same notification process applies.
- What happens if notification sending takes too long? → NCR creation completes immediately; notifications sent asynchronously; failure does not block NCR creation.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST provide an administrative interface to configure Finance Team notification email addresses (one or more emails).
- **FR-002**: System MUST provide an administrative interface to configure Procurement Team notification email addresses (one or more emails).
- **FR-003**: System MUST persist configured notification email addresses in the database.
- **FR-004**: System MUST validate email address format before saving (standard RFC 5322 email format).
- **FR-005**: System MUST send email notifications to all configured Finance Team addresses when an NCR is created.
- **FR-006**: System MUST send email notifications to all configured Procurement Team addresses when an NCR is created.
- **FR-007**: System MUST send email notifications to all Supplier email addresses (from Supplier.emails) when an NCR is created and linked to a supplier.
- **FR-008**: System MUST trigger notifications for both auto-generated (PRICE_VARIANCE) and manually created (MANUAL) NCRs.
- **FR-009**: System MUST include NCR number, type, creation date, location, reason, and value in all notification emails.
- **FR-010**: System MUST include item name, expected price, actual price, variance amount, and variance percentage for PRICE_VARIANCE NCRs.
- **FR-011**: System MUST include a direct link to view the NCR in the system (for internal recipients).
- **FR-012**: System MUST send notifications asynchronously so NCR creation is not blocked by email delivery.
- **FR-013**: System MUST log notification attempts including recipient, timestamp, and success/failure status.
- **FR-014**: System MUST gracefully handle missing or empty recipient lists by skipping that recipient group and logging the event.
- **FR-015**: System MUST restrict notification settings configuration to Admin users only.

### Key Entities

- **NotificationSetting**: Stores configured email addresses for notification groups (Finance Team, Procurement Team). Contains: setting key, email addresses array, last updated timestamp, updated by user reference.
- **NCRNotificationLog**: Records each notification attempt for an NCR. Contains: NCR reference, recipient type (finance/procurement/supplier), recipient emails, sent timestamp, delivery status, error message (if failed).
- **NCR (existing)**: Non-Conformance Report already exists with all required fields for notification content.
- **Supplier (existing)**: Already contains emails array field for supplier notification addresses.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of NCR creations (both manual and auto-generated) trigger notification attempts to all configured recipient groups within 30 seconds.
- **SC-002**: Administrators can configure notification recipients in under 2 minutes.
- **SC-003**: 95% of notification emails are successfully delivered (not bounced) to valid email addresses.
- **SC-004**: NCR creation workflow completes in under 3 seconds regardless of notification delivery time.
- **SC-005**: Notification recipient changes take effect immediately (no cache delay or system restart required).
- **SC-006**: Stakeholders can identify the nature and urgency of an NCR from the email content alone without logging into the system.
- **SC-007**: System continues to function normally when SMTP is unavailable (graceful degradation).

## Assumptions

- The existing SMTP email infrastructure (Office 365 via `/server/utils/email.ts`) will be used for sending NCR notifications.
- Notification settings will be stored in a new database table rather than environment variables, allowing runtime configuration.
- Finance Team and Procurement Team are distinct conceptual groups for notification purposes, separate from the existing user roles (which define system permissions).
- Suppliers receiving NCR notifications do not need login access to the system; the email provides standalone information.
- Notification sending will follow the existing pattern of async/non-blocking email delivery used in PRF/PO workflows.
- Email templates will follow the existing design system and branding used in other system emails.
