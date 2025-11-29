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
