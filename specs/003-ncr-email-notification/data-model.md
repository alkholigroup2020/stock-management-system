# Data Model: NCR Email Notification System

**Feature**: 003-ncr-email-notification
**Date**: 2026-01-28

## Entity Relationship Overview

```
┌─────────────────────┐
│ NotificationSetting │
├─────────────────────┤
│ id (PK)             │
│ key (unique)        │
│ emails[]            │
│ updated_at          │
│ updated_by (FK)     │─────────┐
└─────────────────────┘         │
                                │
┌─────────────────────┐         │
│        User         │◄────────┘
├─────────────────────┤
│ id (PK)             │
│ ...existing...      │
└─────────────────────┘
         ▲
         │
         │ created_by (FK)
         │
┌─────────────────────┐
│        NCR          │
├─────────────────────┤
│ id (PK)             │◄──────┐
│ ...existing...      │       │
└─────────────────────┘       │
                              │
┌─────────────────────┐       │
│  NCRNotificationLog │       │
├─────────────────────┤       │
│ id (PK)             │       │
│ ncr_id (FK)         │───────┘
│ recipient_type      │
│ recipients[]        │
│ status              │
│ error_message       │
│ sent_at             │
└─────────────────────┘
```

---

## New Entities

### NotificationSetting

Stores configured email addresses for notification recipient groups.

| Field        | Type       | Constraints        | Description                                          |
| ------------ | ---------- | ------------------ | ---------------------------------------------------- |
| `id`         | UUID       | PK, auto-generated | Unique identifier                                    |
| `key`        | String(50) | UNIQUE, NOT NULL   | Setting identifier (e.g., "NCR_FINANCE_TEAM_EMAILS") |
| `emails`     | String[]   | DEFAULT []         | Array of email addresses                             |
| `updated_at` | DateTime   | auto-update        | Last modification timestamp                          |
| `updated_by` | UUID       | FK → User.id       | User who last updated this setting                   |

**Valid Keys**:

- `NCR_FINANCE_TEAM_EMAILS` - Finance team notification recipients
- `NCR_PROCUREMENT_TEAM_EMAILS` - Procurement team notification recipients

**Indexes**:

- `key` (unique)

---

### NCRNotificationLog

Records each notification attempt for audit and troubleshooting.

| Field            | Type     | Constraints           | Description                              |
| ---------------- | -------- | --------------------- | ---------------------------------------- |
| `id`             | UUID     | PK, auto-generated    | Unique identifier                        |
| `ncr_id`         | UUID     | FK → NCR.id, NOT NULL | Reference to the NCR                     |
| `recipient_type` | Enum     | NOT NULL              | FINANCE, PROCUREMENT, or SUPPLIER        |
| `recipients`     | String[] | NOT NULL              | Email addresses notification was sent to |
| `status`         | Enum     | NOT NULL              | SENT or FAILED                           |
| `error_message`  | String   | nullable              | Error details if status is FAILED        |
| `sent_at`        | DateTime | DEFAULT now()         | When notification was attempted          |

**Indexes**:

- `ncr_id`
- `recipient_type`
- `status`
- `sent_at`
- `(ncr_id, recipient_type)` composite

---

## New Enums

### NotificationRecipientType

```prisma
enum NotificationRecipientType {
  FINANCE
  PROCUREMENT
  SUPPLIER
}
```

### NotificationStatus

```prisma
enum NotificationStatus {
  SENT
  FAILED
}
```

---

## Prisma Schema Additions

```prisma
// Add to prisma/schema.prisma

model NotificationSetting {
  id         String   @id @default(uuid()) @db.Uuid
  key        String   @unique @db.VarChar(50)
  emails     String[] @default([])
  updated_at DateTime @updatedAt @db.Timestamptz(6)
  updated_by String   @db.Uuid
  updater    User     @relation("NotificationSettingUpdater", fields: [updated_by], references: [id])

  @@index([key])
  @@map("notification_settings")
}

model NCRNotificationLog {
  id             String                    @id @default(uuid()) @db.Uuid
  ncr_id         String                    @db.Uuid
  recipient_type NotificationRecipientType
  recipients     String[]
  status         NotificationStatus
  error_message  String?
  sent_at        DateTime                  @default(now()) @db.Timestamptz(6)
  ncr            NCR                       @relation(fields: [ncr_id], references: [id], onDelete: Cascade)

  @@index([ncr_id])
  @@index([recipient_type])
  @@index([status])
  @@index([sent_at])
  @@index([ncr_id, recipient_type])
  @@map("ncr_notification_logs")
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

// Add relation to User model
model User {
  // ... existing fields ...
  notification_settings NotificationSetting[] @relation("NotificationSettingUpdater")
}

// Add relation to NCR model
model NCR {
  // ... existing fields ...
  notification_logs NCRNotificationLog[]
}
```

---

## TypeScript Interfaces

```typescript
// Add to shared/types/database.ts

export type NotificationRecipientType = "FINANCE" | "PROCUREMENT" | "SUPPLIER";

export type NotificationStatus = "SENT" | "FAILED";

export interface NotificationSetting {
  id: string;
  key: string;
  emails: string[];
  updated_at: Date | string;
  updated_by: string;
}

export interface NCRNotificationLog {
  id: string;
  ncr_id: string;
  recipient_type: NotificationRecipientType;
  recipients: string[];
  status: NotificationStatus;
  error_message: string | null;
  sent_at: Date | string;
}

// Extended NCR interface with notification logs
export interface NCRWithNotifications extends NCR {
  notification_logs?: NCRNotificationLog[];
}

// Notification settings grouped for UI
export interface NotificationSettingsData {
  finance_team_emails: string[];
  procurement_team_emails: string[];
}
```

---

## Validation Rules

### NotificationSetting

| Field        | Validation                              |
| ------------ | --------------------------------------- |
| `key`        | Must be one of valid keys; max 50 chars |
| `emails`     | Each email must match RFC 5322 format   |
| `updated_by` | Must be valid User UUID with ADMIN role |

### NCRNotificationLog

| Field           | Validation                              |
| --------------- | --------------------------------------- |
| `ncr_id`        | Must reference existing NCR             |
| `recipients`    | Non-empty array when status is SENT     |
| `error_message` | Should be present when status is FAILED |

---

## State Transitions

### NotificationSetting

No state transitions - simple CRUD operations. Each update replaces the previous value.

### NCRNotificationLog

Created with final status - no transitions after creation:

- `SENT` → Terminal (email delivered to SMTP)
- `FAILED` → Terminal (email delivery failed)

---

## Migration Notes

1. Create `notification_settings` table
2. Create `ncr_notification_logs` table
3. Create enums `NotificationRecipientType` and `NotificationStatus`
4. Add foreign key constraints
5. No data migration needed (new feature)

**Seed Data** (optional):

```sql
-- Pre-populate empty settings so UI can load
INSERT INTO notification_settings (id, key, emails, updated_at, updated_by)
SELECT
  gen_random_uuid(),
  'NCR_FINANCE_TEAM_EMAILS',
  '{}',
  NOW(),
  (SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1);

INSERT INTO notification_settings (id, key, emails, updated_at, updated_by)
SELECT
  gen_random_uuid(),
  'NCR_PROCUREMENT_TEAM_EMAILS',
  '{}',
  NOW(),
  (SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1);
```
