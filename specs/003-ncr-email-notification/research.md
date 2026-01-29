# Research: NCR Email Notification System

**Feature**: 003-ncr-email-notification
**Date**: 2026-01-28

## Research Summary

This document captures technical decisions and best practices research for implementing the NCR email notification system.

---

## 1. Notification Settings Storage

### Decision: Database Table with Key-Value Pattern

Store notification email addresses in a dedicated `NotificationSetting` table using a key-value pattern.

### Rationale

- **Runtime Configuration**: Settings can be changed by admins without redeployment
- **Audit Trail**: Track who updated settings and when
- **Extensibility**: Easy to add new notification types in future
- **Consistency**: Follows database-first approach used throughout project

### Alternatives Considered

| Alternative            | Rejected Because                                          |
| ---------------------- | --------------------------------------------------------- |
| Environment variables  | Requires redeployment; not admin-configurable             |
| JSON config file       | Requires server access; no audit trail                    |
| User preferences table | Different purpose; settings are system-wide, not per-user |

### Implementation Pattern

```typescript
// Key-value pattern for notification settings
NotificationSetting {
  key: "NCR_FINANCE_TEAM_EMAILS" | "NCR_PROCUREMENT_TEAM_EMAILS"
  emails: string[]  // PostgreSQL array
  updated_at: DateTime
  updated_by: string (User reference)
}
```

---

## 2. Async Email Notification Pattern

### Decision: Fire-and-Forget with Logging

Send emails asynchronously without blocking NCR creation, logging all attempts for audit/troubleshooting.

### Rationale

- **Non-Blocking**: NCR creation completes immediately (FR-012)
- **Graceful Degradation**: SMTP failures don't break core functionality
- **Auditability**: Notification log enables troubleshooting
- **Existing Pattern**: Mirrors PRF/PO email implementation

### Implementation Approach

```typescript
// After NCR creation, trigger notification asynchronously
await prisma.nCR.create({ ... });

// Fire-and-forget - don't await
void sendNCRNotifications(ncr, recipientGroups).catch((err) => {
  console.error("[NCR Notification] Failed:", err);
});

return { success: true, ncr };
```

### Alternatives Considered

| Alternative              | Rejected Because                             |
| ------------------------ | -------------------------------------------- |
| Synchronous sending      | Blocks NCR creation; poor UX                 |
| Queue-based (Redis/Bull) | Over-engineering for ~10 NCRs/day            |
| Scheduled batch          | Defeats "immediate notification" requirement |

---

## 3. Email Template Pattern

### Decision: Follow Existing Email Template Style

Use the established HTML email template pattern from `server/utils/email.ts`.

### Rationale

- **Consistency**: Matches existing PRF/PO notification emails
- **Brand Cohesion**: Uses same styling, colors, layout
- **Proven Approach**: Existing templates render correctly across email clients

### Template Structure (from existing codebase)

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #3b82f6;">NCR Created</h2>
  <p>Details...</p>
  <table style="width: 100%; border-collapse: collapse;">
    <!-- Key-value rows -->
  </table>
  <a
    href="..."
    style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white;"
  >
    View NCR
  </a>
  <p style="color: #6b7280; font-size: 14px;">Stock Management System</p>
</div>
```

---

## 4. NCR Notification Trigger Points

### Decision: Hook into Existing NCR Creation Flows

Add notification triggers to both manual and auto-generated NCR creation points.

### Trigger Points Identified

| Trigger                  | Location                                                 | NCR Type       |
| ------------------------ | -------------------------------------------------------- | -------------- |
| Manual NCR creation      | `server/api/ncrs/index.post.ts`                          | MANUAL         |
| Price variance detection | `server/utils/priceVariance.ts` → `detectAndCreateNCR()` | PRICE_VARIANCE |

### Implementation Approach

1. Create reusable `sendNCRCreatedNotification()` function in `server/utils/email.ts`
2. Call from both trigger points after NCR is persisted
3. Function handles fetching recipient emails and sending to all groups

---

## 5. Recipient Resolution Strategy

### Decision: Fetch Recipients at Send Time

Resolve recipient email addresses when notification is triggered, not cached.

### Rationale

- **Immediate Effect**: SC-005 requires changes to take effect immediately
- **Simplicity**: No cache invalidation logic needed
- **Data Freshness**: Always uses current settings

### Resolution Logic

```typescript
async function resolveNCRNotificationRecipients(ncrId: string): Promise<{
  financeEmails: string[];
  procurementEmails: string[];
  supplierEmails: string[];
}> {
  // 1. Fetch from NotificationSetting table
  const settings = await prisma.notificationSetting.findMany({
    where: { key: { in: ["NCR_FINANCE_TEAM_EMAILS", "NCR_PROCUREMENT_TEAM_EMAILS"] } },
  });

  // 2. Get supplier emails if NCR linked to delivery
  const ncr = await prisma.nCR.findUnique({
    where: { id: ncrId },
    include: { delivery: { include: { supplier: true } } },
  });

  return {
    financeEmails: settings.find((s) => s.key === "NCR_FINANCE_TEAM_EMAILS")?.emails || [],
    procurementEmails: settings.find((s) => s.key === "NCR_PROCUREMENT_TEAM_EMAILS")?.emails || [],
    supplierEmails: ncr?.delivery?.supplier?.emails || [],
  };
}
```

---

## 6. Admin UI Component Strategy

### Decision: Reusable Email List Component

Create a reusable `SettingsNotificationEmailList` component for managing email arrays.

### Rationale

- **DRY**: Same component for both Finance and Procurement sections
- **Consistent UX**: Identical interaction pattern for both
- **Validation**: Centralized email format validation

### Component Features

- Add email with validation (RFC 5322 pattern)
- Remove email with confirmation
- Display as chip/tag list
- Inline error messages
- Accessibility (keyboard navigation, ARIA labels)

### UI Reference (Nuxt UI patterns)

```vue
<template>
  <UFormGroup :label="label" :error="error">
    <div class="flex flex-wrap gap-2 mb-2">
      <UBadge v-for="email in emails" :key="email" color="primary">
        {{ email }}
        <UButton icon="i-heroicons-x-mark" size="2xs" @click="remove(email)" />
      </UBadge>
    </div>
    <div class="flex gap-2">
      <UInput v-model="newEmail" placeholder="email@example.com" class="w-full" />
      <UButton icon="i-heroicons-plus" @click="add" :disabled="!isValidEmail" />
    </div>
  </UFormGroup>
