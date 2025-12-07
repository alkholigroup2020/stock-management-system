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
