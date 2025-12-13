# E2E Testing Changes Log

This file tracks changes made during E2E testing that affect the system design or functionality.

---

## 2025-01-29: Removed Location Manager Feature

**Reason:** The location manager field was creating confusion as it was separate from user assignments. A user designated as "manager" did not automatically have access to the location - they needed to be separately assigned via the user assignments feature.

**Changes Made:**

- Removed `manager_id` field from `Location` model in database schema
- Removed `managed_locations` relation from `User` model
- Removed manager selection field from location create page (app/pages/locations/create.vue)
- Removed manager selection field from location edit page (app/pages/locations/[id]/edit.vue)
- Removed manager display from location details page (app/pages/locations/[id]/index.vue)
- Removed manager display from location cards component (app/components/location/LocationCard.vue)
- Updated location API endpoints to remove manager_id handling:
  - GET /api/locations (list all locations)
  - POST /api/locations (create)
  - PATCH /api/locations/:id (update)
  - GET /api/locations/:id (fetch single location)
- Database migration completed manually via SQL: `ALTER TABLE locations DROP COLUMN IF EXISTS manager_id;`

**Impact:** Locations no longer have a designated manager. Access control is now solely managed through the user assignments feature (UserLocation table), which provides more granular control with access levels (VIEW, POST, MANAGE).

---

## 2025-01-30: Location Deletion Feature

**Reason:** Added ability to delete locations with smart hard/soft delete logic and UI consistency improvements.

**Changes Made:**

- Created DELETE endpoint at `server/api/locations/[id].delete.ts` with intelligent deletion logic:
  - Hard delete (permanent removal) for locations with no transaction history
  - Soft delete (is_active = false) for locations with existing transactions to preserve audit trail
  - Checks 6 transaction types: deliveries, issues, transfers, PRFs, NCRs, and default_for_users
  - Automatically clears default_location_id for affected users before deletion
- Added `LocationDeleteResponse` interface to `shared/types/api.ts`
- Updated `app/components/location/LocationCard.vue` with delete button and canDelete prop
- Added delete modal to locations index page (`app/pages/locations/index.vue`)
- Added delete functionality to location details page (`app/pages/locations/[id]/index.vue`)
- Fixed modal visibility issue by wrapping content in `<template #content>` slot
- Fixed stale data issue by ensuring `fetchLocations()` is called even on deletion errors
- Removed 5-minute HTTP cache from `server/api/locations/index.get.ts` to enable real-time updates

**Impact:** Admins can now delete locations while preserving historical data integrity. Empty locations are permanently removed, while locations with transaction history are deactivated. UI updates immediately reflect database changes.

---

## 2025-12-02: App-Wide Caching Standardization

**Reason:** CRUD operations (especially suppliers) were taking too long to reflect changes due to 5-minute cache durations. Reduced cache timers to provide near-instant updates while maintaining performance benefits.

**Cache Duration Standards:**

- **Master data** (Items, Suppliers, Locations, Users): 20s server + 10s SWR + 20s client
- **Critical data** (Current Period): 10s server + 10s SWR + 10s client

**Changes Made:**

Server-side cache updates:

- `server/api/items/index.get.ts`: 300s → 20s
- `server/api/user/locations.get.ts`: 300s → 20s
- `server/api/periods/current.get.ts`: 60s → 10s
- `server/api/suppliers/index.get.ts`: Added 20s cache headers

Client-side cache updates:

- `app/composables/useItems.ts`: 5 min → 20s
- `app/composables/useLocations.ts`: 5 min → 20s
- `app/composables/useCurrentPeriod.ts`: 60s/5min → 10s/20s
- Created `app/composables/useSuppliers.ts` with 20s cache

Cache invalidation:

- Added `invalidateSuppliers()` to `app/composables/useCache.ts`
- Refactored `app/pages/suppliers/index.vue` to use `useSuppliers` composable
- Added cache invalidation to supplier create/edit/delete operations

**Impact:** Changes to master data now reflect within 20 seconds max, often instantly due to proactive cache invalidation on mutations.

---

## 2025-12-07: Automatic Location Access on User Creation

**Reason:** During E2E testing of user creation workflow, discovered that assigning a default location to a new user did not automatically grant them access to that location. Users needed a manual second step (editing the user and adding location access) to become functional, creating a confusing two-step process.

**Changes Made:**

- Modified `server/api/auth/register.post.ts`:
  - Added `AccessLevel` type import from Prisma
  - Wrapped user creation in `prisma.$transaction()` for atomicity
  - Added automatic `UserLocation` record creation when `default_location_id` is provided
  - Implemented role-based access level assignment:
    - OPERATOR → POST access level (can create deliveries/issues)
    - SUPERVISOR → MANAGE access level (full control at location)
    - ADMIN → No UserLocation created (implicit all-location access via role)
  - Transaction ensures rollback if UserLocation creation fails

