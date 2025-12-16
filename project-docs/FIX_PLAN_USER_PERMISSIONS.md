# Fix Plan: User Roles & Permissions

**Date:** December 15, 2025
**Issue:** Location Access Management UI contradicts documented permission rules
**Priority:** High

---

## Problem Statement

The current User Edit page shows "Location Access Management" for ALL roles (Operator, Supervisor, Admin), requiring manual location assignment. However, according to the documented business rules:

- **Supervisors** should automatically have access to ALL locations
- **Admins** should automatically have access to ALL locations with full control
- **Only Operators** should require explicit location assignment

This creates confusion and unnecessary work when creating/editing Supervisor or Admin users.

---

## Current State Analysis

### What's Correct (Server-Side)

1. **`server/middleware/location-access.ts`** - Correctly grants Admins/Supervisors access to all locations
2. **`app/stores/auth.ts`** - `hasLocationAccess()` correctly gives Admins/Supervisors access to all locations
3. **`app/composables/usePermissions.ts`** - Correctly handles role-based permission checks
4. **`app/composables/useAuth.ts`** - Correctly exposes location access helpers

### What's Incorrect (UI)

1. **`app/pages/users/[id]/edit.vue`** - Shows location assignment UI for ALL roles
2. **`app/pages/users/create.vue`** - Doesn't clearly indicate automatic location access for Supervisors/Admins
3. **Role descriptions** - Don't mention location access implications

---

## Fix Plan

### Fix 1: User Edit Page (`edit.vue`)

**Changes:**
- Add computed property to check if user role is OPERATOR
- Conditionally show "Location Access Management" section ONLY for Operators
- Add info card for Supervisor/Admin explaining they have automatic access to all locations
- Update UI to clearly distinguish between role types

**Files to modify:**
- `app/pages/users/[id]/edit.vue`

### Fix 2: User Create Page (`create.vue`)

**Changes:**
- Add dynamic info section that changes based on selected role
- For OPERATOR: Show note that locations must be assigned after creation
- For SUPERVISOR: Show note that they'll have access to all locations automatically
- For ADMIN: Show note that they'll have full access to all locations
- Update role option descriptions

**Files to modify:**
- `app/pages/users/create.vue`

### Fix 3: Role Descriptions Update

**Changes:**
- Update role option labels to include location access info:
  - OPERATOR: "Operator - Can post transactions at assigned locations only"
  - SUPERVISOR: "Supervisor - Access to all locations, can approve transfers"
  - ADMIN: "Admin - Full system access with complete control over all locations"

**Files to modify:**
- `app/pages/users/[id]/edit.vue`
- `app/pages/users/create.vue`

### Fix 4: Add Role-Based Info Cards

**New UI Components:**
- Create reusable alert/info component showing location access rules per role
- Display warning when changing role from OPERATOR to SUPERVISOR/ADMIN (locations become irrelevant)
- Display warning when changing role from SUPERVISOR/ADMIN to OPERATOR (requires location assignment)

---

## Test Scenarios

### Scenario 1: Edit Operator User
- [ ] Location Access Management section should be visible
- [ ] Can add/remove locations
- [ ] Proper access levels (VIEW, POST, MANAGE) available

### Scenario 2: Edit Supervisor User
- [ ] Location Access Management section should be HIDDEN
- [ ] Info card should display explaining automatic access to all locations
- [ ] User should still be able to set Default Location (preference only)

### Scenario 3: Edit Admin User
- [ ] Location Access Management section should be HIDDEN
- [ ] Info card should display explaining full access to all locations
- [ ] User should still be able to set Default Location (preference only)

### Scenario 4: Create Operator User
- [ ] Role selection should show location requirement note
- [ ] After creation, redirect to edit page for location assignment

### Scenario 5: Create Supervisor User
- [ ] Role selection should show automatic access note
- [ ] No location assignment required

### Scenario 6: Create Admin User
- [ ] Role selection should show full access note
- [ ] No location assignment required

### Scenario 7: Change Role from Operator to Supervisor
- [ ] Warning should appear about locations becoming irrelevant
- [ ] Existing location assignments should remain but won't be enforced

### Scenario 8: Change Role from Supervisor to Operator
- [ ] Warning should appear about needing location assignment
- [ ] User must have at least one location assigned to function

---

## Implementation Order

1. Fix User Edit page (highest impact)
2. Fix User Create page
3. Update role descriptions
4. Add role change warnings
5. Test all scenarios
6. Document the fix

---

## Success Criteria

- [ ] Supervisor/Admin users don't see location assignment UI
- [ ] Clear messaging about automatic location access
- [ ] Role descriptions include location access info
- [ ] Proper warnings when changing roles
- [ ] All test scenarios pass
- [ ] No TypeScript errors
- [ ] Code follows project formatting standards
