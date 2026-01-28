# Quickstart: NCR Email Notification System

**Feature**: 003-ncr-email-notification
**Date**: 2026-01-28

## Overview

This feature adds automatic email notifications when Non-Conformance Reports (NCRs) are created. Notifications are sent to three groups: Finance Team, Procurement Team, and the Supplier (if linked).

---

## Prerequisites

1. **Database**: PostgreSQL with Prisma
2. **SMTP**: Office 365 credentials configured (optional for development)
3. **Environment Variables**:
   ```env
   SMTP_USER=your-email@company.com
   SMTP_PASSWORD=your-password
   SMTP_HOST=smtp.office365.com
   SMTP_PORT=587
   NUXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

---

## Quick Setup

### 1. Run Database Migration

```bash
pnpm db:migrate dev --name add-ncr-notifications
```

This creates:

- `notification_settings` table
- `ncr_notification_logs` table
- New enums: `NotificationRecipientType`, `NotificationStatus`

### 2. Seed Initial Settings (Optional)

The admin UI will create settings on first save, but you can seed them:

```sql
INSERT INTO notification_settings (id, key, emails, updated_at, updated_by)
VALUES
  (gen_random_uuid(), 'NCR_FINANCE_TEAM_EMAILS', '{}', NOW(), '<admin-user-id>'),
  (gen_random_uuid(), 'NCR_PROCUREMENT_TEAM_EMAILS', '{}', NOW(), '<admin-user-id>');
```

### 3. Configure Recipients

1. Log in as Admin
2. Navigate to Settings → Notifications
3. Add email addresses for Finance and Procurement teams
4. Save

---

## Testing the Feature

### Manual NCR Notification

1. Create a manual NCR via the UI or API:

   ```bash
   curl -X POST http://localhost:3000/api/ncrs \
     -H "Content-Type: application/json" \
     -d '{
       "location_id": "<location-uuid>",
       "reason": "Test NCR for notification",
       "value": 100
     }'
   ```

2. Check console for email log (dev mode) or inbox (production)

### Price Variance NCR Notification

1. Ensure a period is open with locked prices
2. Create a delivery with a price different from period price
3. Post the delivery
4. System auto-generates NCR with PRICE_VARIANCE type
5. Notifications sent automatically

### Verify Notification Logs

```sql
SELECT * FROM ncr_notification_logs
ORDER BY sent_at DESC
LIMIT 10;
```

---

## Key Files

| File                                         | Purpose                     |
| -------------------------------------------- | --------------------------- |
| `prisma/schema.prisma`                       | Data models                 |
| `server/utils/email.ts`                      | Email functions             |
| `server/api/ncrs/index.post.ts`              | Manual NCR creation trigger |
| `server/utils/priceVariance.ts`              | Auto NCR creation trigger   |
| `server/api/settings/notifications/`         | Settings API                |
| `app/pages/settings/notifications.vue`       | Admin UI                    |
| `app/composables/useNotificationSettings.ts` | Frontend composable         |

---

## Common Tasks

### Add New Recipient Group

1. Add new setting key constant
2. Update `NotificationRecipientType` enum
3. Extend `sendNCRCreatedNotification()` function
4. Update admin UI

### Customize Email Template

Edit templates in `server/utils/email.ts`:

- `buildNCRInternalEmailHtml()` - Finance/Procurement
- `buildNCRSupplierEmailHtml()` - Supplier

### Debug Notifications

```typescript
// Enable verbose logging in email.ts
const DEBUG = process.env.NODE_ENV === "development";

if (DEBUG) {
  console.log("[NCR Email] Recipients:", recipients);
  console.log("[NCR Email] Subject:", subject);
  console.log("[NCR Email] HTML:", html);
}
```

---

## Troubleshooting

| Issue                           | Solution                                               |
| ------------------------------- | ------------------------------------------------------ |
| No emails sent                  | Check SMTP env vars; verify recipient list not empty   |
| NCR created but no notification | Check console for errors; verify trigger point reached |
| Settings not saving             | Verify user has ADMIN role; check API errors           |
| Wrong recipients                | Check `notification_settings` table values             |
| Email bouncing                  | Verify email addresses are valid                       |

---

## API Examples

### Get Settings

```bash
curl http://localhost:3000/api/settings/notifications \
  -H "Cookie: <auth-cookie>"
```

### Update Settings

```bash
curl -X PUT http://localhost:3000/api/settings/notifications \
  -H "Content-Type: application/json" \
  -H "Cookie: <auth-cookie>" \
  -d '{
    "finance_team_emails": ["finance@company.com"],
    "procurement_team_emails": ["procurement@company.com"]
  }'
```

---

## Architecture Notes

- **Async Sending**: Notifications don't block NCR creation
- **Graceful Degradation**: SMTP failures logged but don't break workflow
- **Immediate Effect**: Setting changes apply to next notification (no cache)
- **Audit Trail**: All attempts logged in `ncr_notification_logs`