- Updated `app/pages/users/create.vue`:
  - Changed default location help text from "Optional: User's default working location" to "User will automatically receive access to this location"
  - Enhanced success toast to show "User created successfully with access to default location" when location is assigned
  - Maintains generic "User created successfully" message when no location is assigned

**Impact:** Users created with a default location now immediately have functional access to that location without requiring manual location access assignment. The two-step creation process is eliminated, improving admin efficiency and reducing setup errors. Transaction safety ensures data consistency if access grant fails.

---

## 2025-12-13: Delivery Draft Workflow Feature

**Reason:** Users requested the ability to save deliveries as drafts before final submission. Previously, deliveries were immediately posted upon creation, with no option to edit afterward. This created issues when users needed to make corrections or complete entries later. The new draft workflow allows users to save incomplete deliveries, edit them multiple times, and only post when ready - at which point stock levels are updated and the delivery becomes immutable.

**Database Schema Changes (`prisma/schema.prisma`):**

- Added `DeliveryStatus` enum with values: `DRAFT`, `POSTED`
- Added new fields to `Delivery` model:
  - `status` (DeliveryStatus, default: DRAFT)
  - `created_at` (DateTime, auto-set)
  - `updated_at` (DateTime, auto-updated)
- Renamed `posted_by` → `created_by` (user who created the delivery)
- Renamed relation `poster` → `creator`
- Made `posted_at` nullable (null for drafts, set when posted)
- Added indexes for efficient status-based queries:
  - `@@index([status])`
  - `@@index([location_id, status])`
  - `@@index([created_by, status])` - For "My Drafts" filter

**API Endpoint Changes:**

- **POST `/api/locations/:id/deliveries`** - Updated to support `status` field in request body
  - `status: "DRAFT"` - Saves without updating stock or generating NCRs
  - `status: "POSTED"` - Full validation, stock updates, WAC calculations, NCR generation
  - Invoice number optional for drafts, required for posting

- **PATCH `/api/deliveries/:id`** - New endpoint for updating draft deliveries
  - Only DRAFT status deliveries can be updated
  - Creator-only access (user can only edit their own drafts)
  - Supports transitioning from DRAFT → POSTED (triggers full stock updates)

- **DELETE `/api/deliveries/:id`** - New endpoint for deleting draft deliveries
  - Only DRAFT status deliveries can be deleted
  - Creator-only access
  - Returns 400 error if attempting to delete a posted delivery

- **GET `/api/deliveries/:id`** - Updated response
  - Added `status`, `created_at`, `updated_at` fields
  - Changed `poster` to `creator` relation
  - Draft visibility restricted to creator only (unless ADMIN/SUPERVISOR)

- **GET `/api/reports/deliveries`** - Added filter support
  - New query params: `status` (DRAFT/POSTED), `myDrafts` (true/false)
  - Drafts are only visible to their creator (unless ADMIN/SUPERVISOR)
  - Response includes `status`, `creator_id`, `creator_name`, `created_at`

**UI Changes:**

- **`app/pages/deliveries/create.vue`** - Dual-button submission
  - "Save Draft" button (neutral color) - saves without posting
  - "Post Delivery" button (primary color) - opens confirmation modal
  - Confirmation modal warns: "Once posted, this delivery cannot be edited"
  - Relaxed validation for drafts (invoice number optional)
  - Strict validation for posting (all required fields)

- **`app/pages/deliveries/index.vue`** - Status column and filter
  - New "Status" column with color-coded badges (neutral=Draft, success=Posted)
  - Status filter dropdown with options: All Deliveries, My Drafts, Posted
  - Mobile-responsive filter dropdowns

- **`app/pages/deliveries/[id].vue`** - Conditional edit mode
  - Status badge in header (Draft/Posted)
  - Conditional subtitle: "Created by..." for drafts, "Posted by..." for posted
  - Draft actions: Delete, Edit, Post buttons
  - Posted actions: Print button only
  - Confirmation modals for Delete (danger) and Post (warning)
  - Edit button navigates to `/deliveries/:id/edit` (edit page to be implemented)

**Business Logic:**

- **Draft State:**
  - No stock level changes
  - No WAC recalculations
  - No NCR generation for price variances
  - Can be edited unlimited times by creator
  - Can be deleted by creator
  - Only visible to creator (privacy)

- **Posted State:**
  - Stock levels updated (LocationStock.on_hand)
  - WAC recalculated using weighted average formula
  - NCRs auto-generated for price variances
  - Immutable - cannot be edited or deleted
  - Visible to all users with location access

**Configuration Changes:**

- Added `DIRECT_URL` to `.env` for Prisma migrations (bypasses PgBouncer pooler)
- Updated `prisma/schema.prisma` datasource to use `directUrl` for migrations
- Fixed seed script to remove deprecated `manager_id` field from locations

**Impact:** Users can now save delivery work-in-progress, return to complete later, and only finalize when ready. This improves data accuracy by allowing corrections before stock is affected. The draft visibility restriction ensures users' incomplete work remains private until posted.
