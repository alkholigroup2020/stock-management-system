# User Onboarding Process

**Document Version:** 1.0
**Last Updated:** 2025-11-27
**Owner:** System Administrator

---

## Table of Contents

1. [Overview](#overview)
2. [Onboarding Workflow](#onboarding-workflow)
3. [Pre-Onboarding Preparation](#pre-onboarding-preparation)
4. [User Account Creation](#user-account-creation)
5. [Role Assignment](#role-assignment)
6. [Location Access Setup](#location-access-setup)
7. [Initial Training](#initial-training)
8. [System Access Verification](#system-access-verification)
9. [Ongoing Support](#ongoing-support)
10. [Offboarding Process](#offboarding-process)

---

## Overview

This document outlines the standardized process for onboarding new users to the Stock Management System. Following this process ensures users have appropriate access, understand their responsibilities, and can effectively use the system.

### Onboarding Objectives

- Grant appropriate system access based on job role
- Ensure users understand system workflows
- Provide adequate training and documentation
- Verify users can perform required tasks
- Establish ongoing support channels

### Timeline

| Step                         | Duration   | Responsible          |
| ---------------------------- | ---------- | -------------------- |
| Pre-onboarding preparation   | 1 day      | System Admin         |
| Account creation             | 30 minutes | System Admin         |
| Role and location assignment | 15 minutes | System Admin         |
| Initial training             | 1-2 hours  | Trainer / Supervisor |
| System access verification   | 30 minutes | User + Supervisor    |
| Total onboarding time        | 1-2 days   | Multiple             |

---

## Onboarding Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                  Onboarding Workflow                         │
└─────────────────────────────────────────────────────────────┘

1. Request Received
   ↓
2. Pre-Onboarding Preparation
   • Gather user information
   • Determine role and locations
   • Prepare training materials
   ↓
3. Account Creation
   • Create user in Supabase Auth
   • Create user record in database
   • Generate temporary password
   ↓
4. Role & Location Assignment
   • Assign role (Operator/Supervisor/Admin)
   • Assign location access
   • Set permissions
   ↓
5. Send Welcome Email
   • Login credentials
   • Training schedule
   • Documentation links
   ↓
6. Initial Training
   • System overview (15 min)
   • Role-specific training (30-60 min)
   • Hands-on practice (30 min)
   ↓
7. System Access Verification
   • User logs in successfully
   • User completes test transactions
   • Supervisor verifies access
   ↓
8. Onboarding Complete
   • User added to support channels
   • User receives ongoing support
   • Follow-up after 1 week
```

---

## Pre-Onboarding Preparation

### Step 1: Gather User Information

**Information Needed:**

- Full name
- Email address (company email preferred)
- Job title
- Department
- Direct supervisor
- Role in system (Operator, Supervisor, or Admin)
- Location(s) to access (Kitchen, Store, Central, Warehouse)
- Start date

**Use this checklist:**

```markdown
## New User Information

**Personal Information:**

- [ ] Full Name: **\*\***\_\_\_**\*\***
- [ ] Email: **\*\***\_\_\_**\*\***
- [ ] Phone: **\*\***\_\_\_**\*\*** (optional)

**Job Information:**

- [ ] Job Title: **\*\***\_\_\_**\*\***
- [ ] Department: **\*\***\_\_\_**\*\***
- [ ] Supervisor: **\*\***\_\_\_**\*\***
- [ ] Start Date: YYYY-MM-DD

**System Access:**

- [ ] Role: ☐ Operator ☐ Supervisor ☐ Admin
- [ ] Locations: ☐ Kitchen ☐ Store ☐ Central ☐ Warehouse
- [ ] Special permissions: **\*\***\_\_\_**\*\***

**Training:**

- [ ] Training schedule: YYYY-MM-DD HH:MM
- [ ] Trainer assigned: **\*\***\_\_\_**\*\***
```

### Step 2: Determine Role

Use this decision matrix to assign the appropriate role:

| Job Title                          | Typical Role | Location Access                              |
| ---------------------------------- | ------------ | -------------------------------------------- |
| Store Clerk, Kitchen Staff         | Operator     | Single location (their workplace)            |
| Store Manager, Kitchen Supervisor  | Supervisor   | All locations or specific regions            |
| Inventory Manager, Finance Manager | Admin        | All locations                                |
| CEO, Operations Director           | Admin        | All locations (view-only may be appropriate) |

**Role Capabilities:**

**Operator:**

- Post deliveries
- Post issues
- View stock levels
- View dashboard
- Access assigned locations only

**Supervisor:**

- All Operator capabilities
- Approve transfers
- Approve PRF/PO (future)
- Create/resolve NCRs
- Perform reconciliations
- Mark locations ready for period close
- Access all locations

**Admin:**

- All Supervisor capabilities
- Manage items and prices
- Close accounting periods
- Manage users (future)
- Configure system settings
- Access all locations

### Step 3: Prepare Training Materials

**Materials to provide:**

- [ ] User Manual (`project-docs/user-docs/USER_MANUAL.md`)
- [ ] Quick Reference Card (`project-docs/user-docs/QUICK_REFERENCE_CARD.md`)
- [ ] Training Presentation (appropriate module)
- [ ] Practice Scenarios (role-specific)
- [ ] System access credentials (sent separately via email)

---

## User Account Creation

### Method 1: Via Supabase Dashboard (Manual)

**Use this method for pilot users or low volume onboarding.**

1. **Log into Supabase Dashboard:**
   - Navigate to https://app.supabase.com
   - Select production project
   - Go to Authentication → Users

2. **Create new user:**
   - Click "Add User" button
   - Enter email address
   - Generate auto password (checked)
   - Click "Create user"
   - Copy the temporary password

3. **Create user record in database:**

   Use Supabase SQL Editor or Prisma Studio:

   ```sql
   INSERT INTO "User" (id, email, name, role, is_active, created_at, updated_at)
   VALUES (
     '[SUPABASE_USER_ID]',  -- Copy from Auth Users table
     'user@company.com',
     'John Doe',
     'OPERATOR',  -- or 'SUPERVISOR', 'ADMIN'
     true,
     NOW(),
     NOW()
   );
   ```

4. **Assign location access:**

   ```sql
   -- For Operators (single location)
   INSERT INTO "UserLocation" (user_id, location_id)
   VALUES ('[USER_ID]', '[LOCATION_ID]');

   -- For Supervisors/Admins (all locations)
   INSERT INTO "UserLocation" (user_id, location_id)
   SELECT '[USER_ID]', id FROM "Location";
   ```

### Method 2: Via API Endpoint (Automated - Future)

**Note:** This endpoint doesn't exist yet. Create it for high-volume onboarding.

```typescript
// POST /api/admin/users
// Request body:
{
  "email": "user@company.com",
  "name": "John Doe",
  "role": "OPERATOR",
  "locationIds": ["location-id-1"]
}

// Response:
{
  "userId": "uuid",
  "email": "user@company.com",
  "temporaryPassword": "auto-generated-password",
  "resetPasswordUrl": "https://..."
}
```

### Step 4: Send Welcome Email

**Template:**

```
TO: user@company.com
SUBJECT: Welcome to Stock Management System

Dear [Name],

Welcome to the Stock Management System! Your account has been created
and you're ready to get started.

**Login Information:**
- URL: https://stock-management.vercel.app
- Email: user@company.com
- Temporary Password: [PASSWORD]

**Important:** Please change your password upon first login.

**Training Schedule:**
- Date: [YYYY-MM-DD]
- Time: [HH:MM]
- Location: [Meeting room / Online link]
- Trainer: [Name]

**Resources:**
- User Manual: [Link to USER_MANUAL.md]
- Quick Reference: [Link to QUICK_REFERENCE_CARD.md]
- Support Email: support@company.com

If you have any questions before training, please contact your
supervisor or the support team.

Best regards,
Stock Management System Team
```

---

## Role Assignment

### Role Assignment Checklist

- [ ] Role matches job responsibilities
- [ ] User understands role limitations
- [ ] Supervisor approved role assignment
- [ ] Role documented in user record

### Role Change Process

If a user's role needs to change (promotion, transfer, etc.):

1. **Request approval:**
   - User's supervisor submits request
   - Admin reviews and approves

2. **Update role in database:**

   ```sql
   UPDATE "User"
   SET role = 'SUPERVISOR',  -- new role
       updated_at = NOW()
   WHERE id = '[USER_ID]';
   ```

3. **Notify user:**
   - Send email about role change
   - Provide additional training if needed (e.g., Operator → Supervisor)

4. **Update location access if needed:**
   - Supervisors/Admins typically get all locations
   - Operators typically have single location

---

## Location Access Setup

### Location Access Matrix

| Role       | Typical Access                        |
| ---------- | ------------------------------------- |
| Operator   | Assigned location(s) only - usually 1 |
| Supervisor | All locations or specific regions     |
| Admin      | All locations                         |

### Assigning Location Access

**For single location (Operator):**

```sql
INSERT INTO "UserLocation" (user_id, location_id)
VALUES ('[USER_ID]', '[LOCATION_ID]');
```

**For all locations (Supervisor/Admin):**

```sql
INSERT INTO "UserLocation" (user_id, location_id)
SELECT '[USER_ID]', id FROM "Location";
```

**For multiple specific locations:**

```sql
INSERT INTO "UserLocation" (user_id, location_id) VALUES
('[USER_ID]', 'kitchen-location-id'),
('[USER_ID]', 'store-location-id');
```

### Verify Location Access

After assigning locations, verify the user can:

- See only assigned locations in location switcher
- Cannot access unauthorized locations via URL manipulation
- Can perform transactions at assigned locations

---

## Initial Training

### Training Modules

Use the training materials from `project-docs/user-docs/TRAINING_PRESENTATION.md`:

**All Users (15 minutes):**

- System Overview
- Navigation
- Dashboard
- Login/logout

**Operators (30 minutes):**

- Recording deliveries
- Posting issues
- Viewing stock
- Using mobile app (PWA)

**Supervisors (45 minutes):**

- All Operator topics
- Transfer approval
- NCR resolution
- Reconciliations
- Month-end procedures

**Admins (60 minutes):**

- All Supervisor topics
- Item master management
- Price updates
- Period management
- Period close workflow

### Training Delivery Methods

**Option 1: In-person training**

- Schedule 1-2 hour session
- Use projector for presentation
- Provide hands-on practice
- Answer questions

**Option 2: Self-paced online training**

- Provide training materials (PDFs, videos)
- User completes at their own pace
- Schedule follow-up Q&A session

**Option 3: One-on-one training**

- Supervisor trains new user
- More personalized, flexible
- Good for small teams

### Training Verification

After training, user should be able to:

- [ ] Log in successfully
- [ ] Navigate to main pages
- [ ] Switch locations (if multiple assigned)
- [ ] Perform role-specific tasks (see below)

**Operator verification:**

- [ ] Create a test delivery
- [ ] Post a test issue
- [ ] View stock levels

**Supervisor verification:**

- [ ] Approve a test transfer
- [ ] Create a test NCR
- [ ] Perform a test reconciliation

**Admin verification:**

- [ ] Create a test item
- [ ] Update a test price
- [ ] Mark location ready for period close

---

## System Access Verification

### Verification Checklist

Complete within 1 day of account creation:

**Login Verification:**

- [ ] User can log in with credentials
- [ ] User can reset password if needed
- [ ] User can navigate to dashboard

**Role Verification:**

- [ ] User sees appropriate menu items for role
- [ ] User cannot access unauthorized pages
- [ ] User cannot perform unauthorized actions

**Location Verification:**

- [ ] User sees assigned locations in switcher
- [ ] User cannot access unauthorized locations
- [ ] User can switch between assigned locations

**Functionality Verification:**

- [ ] User can create test transactions
- [ ] User can view reports
- [ ] User can access mobile app (PWA)

### Test Transaction Checklist

Have the user complete these test transactions:

**All Users:**

- [ ] Log in and out
- [ ] View dashboard
- [ ] Switch location (if multiple)

**Operators:**

- [ ] Create test delivery (mark as test in notes)
- [ ] Post test issue
- [ ] View stock levels

**Supervisors:**

- [ ] Create test transfer
- [ ] Approve test transfer
- [ ] Create test NCR

**Admins:**

- [ ] Create test item (with "TEST" in name)
- [ ] Update test item price
- [ ] View period management page

**Important:** Mark all test transactions clearly or delete them after verification.

---

## Ongoing Support

### Support Channels

**Primary Support:**

- Email: support@company.com
- Response time: Within 4 business hours
- For: How-to questions, minor issues

**Urgent Support:**

- Phone: [TO BE FILLED]
- Available: Business hours (8 AM - 5 PM)
- For: System down, critical errors, data issues

**Self-Service Support:**

- User Manual: `project-docs/user-docs/USER_MANUAL.md`
- FAQ: `project-docs/user-docs/FAQ.md`
- Quick Reference Card: Keep printed copy at desk

### Follow-up Schedule

**Day 1 (after training):**

- User receives welcome email
- User logs in and completes test transactions

**Day 3:**

- Admin checks for any questions or issues
- Quick email: "How's it going?"

**Week 1:**

- Supervisor checks in with user
- Address any questions or concerns

**Month 1:**

- User completes feedback survey
- Admin reviews usage patterns
- Additional training if needed

---

## Offboarding Process

When a user leaves the company or no longer needs access:

### Offboarding Checklist

- [ ] Supervisor submits offboarding request
- [ ] Admin reviews request
- [ ] Disable user account (don't delete - keep audit trail)
- [ ] Remove from support channels
- [ ] Update documentation if user had special role

### Disable User Account

```sql
UPDATE "User"
SET is_active = false,
    updated_at = NOW()
WHERE id = '[USER_ID]';
```

**Important:** Do NOT delete user records. Set `is_active = false` to preserve audit trail.

### Transfer Responsibilities

If the user had pending tasks:

- [ ] Reassign pending transfers to new supervisor
- [ ] Reassign open NCRs to new owner
- [ ] Update any role-specific documentation

---

## Appendix: Bulk User Import (Future)

For onboarding many users at once, create a CSV import tool:

### CSV Format

```csv
email,name,role,locations
john@company.com,John Doe,OPERATOR,kitchen
jane@company.com,Jane Smith,SUPERVISOR,"kitchen,store,central"
admin@company.com,Admin User,ADMIN,all
```

### Import Script

```typescript
// scripts/import-users.ts
import { parse } from "csv-parse/sync";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

// Read CSV file
// For each row:
//   1. Create Supabase Auth user
//   2. Create User record in database
//   3. Assign locations
//   4. Send welcome email
//   5. Log results
```

---

## Document History

| Version | Date       | Author               | Changes               |
| ------- | ---------- | -------------------- | --------------------- |
| 1.0     | 2025-11-27 | System Administrator | Initial documentation |

---

**END OF DOCUMENT**