</template>
```

---

## 7. Notification Log Schema

### Decision: Separate Log Table for Audit Trail

Create `NCRNotificationLog` table to record all notification attempts.

### Rationale

- **FR-013**: Must log notification attempts
- **Troubleshooting**: Track failures and diagnose issues
- **P3 Feature**: Enables notification history display (User Story 5)

### Schema Design

```prisma
model NCRNotificationLog {
  id            String                    @id @default(uuid())
  ncr_id        String                    // Reference to NCR
  recipient_type NotificationRecipientType // FINANCE, PROCUREMENT, SUPPLIER
  recipients    String[]                  // Email addresses sent to
  status        NotificationStatus        // SENT, FAILED
  error_message String?                   // Error details if failed
  sent_at       DateTime                  @default(now())

  ncr           NCR                       @relation(...)
}

enum NotificationRecipientType {
  FINANCE
  PROCUREMENT
  SUPPLIER
}

enum NotificationStatus {
  SENT
  FAILED
}
```

---

## 8. API Security Pattern

### Decision: Admin-Only Middleware with Role Check

Protect notification settings API with server-side role verification.

### Implementation

```typescript
// server/api/settings/notifications/index.put.ts
export default defineEventHandler(async (event) => {
  const user = event.context.user;

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  if (user.role !== "ADMIN") {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      data: {
        code: "ADMIN_REQUIRED",
        message: "Only administrators can modify notification settings",
      },
    });
  }

  // ... proceed with update
});
```

---

## 9. Email Content Differentiation

### Decision: Supplier Emails Get Different Content

Internal teams and suppliers receive slightly different email content.

### Rationale

- Internal teams get system link to view NCR
- Suppliers get contact information and next steps (no system access)
- Both get full NCR details

### Content Differences

| Aspect          | Internal Teams            | Supplier                       |
| --------------- | ------------------------- | ------------------------------ |
| NCR link        | Yes (View NCR button)     | No                             |
| Contact info    | No                        | Yes (reply instructions)       |
| System branding | "Stock Management System" | Company name                   |
| Call to action  | "View NCR"                | "Please respond to this email" |

---

## 10. Zod Validation Schemas

### Decision: Standard RFC 5322 Email Validation

Use Zod's built-in email validation with array handling.

### Schema Definitions

```typescript
// Notification settings update schema
const notificationSettingsSchema = z.object({
  finance_team_emails: z.array(z.string().email()).default([]),
  procurement_team_emails: z.array(z.string().email()).default([]),
});

// Validates on server before saving
const validated = notificationSettingsSchema.parse(body);
```

---

## Summary of Decisions

| Topic                | Decision                                         |
| -------------------- | ------------------------------------------------ |
| Storage              | Database table with key-value pattern            |
| Email sending        | Async fire-and-forget with logging               |
| Templates            | Follow existing HTML email style                 |
| Trigger points       | Hook into manual and auto-generated NCR creation |
| Recipient resolution | Fetch at send time (no caching)                  |
| Admin UI             | Reusable email list component                    |
| Notification log     | Separate table for audit trail                   |
| API security         | Admin-only with server-side role check           |
| Content              | Different templates for internal vs supplier     |
| Validation           | Zod with RFC 5322 email format                   |

All NEEDS CLARIFICATION items resolved - ready for Phase 1 design.
