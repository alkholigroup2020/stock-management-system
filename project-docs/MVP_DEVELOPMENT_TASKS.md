# MVP Development Tasks - Complete Checklist

**Project:** Stock Management System - Multi-Location
**Version:** 1.0
**Last Updated:** November 9, 2025
**Target Completion:** December 15, 2025 (35 development days)

---

## Overview

This document contains a comprehensive, step-by-step task list for building the complete MVP of the Stock Management System. Tasks are organized by development slices as defined in [MVP.md](project-docs/MVP.md).

**Development Timeline:**

- **Slice 1:** Foundation & Locations (12 days)
- **Slice 2:** Transfers & Controls (10 days)
- **Slice 3:** Period Management (8 days)
- **Slice 4:** Polish & Performance (5 days)
- **Total:** 35 days

---

## 📊 Progress Summary

- **Total Tasks:** 200+
- **Completed:** 107
- **In Progress:** 0
- **Remaining:** 93+

---

# Slice 1: Foundation & Locations (12 days)

## Phase 1.1: Project Foundation & Setup (Days 1-2)

### 1.1.1 Project Initialization

- [x] Verify Nuxt 4 project structure is in place
- [x] Ensure pnpm is configured as package manager
- [x] Update `package.json` with all required dependencies
  - [x] Verify `@nuxt/ui` version (^4.1.0)
  - [x] Verify `@pinia/nuxt` version (^0.11.2)
  - [x] Verify `@vite-pwa/nuxt` version (^1.0.7)
  - [x] Verify `@prisma/client` version (^6.18.0)
  - [x] Verify `dayjs` version (^1.11.19)
  - [x] Verify `zod` version (^4.1.12)
- [x] Install all dependencies (`pnpm install`)
- [x] Verify TypeScript is configured correctly
- [x] Test dev server runs (`pnpm dev`)

### 1.1.2 Environment Configuration

- [x] Create `.env.example` template file
- [x] Document all required environment variables
- [x] Set up local `.env` file (gitignored)
- [x] Configure `nuxt.config.ts` runtime config
  - [x] Private runtime config (server-only)
  - [x] Public runtime config (client + server)
- [x] Document environment variable setup in README

### 1.1.3 Tailwind CSS v4 Configuration

- [x] Verify `@nuxtjs/tailwindcss` module is installed
- [x] Update `app/assets/css/main.css` with `@theme` directive
- [x] Define navy blue brand color (#000046) with shades 50-950
- [x] Define emerald green brand color (#45cf7b) with shades 50-950
- [x] Configure color mode settings in `nuxt.config.ts`
- [x] Test both light and dark mode themes
- [x] Remove any `app.config.ts` color configuration (not needed)
- [x] Document color usage rules in CLAUDE.md

### 1.1.4 Nuxt UI Configuration & Comprehensive Design System

**Nuxt UI Setup:**

- [x] Verify Nuxt UI module is installed
- [x] Configure Nuxt UI components auto-import
- [x] Test basic Nuxt UI components (UButton, UCard, UModal)
- [x] Configure toast notifications
- [x] Test form components (UForm, UInput)
- [x] Verify Nuxt UI colors work with custom theme

**Design System Implementation:**

- [x] Expand color palettes (navy, emerald, zinc, amber, red, blue) with shades 50-950
- [x] Create semantic color tokens (40+ tokens for backgrounds, text, borders, interactive states)
- [x] Add business-specific tokens (stock status, approval workflows, period states)
- [x] Build utility classes for surfaces, forms, badges, typography (40+ classes)
- [x] Implement full light/dark mode support across all tokens
- [x] Fix Tailwind CSS v4 @apply limitation (refactor badge classes)
- [x] Create comprehensive documentation (DESIGN_SYSTEM.md - 750+ lines)
- [x] Update CLAUDE.md with design system guidelines and @apply limitation notes
- [x] Verify all semantic tokens and utility classes work correctly

---

## Phase 1.2: Database Setup (Days 2-3)

### 1.2.1 Supabase Setup

- [x] Create Supabase account (if not exists)
- [x] Create new Supabase project
- [x] Note project URL and keys
- [x] Configure database region (closest to Saudi Arabia)
- [x] Set up database password policy
- [x] Enable daily backups
- [x] Document Supabase credentials storage

### 1.2.2 Prisma Setup

- [x] Install Prisma CLI and client
- [x] Initialize Prisma (`prisma init`)
- [x] Configure DATABASE_URL in `.env`
- [x] Create `prisma/schema.prisma` base structure
- [x] Configure PostgreSQL datasource
- [x] Configure Prisma client generator

### 1.2.3 Prisma Schema - Core Entities

- [x] Define `User` model
  - [x] id, username, email, full_name
  - [x] role (OPERATOR, SUPERVISOR, ADMIN)
  - [x] default_location_id, is_active
  - [x] created_at, last_login
- [x] Define `Location` model
  - [x] id, code, name, type (KITCHEN/STORE/CENTRAL/WAREHOUSE)
  - [x] address, manager_id, timezone
  - [x] is_active, created_at, updated_at
- [x] Define `UserLocation` model (join table)
  - [x] user_id, location_id
  - [x] access_level (VIEW/POST/MANAGE)
  - [x] assigned_at, assigned_by
  - [x] PRIMARY KEY (user_id, location_id)
- [x] Define `Item` model
  - [x] id, code, name, unit (ENUM)
  - [x] category, sub_category
  - [x] is_active, created_at, updated_at
- [x] Define `Supplier` model
  - [x] id, code, name, contact
  - [x] is_active, created_at

### 1.2.4 Prisma Schema - Period & Stock Models

- [x] Define `Period` model
  - [x] id, name, start_date, end_date
  - [x] status (DRAFT/OPEN/PENDING_CLOSE/APPROVED/CLOSED)
  - [x] approval_id, created_at, closed_at
- [x] Define `PeriodLocation` model
  - [x] period_id, location_id
  - [x] status (OPEN/READY/CLOSED)
  - [x] opening_value, closing_value
  - [x] snapshot_id, ready_at, closed_at
  - [x] PRIMARY KEY (period_id, location_id)
- [x] Define `ItemPrice` model
  - [x] id, item_id, period_id
  - [x] price, currency (default 'SAR')
  - [x] set_by, set_at
  - [x] UNIQUE (item_id, period_id)
- [x] Define `LocationStock` model
  - [x] location_id, item_id
  - [x] on_hand, wac (Weighted Average Cost)
  - [x] min_stock, max_stock
  - [x] last_counted, updated_at
  - [x] PRIMARY KEY (location_id, item_id)

### 1.2.5 Prisma Schema - Transaction Models

- [x] Define `PRF` model (Purchase Request Form)
  - [x] id, prf_no, period_id, location_id
  - [x] status (DRAFT/PENDING/APPROVED/REJECTED)
  - [x] requested_by, approved_by
  - [x] request_date, approval_date
- [x] Define `PO` model (Purchase Order)
  - [x] id, po_no, prf_id, supplier_id
  - [x] status (OPEN/CLOSED)
  - [x] total_amount, created_at
- [x] Define `Delivery` model
  - [x] id, delivery_no, period_id, location_id
  - [x] supplier_id, po_id (optional)
  - [x] invoice_no, delivery_note, delivery_date
  - [x] total_amount, has_variance
  - [x] posted_by, posted_at
- [x] Define `DeliveryLine` model
  - [x] id, delivery_id, item_id
  - [x] quantity, unit_price, period_price
  - [x] price_variance, line_value
  - [x] ncr_id (optional)
- [x] Define `Issue` model
  - [x] id, issue_no, period_id, location_id
  - [x] issue_date, cost_centre (FOOD/CLEAN/OTHER)
  - [x] total_value, posted_by, posted_at
- [x] Define `IssueLine` model
  - [x] id, issue_id, item_id
  - [x] quantity, wac_at_issue, line_value

### 1.2.6 Prisma Schema - Transfer Models

- [x] Define `Transfer` model
  - [x] id, transfer_no, from_location_id, to_location_id
  - [x] status (DRAFT/PENDING_APPROVAL/APPROVED/REJECTED/COMPLETED)
  - [x] requested_by, approved_by
  - [x] request_date, approval_date, transfer_date
  - [x] total_value, notes
- [x] Define `TransferLine` model
  - [x] id, transfer_id, item_id
  - [x] quantity, wac_at_transfer, line_value

### 1.2.7 Prisma Schema - Control Models

- [x] Define `NCR` model (Non-Conformance Report)
  - [x] id, ncr_no, location_id
  - [x] type (MANUAL/PRICE_VARIANCE)
  - [x] auto_generated, delivery_id, delivery_line_id
  - [x] reason, quantity, value
  - [x] status (OPEN/SENT/CREDITED/REJECTED/RESOLVED)
  - [x] created_by, created_at, resolved_at
- [x] Define `POB` model (People on Board)
  - [x] id, period_id, location_id, date
  - [x] crew_count, extra_count
  - [x] total_count (GENERATED)
  - [x] entered_by, entered_at
  - [x] UNIQUE (period_id, location_id, date)
- [x] Define `Reconciliation` model
  - [x] id, period_id, location_id
  - [x] opening_stock, receipts, transfers_in, transfers_out
  - [x] issues, closing_stock, adjustments
  - [x] back_charges, credits, condemnations
  - [x] consumption (GENERATED), manday_cost (GENERATED)
  - [x] last_updated
- [x] Define `Approval` model
  - [x] id, entity_type (PRF/PO/PERIOD_CLOSE/TRANSFER)
  - [x] entity_id, status (PENDING/APPROVED/REJECTED)
  - [x] requested_by, reviewed_by
  - [x] requested_at, reviewed_at, comments

### 1.2.8 Prisma Schema - Indexes & Relations

- [x] Add indexes for performance
  - [x] Location queries
  - [x] Transfer queries
  - [x] Price variance queries
  - [x] Period operations
  - [x] User access
- [x] Define all model relations
- [x] Add check constraints
  - [x] Positive stock check
  - [x] Different locations for transfers
  - [x] Positive price check
- [x] Test schema compilation

### 1.2.9 Database Migration

- [x] Run Prisma generate to create client
- [x] Create first migration (`prisma migrate dev`)
- [x] Test migration applies successfully
- [x] Verify all tables created in Supabase
- [x] Test Prisma Studio (`pnpm db:studio`)
- [x] Document migration process

### 1.2.10 Seed Data (Optional for Development)

- [x] Create `prisma/seed.ts` file
- [x] Add seed script to package.json
- [x] Create default admin user
- [x] Create test locations (2-3)
- [x] Create sample items (10-15)
- [x] Create test supplier
- [x] Run seed script
- [x] Verify seed data in Prisma Studio

---

## Phase 1.3: Authentication & Authorization (Days 3-4)

### 1.3.1 Auth Setup with nuxt-auth-utils

- [x] Install `nuxt-auth-utils` package
- [x] Configure auth module in `nuxt.config.ts`
- [x] Set up AUTH_SECRET environment variable
- [x] Configure session settings (httpOnly cookies)
- [x] Configure JWT token expiration
- [x] Test basic auth module initialization

### 1.3.2 Password Hashing Utility

- [x] Create `server/utils/auth.ts`
- [x] Implement password hashing function (bcrypt or argon2)
- [x] Implement password verification function
- [x] Add password strength validation
- [x] Test password utilities

### 1.3.3 Auth API Routes

- [x] Create `server/api/auth/login.post.ts`
  - [x] Validate email and password (Zod schema)
  - [x] Query user from database
  - [x] Verify password
  - [x] Create session with user data
  - [x] Return user session (exclude password)
  - [x] Handle errors appropriately
- [x] Create `server/api/auth/logout.post.ts`
  - [x] Clear user session
  - [x] Return success response
- [x] Create `server/api/auth/session.get.ts`
  - [x] Get current session
  - [x] Return user or null
- [x] Create `server/api/auth/register.post.ts` (Admin only)
  - [x] Validate registration data
  - [x] Hash password
  - [x] Create user in database
  - [x] Return created user

### 1.3.4 Auth Middleware

- [x] Create `server/middleware/auth.ts`
  - [x] Check if user session exists
  - [x] Throw 401 if not authenticated
  - [x] Attach user to event.context
  - [x] Apply to all /api/\* routes
- [x] Create `server/middleware/location-access.ts`
  - [x] Extract locationId from route params
  - [x] Check if user has access to location
  - [x] Throw 403 if access denied
  - [x] Apply to location-specific routes
- [x] Test middleware with various routes

### 1.3.5 Auth Store (Pinia)

- [x] Create `stores/auth.ts`
- [x] Define auth state interface
  - [x] user (User | null)
  - [x] isAuthenticated (computed)
  - [x] role (computed)
  - [x] locations (computed)
- [x] Implement login action
- [x] Implement logout action
- [x] Implement fetchSession action
- [x] Implement location check helpers
- [x] Test store in components

### 1.3.6 Auth Composable

- [x] Create `composables/useAuth.ts`
- [x] Export auth store wrapper
- [x] Add helper methods
  - [x] hasRole(role)
  - [x] hasLocationAccess(locationId)
  - [x] isAdmin, isSupervisor, isOperator
- [x] Test composable in pages

### 1.3.7 Login Page

- [x] Create `pages/login.vue`
- [x] Design login form UI
  - [x] Email input
  - [x] Password input
  - [x] Submit button
  - [x] Error message display
- [x] Implement form validation (Zod)
- [x] Implement login submission
- [x] Handle success (redirect to dashboard)
- [x] Handle errors (display message)
- [x] Add "Remember me" checkbox (optional)
- [x] Test login flow

### 1.3.8 Route Protection

- [x] Create `middleware/auth.global.ts` (client-side)
  - [x] Check if route requires auth
  - [x] Redirect to login if not authenticated
  - [x] Allow login page for unauthenticated users
- [x] Create `middleware/role.ts` (for specific roles)
  - [x] Check user role
  - [x] Redirect if insufficient permissions
- [x] Test route protection on various pages

### 1.3.9 Role-Based UI Elements

- [x] Create `composables/usePermissions.ts`
- [x] Implement permission checks
  - [x] canPostDeliveries
  - [x] canPostIssues
  - [x] canEditItems
  - [x] canClosePeriod
  - [x] canApproveTransfers
  - [x] canEditReconciliations
- [x] Test permissions in UI components

---

## Phase 1.4: Base Layout & Navigation (Days 4-5)

### 1.4.1 App Layout Structure

- [x] Create `app.vue` root component
- [x] Create `layouts/default.vue`
- [x] Implement responsive layout structure
  - [x] Header/Navbar
  - [x] Sidebar (collapsible)
  - [x] Main content area
  - [x] Footer (optional)
- [x] Configure layout for mobile responsiveness
- [x] Test layout on different screen sizes

### 1.4.2 App Navbar Component

- [x] Create `components/layout/AppNavbar.vue`
- [x] Design navbar UI
  - [x] App logo/title (use navy brand color)
  - [x] Current location selector
  - [x] Period indicator
  - [x] User menu (avatar, name, logout)
  - [x] Color mode toggle (light/dark)
- [x] Implement location switcher
  - [x] Fetch user locations
  - [x] Display dropdown
  - [x] Update active location in store
- [x] Implement user menu
  - [x] Display user name and role
  - [x] Logout button
  - [x] Profile link (optional)
- [x] Style with Tailwind (use brand colors)
- [x] Test navbar functionality

### 1.4.3 App Sidebar Navigation

- [x] Create `components/layout/AppSidebar.vue`
- [x] Define navigation menu structure
  - [x] Dashboard (icon + label)
  - [x] POB
  - [x] Items & Prices
  - [x] Orders (PRF/PO) - optional for MVP
  - [x] Deliveries & Invoices
  - [x] Issues
  - [x] Transfers
  - [x] NCR
  - [x] Stock Now
  - [x] Reconciliations
  - [x] Period Close
- [x] Implement role-based menu filtering
  - [x] Hide items based on permissions
- [x] Add active route highlighting
- [x] Implement collapsible sidebar (mobile)
- [x] Style menu items (use brand colors)
- [x] Test navigation

### 1.4.4 Global UI Components

- [x] Create `components/common/LoadingSpinner.vue`
- [x] Create `components/common/ErrorAlert.vue`
- [x] Create `components/common/EmptyState.vue`
- [x] Create `components/common/PageHeader.vue`
- [x] Create `components/common/DataTable.vue` (base)
- [x] Test components in isolation

### 1.4.5 Toast Notifications Setup

- [x] Configure Nuxt UI toast
- [x] Create toast composable wrapper
- [x] Define toast types (success, error, warning, info)
- [x] Use brand colors for toast styles
- [x] Test toast notifications

### 1.4.6 Global Stores

- [x] Create `stores/ui.ts`
  - [x] Sidebar collapsed state
  - [x] Modal states
  - [x] Toast queue
- [x] Create `stores/period.ts`
  - [x] Current period
  - [x] Period status
  - [x] Period actions (fetch, refresh)
- [x] Create `stores/location.ts`
  - [x] Active location
  - [x] User locations
  - [x] Location switching logic
- [x] Test stores

---

## Phase 1.5: Location Management (Days 5-6)

### 1.5.1 Location API Routes

- [x] Create `server/api/locations/index.get.ts`
  - [x] Fetch all locations (with filters)
  - [x] Check user permissions
  - [x] Return locations list
- [x] Create `server/api/locations/index.post.ts`
  - [x] Validate location data (Zod)
  - [x] Check admin role
  - [x] Create location in database
  - [x] Return created location
- [x] Create `server/api/locations/[id].get.ts`
  - [x] Fetch single location by ID
  - [x] Check access permissions
  - [x] Return location details
- [x] Create `server/api/locations/[id].patch.ts`
  - [x] Validate update data
  - [x] Check admin role
  - [x] Update location in database
  - [x] Return updated location
- [x] Create `server/api/locations/[id]/users.get.ts`
  - [x] Fetch users assigned to location
  - [x] Return user list with access levels
- [x] Test all location API routes

### 1.5.2 Location Management UI

- [x] Create `pages/locations/index.vue`
  - [x] List all locations (admin only)
  - [x] Display location cards/table
  - [x] Add "Create Location" button
  - [x] Implement search/filter
- [x] Create `pages/locations/create.vue`
  - [x] Location creation form
  - [x] Form validation
  - [x] Submit handler
  - [x] Success/error handling
- [x] Create `pages/locations/[id]/edit.vue`
  - [x] Location edit form
  - [x] Pre-fill existing data
  - [x] Update handler
- [x] Create `components/location/LocationCard.vue`
  - [x] Display location info
  - [x] Action buttons (edit, view details)
- [x] Test location management UI

### 1.5.3 User-Location Assignment

- [x] Create `server/api/locations/[id]/users.post.ts`
  - [x] Assign user to location
  - [x] Set access level
  - [x] Return assignment confirmation
- [x] Create `server/api/locations/[id]/users/[userId].delete.ts`
  - [x] Remove user from location
  - [x] Return confirmation
- [x] Create UI for user assignment (admin panel)
  - [x] User selection dropdown
  - [x] Access level selection
  - [x] Add/Remove buttons
- [x] Test user-location assignments

### 1.5.4 Location Switcher Component

- [x] Create `components/layout/LocationSwitcher.vue`
- [x] Fetch user's assigned locations
- [x] Display dropdown with locations
- [x] Handle location switch
  - [x] Update active location in store
  - [x] Refresh page data if needed
  - [x] Show toast notification
- [x] Style dropdown (brand colors)
- [x] Test location switching

---

## Phase 1.6: Items & Prices (Days 6-8)

### 1.6.1 Item API Routes

- [x] Create `server/api/items/index.get.ts`
  - [x] Fetch items with filters (category, search)
  - [x] Include location stock if locationId provided
  - [x] Support pagination
  - [x] Return items list
- [x] Create `server/api/items/index.post.ts`
  - [x] Validate item data (Zod)
  - [x] Check admin role
  - [x] Create item in database
  - [x] Return created item
- [x] Create `server/api/items/[id].get.ts`
  - [x] Fetch single item by ID
  - [x] Include stock data for all/specific locations
  - [x] Return item details
- [x] Create `server/api/items/[id].patch.ts`
  - [x] Validate update data
  - [x] Check admin role
  - [x] Update item in database
  - [x] Return updated item
- [x] Create `server/api/items/[id].delete.ts`
  - [x] Check admin role
  - [x] Check if item has transaction history
  - [x] Soft delete (set is_active = false)
  - [x] Return confirmation

### 1.6.2 Item Price Management API

- [x] Create `server/api/periods/[periodId]/prices.get.ts`
  - [x] Fetch all item prices for period
  - [x] Return prices list
- [x] Create `server/api/periods/[periodId]/prices.post.ts`
  - [x] Validate price data (Zod schema)
  - [x] Check admin role
  - [x] Check period is not closed
  - [x] Bulk create/update item prices
  - [x] Return updated prices
- [x] Create `server/api/items/[itemId]/price.patch.ts`
  - [x] Update single item price for current period
  - [x] Check admin role
  - [x] Return updated price
- [x] Test price API routes

### 1.6.3 Items Page UI

- [x] Create `pages/items/index.vue`
  - [x] Display items in table/grid
  - [x] Show: Code, Name, Unit, Category, On-Hand, WAC, Value
  - [x] Implement search functionality
  - [x] Implement category filter
  - [x] Add pagination controls
  - [x] Add "Create Item" button (admin only)
  - [x] Add "Edit" action per item (admin only)
- [x] Style items table (brand colors)
- [x] Test items page

### 1.6.4 Create Item UI

- [x] Create `pages/items/create.vue`
- [x] Design item creation form
  - [x] Code input (unique)
  - [x] Name input
  - [x] Unit dropdown (KG, EA, LTR, BOX, CASE, PACK)
  - [x] Category input/dropdown
  - [x] Sub-category input (optional)
- [x] Implement form validation (Zod)
- [x] Implement submit handler
  - [x] Call API to create item
  - [x] Handle success (redirect to items list)
  - [x] Handle errors (display message)
- [x] Test item creation

### 1.6.5 Edit Item UI

- [ ] Create `pages/items/[id]/edit.vue`
- [ ] Pre-fill form with existing item data
- [ ] Allow editing all fields except code
- [ ] Implement update handler
- [ ] Handle success/error
- [ ] Add "Deactivate" button (soft delete)
- [ ] Test item editing

### 1.6.6 Item Price Setting UI

- [ ] Create `pages/periods/[periodId]/prices.vue`
- [ ] Display all items with current prices
- [ ] Show: Item, Current Price, Period Price, Update
- [ ] Allow bulk price update
  - [ ] Editable price column
  - [ ] "Save All" button
- [ ] Show warning if prices differ from WAC
- [ ] Implement price update handler
- [ ] Handle success/error
- [ ] Test price setting

### 1.6.7 Location Stock Display

- [ ] Create `components/item/LocationStockTable.vue`
- [ ] Display stock levels per location
  - [ ] Location name
  - [ ] On-Hand quantity
  - [ ] WAC
  - [ ] Total value
- [ ] Implement on items detail page
- [ ] Test stock display

---

## Phase 1.7: Deliveries with Price Variance (Days 8-10)

### 1.7.1 WAC Calculation Utility

- [ ] Create `server/utils/wac.ts`
- [ ] Implement WAC calculation function
  ```typescript
  calculateWAC(currentQty, currentWAC, receivedQty, receiptPrice): number
  ```
- [ ] Add tests for WAC calculation
- [ ] Document WAC formula

### 1.7.2 Price Variance Detection

- [ ] Create `server/utils/priceVariance.ts`
- [ ] Implement price variance check
  - [ ] Compare delivery price to period price
  - [ ] Calculate variance amount
  - [ ] Determine if NCR needed (threshold check)
- [ ] Implement auto-NCR creation logic
- [ ] Test price variance detection

### 1.7.3 Delivery API Routes

- [ ] Create `server/api/locations/[locationId]/deliveries/index.get.ts`
  - [ ] Fetch deliveries for location
  - [ ] Filter by period, supplier, date range
  - [ ] Include delivery lines
  - [ ] Return deliveries list
- [ ] Create `server/api/locations/[locationId]/deliveries/index.post.ts`
  - [ ] Validate delivery data (Zod)
  - [ ] Check user has access to location
  - [ ] Check period is open
  - [ ] Start database transaction
  - [ ] Create delivery record
  - [ ] Process each delivery line:
    - [ ] Check price variance against period price
    - [ ] Create auto-NCR if variance detected
    - [ ] Update location stock (quantity)
    - [ ] Recalculate WAC
  - [ ] Commit transaction
  - [ ] Return delivery with variance info
- [ ] Create `server/api/deliveries/[id].get.ts`
  - [ ] Fetch single delivery by ID
  - [ ] Include lines and NCRs
  - [ ] Return delivery details
- [ ] Test delivery API routes with price variance scenarios

### 1.7.4 Deliveries List Page

- [ ] Create `pages/deliveries/index.vue`
- [ ] Display deliveries table
  - [ ] Delivery No, Date, Supplier, Invoice No, Total, Has Variance
- [ ] Implement filters
  - [ ] Date range
  - [ ] Supplier
  - [ ] Has variance (checkbox)
- [ ] Add "New Delivery" button
- [ ] Implement pagination
- [ ] Add row click to view details
- [ ] Style with brand colors
- [ ] Test deliveries list

### 1.7.5 Create Delivery UI

- [ ] Create `pages/deliveries/create.vue`
- [ ] Design delivery form
  - [ ] Supplier dropdown
  - [ ] PO selection (optional)
  - [ ] Invoice number input
  - [ ] Delivery note input
  - [ ] Delivery date picker
- [ ] Implement delivery lines table
  - [ ] Item selection dropdown
  - [ ] Quantity input
  - [ ] Unit price input
  - [ ] Line value (auto-calculated)
  - [ ] Add/Remove line buttons
- [ ] Show total amount (auto-calculated)
- [ ] Show price variance warnings inline
  - [ ] Highlight lines with price variance
  - [ ] Show expected vs actual price
- [ ] Implement form validation
- [ ] Implement submit handler
  - [ ] Call API to post delivery
  - [ ] Handle success (show NCR info if created)
  - [ ] Handle errors
- [ ] Test delivery creation

### 1.7.6 Delivery Detail Page

- [ ] Create `pages/deliveries/[id].vue`
- [ ] Display delivery header
  - [ ] Delivery No, Date, Supplier, Invoice
- [ ] Display delivery lines table
  - [ ] Item, Quantity, Unit Price, Period Price, Variance, Value
  - [ ] Highlight lines with variance
- [ ] Display auto-generated NCRs
  - [ ] Link to NCR details
- [ ] Add "Print" button (optional for MVP)
- [ ] Test delivery details

### 1.7.7 Components

- [ ] Create `components/delivery/DeliveryForm.vue`
  - [ ] Reusable delivery form component
- [ ] Create `components/delivery/DeliveryLineInput.vue`
  - [ ] Single line input with price variance check
- [ ] Create `components/delivery/PriceVarianceAlert.vue`
  - [ ] Alert component for price variance warnings
- [ ] Test components

---

## Phase 1.8: Issues & Stock Validation (Days 10-12)

### 1.8.1 Issue API Routes

- [ ] Create `server/api/locations/[locationId]/issues/index.get.ts`
  - [ ] Fetch issues for location
  - [ ] Filter by period, date range, cost centre
  - [ ] Include issue lines
  - [ ] Return issues list
- [ ] Create `server/api/locations/[locationId]/issues/index.post.ts`
  - [ ] Validate issue data (Zod)
  - [ ] Check user has access to location
  - [ ] Check period is open
  - [ ] Start database transaction
  - [ ] Validate sufficient stock for each line
    - [ ] Check on_hand >= quantity
    - [ ] Throw error if insufficient stock
  - [ ] Create issue record
  - [ ] Process each issue line:
    - [ ] Get current WAC
    - [ ] Calculate line value (qty × WAC)
    - [ ] Deduct from location stock
  - [ ] Commit transaction
  - [ ] Return created issue
- [ ] Create `server/api/issues/[id].get.ts`
  - [ ] Fetch single issue by ID
  - [ ] Include lines
  - [ ] Return issue details
- [ ] Test issue API routes with stock validation

### 1.8.2 Stock Validation Utility

- [ ] Create `server/utils/stockValidation.ts`
- [ ] Implement stock check function
  ```typescript
  validateSufficientStock(locationId, itemId, quantity): Promise<boolean>
  ```
- [ ] Implement error response for insufficient stock
  - [ ] Include item name, requested qty, available qty
- [ ] Test stock validation

### 1.8.3 Issues List Page

- [ ] Create `pages/issues/index.vue`
- [ ] Display issues table
  - [ ] Issue No, Date, Cost Centre, Total Value
- [ ] Implement filters
  - [ ] Date range
  - [ ] Cost centre (FOOD/CLEAN/OTHER)
- [ ] Add "New Issue" button
- [ ] Implement pagination
- [ ] Add row click to view details
- [ ] Test issues list

### 1.8.4 Create Issue UI

- [ ] Create `pages/issues/create.vue`
- [ ] Design issue form
  - [ ] Issue date picker
  - [ ] Cost centre dropdown (FOOD/CLEAN/OTHER)
  - [ ] Location display (current location)
- [ ] Implement issue lines table
  - [ ] Item selection dropdown
  - [ ] Show current on-hand quantity
  - [ ] Quantity input with validation
  - [ ] WAC display (read-only)
  - [ ] Line value (auto-calculated)
  - [ ] Add/Remove line buttons
- [ ] Show total value (auto-calculated)
- [ ] Implement real-time stock check
  - [ ] Show warning if quantity > on-hand
  - [ ] Disable submit if any line exceeds stock
- [ ] Implement form validation
- [ ] Implement submit handler
  - [ ] Call API to post issue
  - [ ] Handle success (redirect to issues list)
  - [ ] Handle errors (show insufficient stock message)
- [ ] Test issue creation

### 1.8.5 Issue Detail Page

- [ ] Create `pages/issues/[id].vue`
- [ ] Display issue header
  - [ ] Issue No, Date, Cost Centre, Location
- [ ] Display issue lines table
  - [ ] Item, Quantity, WAC, Value
- [ ] Display total value
- [ ] Add "Print" button (optional for MVP)
- [ ] Test issue details

### 1.8.6 Components

- [ ] Create `components/issue/IssueForm.vue`
  - [ ] Reusable issue form component
- [ ] Create `components/issue/IssueLineInput.vue`
  - [ ] Single line input with stock validation
  - [ ] Show on-hand quantity
  - [ ] Real-time validation feedback
- [ ] Create `components/common/StockAlert.vue`
  - [ ] Alert for insufficient stock
- [ ] Test components

---

## Phase 1.9: Stock Now & Dashboard (Day 12)

### 1.9.1 Stock Now API

- [ ] Create `server/api/locations/[locationId]/stock.get.ts`
  - [ ] Fetch location stock with item details
  - [ ] Calculate total value
  - [ ] Support filters (category, low stock)
  - [ ] Return stock list
- [ ] Create `server/api/stock/consolidated.get.ts`
  - [ ] Fetch stock across all locations
  - [ ] Aggregate totals
  - [ ] Return consolidated view (supervisor/admin only)
- [ ] Test stock API routes

### 1.9.2 Stock Now Page

- [ ] Create `pages/stock-now.vue`
- [ ] Display stock table
  - [ ] Item Code, Name, Unit, Category
  - [ ] On-Hand, WAC, Total Value
- [ ] Show total inventory value
- [ ] Implement filters
  - [ ] Category dropdown
  - [ ] Low stock toggle
  - [ ] Search by item name/code
- [ ] Add location selector (for supervisors/admins)
- [ ] Implement export to CSV (optional)
- [ ] Style with brand colors
- [ ] Test stock now page

### 1.9.3 Dashboard API

- [ ] Create `server/api/locations/[locationId]/dashboard.get.ts`
  - [ ] Fetch period totals for location
    - [ ] Total receipts
    - [ ] Total issues
    - [ ] Total mandays
    - [ ] Days left in period
  - [ ] Fetch recent deliveries (last 5)
  - [ ] Fetch recent issues (last 5)
  - [ ] Return dashboard data
- [ ] Test dashboard API

### 1.9.4 Dashboard Page

- [ ] Create `pages/index.vue` (dashboard)
- [ ] Design dashboard layout
  - [ ] 4 metric cards at top (receipts, issues, mandays, days left)
  - [ ] Recent deliveries section
  - [ ] Recent issues section
  - [ ] Quick actions (buttons to common pages)
- [ ] Implement metric cards
  - [ ] Use brand colors (navy, emerald)
  - [ ] Display values with SAR formatting
  - [ ] Add icons
- [ ] Implement recent activity lists
  - [ ] Deliveries: No, Date, Supplier, Amount
  - [ ] Issues: No, Date, Cost Centre, Amount
  - [ ] Click to view details
- [ ] Add location selector (for multi-location users)
- [ ] Add period indicator
- [ ] Test dashboard

### 1.9.5 Dashboard Components

- [ ] Create `components/dashboard/MetricCard.vue`
  - [ ] Reusable metric card with icon, label, value
- [ ] Create `components/dashboard/RecentActivity.vue`
  - [ ] List of recent transactions
- [ ] Test components

---

# Slice 2: Transfers & Controls (10 days)

## Phase 2.1: Transfer Management (Days 13-15)

### 2.1.1 Transfer API Routes

- [ ] Create `server/api/transfers/index.get.ts`
  - [ ] Fetch transfers with filters
  - [ ] Filter by location (from/to), status, date
  - [ ] Include transfer lines
  - [ ] Return transfers list
- [ ] Create `server/api/transfers/index.post.ts`
  - [ ] Validate transfer data (Zod)
  - [ ] Check user permissions
  - [ ] Validate source location has sufficient stock
  - [ ] Create transfer in PENDING_APPROVAL status
  - [ ] Return created transfer
- [ ] Create `server/api/transfers/[id].get.ts`
  - [ ] Fetch single transfer by ID
  - [ ] Include lines
  - [ ] Return transfer details
- [ ] Create `server/api/transfers/[id]/approve.patch.ts`
  - [ ] Check user is supervisor or admin
  - [ ] Start database transaction
  - [ ] For each transfer line:
    - [ ] Deduct from source location stock
    - [ ] Add to destination location stock (at source WAC)
  - [ ] Update transfer status to COMPLETED
  - [ ] Commit transaction
  - [ ] Return updated transfer
- [ ] Create `server/api/transfers/[id]/reject.patch.ts`
  - [ ] Check user is supervisor or admin
  - [ ] Update transfer status to REJECTED
  - [ ] Add rejection comment
  - [ ] Return updated transfer
- [ ] Test transfer API routes

### 2.1.2 Transfers List Page

- [ ] Create `pages/transfers/index.vue`
- [ ] Display transfers table
  - [ ] Transfer No, Date, From Location, To Location, Status, Total Value
- [ ] Implement filters
  - [ ] Status dropdown
  - [ ] Date range
  - [ ] From/To location
- [ ] Show status badges (use brand colors)
  - [ ] Pending: navy
  - [ ] Approved: emerald
  - [ ] Rejected: red
- [ ] Add "New Transfer" button
- [ ] Add row click to view details
- [ ] Test transfers list

### 2.1.3 Create Transfer UI

- [ ] Create `pages/transfers/create.vue`
- [ ] Design transfer form
  - [ ] From location dropdown (user locations only)
  - [ ] To location dropdown (exclude from location)
  - [ ] Transfer date picker
  - [ ] Notes textarea
- [ ] Implement transfer lines table
  - [ ] Item selection dropdown
  - [ ] Show source location on-hand
  - [ ] Quantity input with validation
  - [ ] WAC display
  - [ ] Line value (auto-calculated)
  - [ ] Add/Remove line buttons
- [ ] Show total value (auto-calculated)
- [ ] Implement stock validation
  - [ ] Check quantity <= source on-hand
  - [ ] Show warnings
- [ ] Implement submit handler
  - [ ] Call API to create transfer
  - [ ] Handle success (redirect to transfers list)
  - [ ] Handle errors
- [ ] Test transfer creation

### 2.1.4 Transfer Detail & Approval

- [ ] Create `pages/transfers/[id].vue`
- [ ] Display transfer header
  - [ ] Transfer No, Date, Status
  - [ ] From/To locations
  - [ ] Requested by
- [ ] Display transfer lines table
  - [ ] Item, Quantity, WAC, Value
- [ ] Display total value
- [ ] Show approval section (supervisor/admin only)
  - [ ] Approve button (emerald)
  - [ ] Reject button (red)
  - [ ] Comments textarea
- [ ] Implement approve handler
  - [ ] Call approve API
  - [ ] Show success message
  - [ ] Refresh transfer data
- [ ] Implement reject handler
  - [ ] Call reject API
  - [ ] Show success message
  - [ ] Refresh transfer data
- [ ] Test transfer approval flow

### 2.1.5 Transfer Components

- [ ] Create `components/transfer/TransferForm.vue`
  - [ ] Reusable transfer form
- [ ] Create `components/transfer/TransferStatusBadge.vue`
  - [ ] Status badge with appropriate colors
- [ ] Create `components/transfer/ApprovalActions.vue`
  - [ ] Approve/Reject buttons with modal confirmation
- [ ] Test components

---

## Phase 2.2: NCR Management (Days 15-17)

### 2.2.1 NCR API Routes

- [ ] Create `server/api/ncrs/index.get.ts`
  - [ ] Fetch NCRs with filters
  - [ ] Filter by location, type, status, date
  - [ ] Return NCRs list
- [ ] Create `server/api/ncrs/index.post.ts`
  - [ ] Validate NCR data (Zod)
  - [ ] Check user permissions
  - [ ] Create manual NCR
  - [ ] Link to delivery if provided
  - [ ] Return created NCR
- [ ] Create `server/api/ncrs/[id].get.ts`
  - [ ] Fetch single NCR by ID
  - [ ] Include related delivery/line info
  - [ ] Return NCR details
- [ ] Create `server/api/ncrs/[id].patch.ts`
  - [ ] Update NCR status
  - [ ] Add resolution notes
  - [ ] Return updated NCR
- [ ] Test NCR API routes

### 2.2.2 NCRs List Page

- [ ] Create `pages/ncrs/index.vue`
- [ ] Display NCRs table
  - [ ] NCR No, Type, Date, Location, Reason, Value, Status
- [ ] Implement filters
  - [ ] Type (MANUAL/PRICE_VARIANCE)
  - [ ] Status dropdown
  - [ ] Location dropdown
  - [ ] Auto-generated checkbox
- [ ] Show status badges (brand colors)
- [ ] Add "New NCR" button (manual)
- [ ] Add row click to view details
- [ ] Test NCRs list

### 2.2.3 Create Manual NCR

- [ ] Create `pages/ncrs/create.vue`
- [ ] Design NCR form
  - [ ] Location dropdown
  - [ ] Delivery selection (optional)
  - [ ] Reason textarea
  - [ ] Lines table
    - [ ] Item selection
    - [ ] Quantity
    - [ ] Value
- [ ] Implement submit handler
- [ ] Test manual NCR creation

### 2.2.4 NCR Detail Page

- [ ] Create `pages/ncrs/[id].vue`
- [ ] Display NCR header
  - [ ] NCR No, Type, Date, Location
  - [ ] Status badge
- [ ] Display NCR details
  - [ ] Reason
  - [ ] Related delivery (if auto-generated)
  - [ ] Item lines
  - [ ] Total value
- [ ] Show status update section
  - [ ] Status dropdown (OPEN → SENT → CREDITED/REJECTED)
  - [ ] Resolution notes
  - [ ] Update button
- [ ] Implement status update handler
- [ ] Test NCR details and updates

### 2.2.5 Auto-Generated Price Variance NCRs

- [ ] Verify auto-NCR creation in delivery posting
- [ ] Test price variance NCR flow end-to-end
  - [ ] Post delivery with different price
  - [ ] Verify NCR created automatically
  - [ ] Check NCR appears in list
  - [ ] Verify type = PRICE_VARIANCE
  - [ ] Verify auto_generated = true
- [ ] Test price variance NCR display in UI
  - [ ] Show in delivery details
  - [ ] Link to NCR detail page

---

## Phase 2.3: POB Entry (Days 17-18)

### 2.3.1 POB API Routes

- [ ] Create `server/api/locations/[locationId]/pob.get.ts`
  - [ ] Fetch POB entries for location and period
  - [ ] Return daily entries
- [ ] Create `server/api/locations/[locationId]/pob.post.ts`
  - [ ] Validate POB data (Zod)
  - [ ] Bulk create/update daily entries
  - [ ] Return updated entries
- [ ] Create `server/api/pob/[id].patch.ts`
  - [ ] Update single POB entry
  - [ ] Return updated entry
- [ ] Test POB API routes

### 2.3.2 POB Page UI

- [ ] Create `pages/pob.vue`
- [ ] Design POB entry interface
  - [ ] Calendar view or date range selector
  - [ ] Table with dates in current period
  - [ ] Columns: Date, Crew Count, Extra Count, Total (calculated)
  - [ ] Editable cells for crew and extra
- [ ] Implement POB entry
  - [ ] Inline editing
  - [ ] Auto-save on blur (or Save button)
  - [ ] Validation (non-negative integers)
- [ ] Show period total mandays
- [ ] Style with brand colors
- [ ] Test POB entry

### 2.3.3 POB Components

- [ ] Create `components/pob/POBTable.vue`
  - [ ] Editable POB table
- [ ] Create `components/pob/POBSummary.vue`
  - [ ] Display total mandays for period
- [ ] Test components

---

## Phase 2.4: Reconciliations (Days 18-20)

### 2.4.1 Reconciliation Calculation Utility

- [ ] Create `server/utils/reconciliation.ts`
- [ ] Implement reconciliation calculation
  ```typescript
  calculateConsumption(opening, receipts, transfersIn, transfersOut, issues, closing, adjustments, ...): number
  ```
- [ ] Implement manday cost calculation
  ```typescript
  calculateMandayCost(consumption, totalMandays): number
  ```
- [ ] Test calculations

### 2.4.2 Reconciliation API Routes

- [ ] Create `server/api/locations/[locationId]/reconciliations/[periodId].get.ts`
  - [ ] Fetch reconciliation for location and period
  - [ ] Auto-calculate if not exists:
    - [ ] Opening stock (from previous period)
    - [ ] Receipts (sum deliveries)
    - [ ] Transfers in/out (sum transfers)
    - [ ] Issues (sum issues)
    - [ ] Closing stock (from Stock Now)
  - [ ] Return reconciliation
- [ ] Create `server/api/locations/[locationId]/reconciliations/[periodId].patch.ts`
  - [ ] Validate reconciliation data (Zod)
  - [ ] Check user is supervisor or admin
  - [ ] Update adjustments:
    - [ ] Back-charges
    - [ ] Credits
    - [ ] Condemnations
    - [ ] Others
  - [ ] Recalculate consumption and manday cost
  - [ ] Return updated reconciliation
- [ ] Create `server/api/reconciliations/consolidated.get.ts`
  - [ ] Fetch reconciliations for all locations in period
  - [ ] Aggregate totals
  - [ ] Return consolidated view (supervisor/admin only)
- [ ] Test reconciliation API routes

### 2.4.3 Reconciliations Page

- [ ] Create `pages/reconciliations.vue`
- [ ] Display reconciliation for current location and period
- [ ] Show calculated values (read-only)
  - [ ] Opening Stock
  - [ ] Receipts
  - [ ] Transfers In
  - [ ] Transfers Out
  - [ ] Issues
  - [ ] Closing Stock
- [ ] Show editable adjustment fields
  - [ ] Back-charges
  - [ ] Credits Due
  - [ ] Condemnations
  - [ ] Others
- [ ] Show calculated results
  - [ ] Consumption
  - [ ] Total Mandays (from POB)
  - [ ] Manday Cost
- [ ] Implement save handler
- [ ] Show location selector (supervisor/admin)
- [ ] Style with brand colors
- [ ] Test reconciliations page

### 2.4.4 Consolidated Reconciliation View

- [ ] Create `pages/reconciliations/consolidated.vue` (supervisor/admin only)
- [ ] Display reconciliations for all locations
- [ ] Show totals per location
- [ ] Show grand totals
- [ ] Implement export to CSV (optional)
- [ ] Test consolidated view

### 2.4.5 Reconciliation Components

- [ ] Create `components/reconciliation/ReconciliationSummary.vue`
  - [ ] Display reconciliation breakdown
- [ ] Create `components/reconciliation/AdjustmentsForm.vue`
  - [ ] Form for entering adjustments
- [ ] Test components

---

## Phase 2.5: Slice 2 Testing & Polish (Days 20-22)

### 2.5.1 Integration Testing

- [ ] Test complete transfer flow
  - [ ] Create transfer
  - [ ] Approve transfer
  - [ ] Verify stock updates in both locations
- [ ] Test complete NCR flow
  - [ ] Manual NCR creation
  - [ ] Auto-NCR from price variance
  - [ ] Status updates
- [ ] Test POB entry and usage in reconciliations
- [ ] Test reconciliation calculations with real data
- [ ] Test consolidated views

### 2.5.2 UI/UX Refinements

- [ ] Review all forms for consistency
- [ ] Ensure brand colors used consistently
- [ ] Test responsive design on mobile
- [ ] Add loading states to all async operations
- [ ] Improve error messages
- [ ] Add success confirmations

### 2.5.3 Performance Optimization

- [ ] Optimize database queries (add indexes if needed)
- [ ] Implement pagination where missing
- [ ] Add caching for frequently accessed data
- [ ] Test API response times

---

# Slice 3: Period Management (8 days)

## Phase 3.1: Period Lifecycle (Days 23-25)

### 3.1.1 Period API Routes

- [ ] Create `server/api/periods/index.get.ts`
  - [ ] Fetch all periods
  - [ ] Filter by status, date range
  - [ ] Return periods list
- [ ] Create `server/api/periods/current.get.ts`
  - [ ] Fetch current open period
  - [ ] Include location readiness status
  - [ ] Return current period
- [ ] Create `server/api/periods/index.post.ts`
  - [ ] Validate period data (Zod)
  - [ ] Check admin role
  - [ ] Create new period
  - [ ] Create PeriodLocation entries for all locations
  - [ ] Return created period
- [ ] Create `server/api/periods/[id].get.ts`
  - [ ] Fetch single period by ID
  - [ ] Include location statuses
  - [ ] Return period details
- [ ] Test period API routes

### 3.1.2 Period Opening

- [ ] Implement period opening logic
  - [ ] Set start and end dates
  - [ ] Create PeriodLocation entries
  - [ ] Copy closing stock from previous period as opening stock
  - [ ] Set status to OPEN
- [ ] Create UI for period creation (admin only)
  - [ ] Form with start/end dates
  - [ ] Submit handler
- [ ] Test period opening

### 3.1.3 Period Price Setting

- [ ] Create workflow for setting period prices at start
- [ ] Allow admin to bulk set prices from previous period
- [ ] Allow admin to update prices before period starts
- [ ] Lock prices once period opens
- [ ] Test price locking

---

## Phase 3.2: Period Close Workflow (Days 25-27)

### 3.2.1 Location Readiness Tracking

- [ ] Create `server/api/periods/[periodId]/locations/[locationId]/ready.patch.ts`
  - [ ] Check user is supervisor or admin
  - [ ] Check reconciliation completed
  - [ ] Update PeriodLocation status to READY
  - [ ] Return updated status
- [ ] Test location readiness API

### 3.2.2 Period Close API

- [ ] Create `server/api/periods/[periodId]/close.post.ts`
  - [ ] Check admin role
  - [ ] Validate all locations are READY
  - [ ] Create approval request
  - [ ] Return approval ID
- [ ] Create `server/api/approvals/[id]/approve.patch.ts`
  - [ ] Check admin role
  - [ ] Execute period close:
    - [ ] Start database transaction
    - [ ] For each location:
      - [ ] Create snapshot of current stock
      - [ ] Update PeriodLocation status to CLOSED
      - [ ] Set closing_value
    - [ ] Update Period status to CLOSED
    - [ ] Commit transaction
  - [ ] Return approval confirmation
- [ ] Test period close API

### 3.2.3 Snapshot Creation

- [ ] Implement snapshot logic
  - [ ] Capture all location stock levels
  - [ ] Save reconciliation final values
  - [ ] Store as JSON in PeriodLocation
- [ ] Test snapshot creation

### 3.2.4 Roll Forward to Next Period

- [ ] Implement roll forward logic
  - [ ] Create next period automatically
  - [ ] Copy closing stock as opening stock
  - [ ] Reset reconciliation values
  - [ ] Copy period prices (or allow update)
- [ ] Test roll forward

---

## Phase 3.3: Period Close UI (Days 27-28)

### 3.3.1 Period Close Page

- [ ] Create `pages/period-close.vue` (admin only)
- [ ] Display current period info
- [ ] Show checklist
  - [ ] All deliveries posted
  - [ ] All issues posted
  - [ ] All transfers completed
  - [ ] Reconciliations completed for all locations
  - [ ] All locations marked ready
- [ ] Show location readiness status
  - [ ] Table with location, status, ready date
  - [ ] "Mark Ready" button per location (if not ready)
- [ ] Show "Close Period" button
  - [ ] Enabled only if all locations ready
  - [ ] Confirmation modal
- [ ] Implement close handler
  - [ ] Request approval
  - [ ] Approve (admin)
  - [ ] Execute close
  - [ ] Show success message
- [ ] Style with brand colors
- [ ] Test period close UI

### 3.3.2 Approval Components

- [ ] Create `components/approval/ApprovalRequest.vue`
  - [ ] Display approval request details
  - [ ] Approve/Reject buttons
- [ ] Create `components/approval/ApprovalStatus.vue`
  - [ ] Display approval status badge
- [ ] Test approval components

---

## Phase 3.4: Reporting & Exports (Days 28-30)

### 3.4.1 Report API Routes

- [ ] Create `server/api/reports/stock-now.get.ts`
  - [ ] Generate stock report
  - [ ] Filter by location, category
  - [ ] Return formatted data
- [ ] Create `server/api/reports/reconciliation.get.ts`
  - [ ] Generate reconciliation report
  - [ ] Filter by period, location
  - [ ] Return formatted data
- [ ] Create `server/api/reports/deliveries.get.ts`
  - [ ] Generate deliveries report
  - [ ] Filter by period, location, supplier
  - [ ] Return formatted data
- [ ] Create `server/api/reports/issues.get.ts`
  - [ ] Generate issues report
  - [ ] Filter by period, location, cost centre
  - [ ] Return formatted data
- [ ] Test report API routes

### 3.4.2 Report Pages

- [ ] Create `pages/reports/index.vue`
  - [ ] List available reports
  - [ ] Links to each report page
- [ ] Create `pages/reports/stock-now.vue`
  - [ ] Display stock report
  - [ ] Implement filters
  - [ ] Add export button (CSV)
- [ ] Create `pages/reports/reconciliation.vue`
  - [ ] Display reconciliation report
  - [ ] Implement filters
  - [ ] Add export button
- [ ] Test report pages

### 3.4.3 CSV Export Utility

- [ ] Create `utils/csvExport.ts`
- [ ] Implement CSV generation function
- [ ] Implement download trigger
- [ ] Test CSV export

---

# Slice 4: Polish & Performance (5 days)

## Phase 4.1: PWA Implementation (Days 31-32)

### 4.1.1 PWA Module Setup

- [ ] Install `@vite-pwa/nuxt` module (already done)
- [ ] Configure PWA in `nuxt.config.ts`
  - [ ] Manifest settings
  - [ ] Service worker options
  - [ ] Workbox configuration
- [ ] Test PWA configuration

### 4.1.2 App Icons

- [ ] Design app icon (192x192 and 512x512)
  - [ ] Use navy blue background (#000046)
  - [ ] Use emerald green or white for icon/text
  - [ ] Simple, recognizable design
- [ ] Create `public/icon-192.png`
- [ ] Create `public/icon-512.png`
- [ ] Create `public/favicon.ico`
- [ ] Test icons in manifest

### 4.1.3 Offline Detection

- [ ] Create `composables/useOnlineStatus.ts`
  - [ ] Detect online/offline state
  - [ ] Listen to connection events
- [ ] Create `components/OfflineBanner.vue`
  - [ ] Show banner when offline
  - [ ] Show reconnect message
- [ ] Add OfflineBanner to app layout
- [ ] Test offline detection

### 4.1.4 Offline Guards

- [ ] Create `composables/useOfflineGuard.ts`
  - [ ] Guard action wrapper
  - [ ] Show toast when offline
- [ ] Apply offline guards to form submissions
  - [ ] Delivery posting
  - [ ] Issue posting
  - [ ] Transfer creation
  - [ ] Period close
- [ ] Disable buttons when offline
- [ ] Test offline guards

### 4.1.5 PWA Testing

- [ ] Test service worker registration
- [ ] Test app installation (desktop)
- [ ] Test app installation (mobile Android)
- [ ] Test app installation (mobile iOS)
- [ ] Test offline behavior
- [ ] Test cache updates
- [ ] Document PWA testing results

---

## Phase 4.2: UI/UX Polish (Day 32)

### 4.2.1 Consistent Styling

- [ ] Audit all pages for brand color usage
  - [ ] Ensure navy blue for primary elements
  - [ ] Ensure emerald green for success/secondary
- [ ] Ensure consistent spacing and padding
- [ ] Ensure consistent typography
- [ ] Ensure consistent button styles
- [ ] Ensure consistent form styles

### 4.2.2 Loading States

- [ ] Add loading spinners to all async operations
- [ ] Add skeleton loaders for tables
- [ ] Add progress indicators for multi-step processes
- [ ] Test loading states

### 4.2.3 Error Handling

- [ ] Review all error messages for clarity
- [ ] Ensure errors displayed consistently
- [ ] Add helpful error suggestions
- [ ] Test error scenarios

### 4.2.4 Empty States

- [ ] Add empty states to all lists
  - [ ] Deliveries list
  - [ ] Issues list
  - [ ] Transfers list
  - [ ] NCRs list
  - [ ] Items list
- [ ] Include helpful text and action buttons
- [ ] Test empty states

### 4.2.5 Responsive Design

- [ ] Test all pages on mobile (320px - 768px)
- [ ] Test all pages on tablet (768px - 1024px)
- [ ] Test all pages on desktop (1024px+)
- [ ] Fix any layout issues
- [ ] Test navigation on mobile

### 4.2.6 Accessibility

- [ ] Test keyboard navigation
- [ ] Add proper ARIA labels
- [ ] Ensure sufficient color contrast
- [ ] Test with screen reader (basic)
- [ ] Fix accessibility issues

---

## Phase 4.3: Performance Optimization (Day 33)

### 4.3.1 Database Optimization

- [ ] Review Prisma queries for N+1 issues
- [ ] Add database indexes where needed
- [ ] Optimize complex queries
- [ ] Test query performance

### 4.3.2 API Response Time

- [ ] Measure API response times
- [ ] Optimize slow endpoints
- [ ] Add caching where appropriate
- [ ] Ensure < 1s for standard operations

### 4.3.3 Frontend Performance

- [ ] Implement lazy loading for routes
- [ ] Optimize image sizes (icons, logos)
- [ ] Minimize bundle size
- [ ] Test page load times
- [ ] Test lighthouse scores

### 4.3.4 Data Caching

- [ ] Cache location list (client-side)
- [ ] Cache item master (client-side)
- [ ] Cache current period (client-side)
- [ ] Implement cache invalidation
- [ ] Test caching

---

## Phase 4.4: Testing (Days 33-34)

### 4.4.1 Unit Tests

- [ ] Write tests for WAC calculation
- [ ] Write tests for reconciliation calculation
- [ ] Write tests for stock validation
- [ ] Write tests for price variance detection
- [ ] Run all unit tests
- [ ] Aim for > 80% coverage on business logic

### 4.4.2 API Tests

- [ ] Write tests for critical endpoints
  - [ ] POST /api/locations/[id]/deliveries
  - [ ] POST /api/locations/[id]/issues
  - [ ] POST /api/transfers
  - [ ] PATCH /api/transfers/[id]/approve
  - [ ] POST /api/periods/[id]/close
- [ ] Test error scenarios
- [ ] Test validation errors
- [ ] Run all API tests

### 4.4.3 Integration Testing

- [ ] Test complete user journeys
  - [ ] Create delivery → Auto-NCR generation
  - [ ] Create issue → Stock deduction
  - [ ] Create transfer → Approval → Stock movement
  - [ ] Period close workflow
- [ ] Test multi-location scenarios
- [ ] Test concurrent operations

### 4.4.4 Manual Testing

- [ ] Complete manual test plan
- [ ] Test all user roles (Operator, Supervisor, Admin)
- [ ] Test all features end-to-end
- [ ] Document any bugs found
- [ ] Fix critical bugs

---

## Phase 4.5: Documentation & Training Materials (Day 34)

### 4.5.1 Developer Documentation

- [ ] Update README.md
  - [ ] Project overview
  - [ ] Setup instructions
  - [ ] Development workflow
  - [ ] Tech stack summary
- [ ] Document environment variables
- [ ] Document database schema
- [ ] Document API endpoints
- [ ] Document deployment process

### 4.5.2 User Documentation

- [ ] Create user manual (reference Workflow_Guide.md)
  - [ ] Overview
  - [ ] Role-specific instructions
  - [ ] Page-by-page guide
  - [ ] Common workflows
- [ ] Create quick reference card (1-page)
  - [ ] Key actions
  - [ ] Important rules
  - [ ] Support contacts
- [ ] Create FAQ document
  - [ ] Common questions
  - [ ] Troubleshooting

### 4.5.3 Training Materials

- [ ] Create training presentation
  - [ ] System overview (15 min)
  - [ ] Operator training (30 min)
  - [ ] Supervisor training (45 min)
  - [ ] Admin training (60 min)
- [ ] Record video walkthrough (optional)
- [ ] Create practice scenarios

### 4.5.4 Operational Documentation

- [ ] Document backup procedures
- [ ] Document monitoring setup
- [ ] Document incident response plan
- [ ] Document user onboarding process
- [ ] Document support escalation

---

## Phase 4.6: Pre-Launch Preparation (Day 35)

### 4.6.1 Deployment Setup

- [ ] Set up Vercel project
- [ ] Configure environment variables in Vercel
- [ ] Set up Supabase production database
- [ ] Run database migrations on production
- [ ] Test deployment pipeline

### 4.6.2 Production Testing

- [ ] Deploy to production
- [ ] Test all features on production
- [ ] Test PWA installation on production
- [ ] Test performance on production
- [ ] Test on real mobile devices

### 4.6.3 Data Seeding

- [ ] Create production seed data
  - [ ] Admin user
  - [ ] Pilot locations
  - [ ] Item master
  - [ ] Suppliers
  - [ ] First period
- [ ] Run seed scripts
- [ ] Verify data in production

### 4.6.4 User Setup

- [ ] Create user accounts for pilot
  - [ ] Operators
  - [ ] Supervisors
  - [ ] Admins
- [ ] Assign users to locations
- [ ] Set up user permissions
- [ ] Send welcome emails with credentials

### 4.6.5 Monitoring & Alerts

- [ ] Set up Vercel monitoring
- [ ] Set up Supabase monitoring
- [ ] Configure error tracking (Sentry - optional)
- [ ] Set up uptime monitoring
- [ ] Test alert notifications

### 4.6.6 Final Checklist

- [ ] All features working in production
- [ ] All users created and tested
- [ ] Documentation complete
- [ ] Training materials ready
- [ ] Support process defined
- [ ] Backup confirmed working
- [ ] Go/No-Go decision meeting

---

# Post-Development: UAT & Launch (5 days)

## Phase 5.1: User Acceptance Testing (Days 36-38)

### 5.1.1 UAT Preparation

- [ ] Select pilot locations (2-3)
- [ ] Schedule UAT sessions
- [ ] Prepare UAT test scripts
- [ ] Set up UAT environment
- [ ] Brief UAT participants

### 5.1.2 UAT Execution

- [ ] Conduct Operator UAT
  - [ ] Post deliveries
  - [ ] Post issues
  - [ ] Enter POB
  - [ ] View stock
- [ ] Conduct Supervisor UAT
  - [ ] Review reconciliations
  - [ ] Approve transfers
  - [ ] View reports
- [ ] Conduct Admin UAT
  - [ ] Manage items
  - [ ] Set period prices
  - [ ] Close period
- [ ] Collect feedback
- [ ] Log bugs and issues

### 5.1.3 UAT Bug Fixes

- [ ] Prioritize UAT bugs
- [ ] Fix critical bugs
- [ ] Fix high-priority bugs
- [ ] Retest fixed bugs
- [ ] Get UAT sign-off

---

## Phase 5.2: Training (Days 38-39)

### 5.2.1 Operator Training

- [ ] Schedule operator training sessions (30 min)
- [ ] Conduct hands-on training
  - [ ] Login
  - [ ] Post deliveries
  - [ ] Post issues
  - [ ] Enter POB
  - [ ] View stock
- [ ] Answer questions
- [ ] Distribute quick reference cards

### 5.2.2 Supervisor Training

- [ ] Schedule supervisor training sessions (45 min)
- [ ] Conduct hands-on training
  - [ ] All operator features
  - [ ] Approve transfers
  - [ ] Edit reconciliations
  - [ ] View reports
- [ ] Answer questions
- [ ] Distribute documentation

### 5.2.3 Admin Training

- [ ] Schedule admin training sessions (60 min)
- [ ] Conduct hands-on training
  - [ ] All supervisor features
  - [ ] Manage items and prices
  - [ ] Manage users
  - [ ] Close periods
  - [ ] System configuration
- [ ] Answer questions
- [ ] Distribute admin documentation

---

## Phase 5.3: Pilot Launch (Day 40)

### 5.3.1 Launch Preparation

- [ ] Final production verification
- [ ] Confirm all users ready
- [ ] Confirm pilot locations ready
- [ ] Brief support team
- [ ] Prepare communication

### 5.3.2 Launch Day

- [ ] Send launch announcement
- [ ] Open first period
- [ ] Set period prices
- [ ] Monitor system closely
- [ ] Provide on-site support (if possible)
- [ ] Respond to issues quickly

### 5.3.3 Post-Launch Monitoring

- [ ] Monitor system performance
- [ ] Monitor error logs
- [ ] Monitor user activity
- [ ] Collect user feedback
- [ ] Address issues promptly

---

## Phase 5.4: Pilot Period (Days 41-70)

### 5.4.1 Daily Monitoring

- [ ] Check system health daily
- [ ] Review error logs
- [ ] Monitor user activity
- [ ] Respond to support requests
- [ ] Log issues and feedback

### 5.4.2 Weekly Reviews

- [ ] Conduct weekly review meetings
- [ ] Review pilot metrics
  - [ ] Transaction volume
  - [ ] Error rates
  - [ ] User adoption
  - [ ] Performance
- [ ] Collect user feedback
- [ ] Prioritize improvements
- [ ] Plan bug fixes

### 5.4.3 End of Pilot Period

- [ ] Complete one full period (month)
- [ ] Conduct period close
- [ ] Verify reconciliations accurate
- [ ] Conduct pilot retrospective
- [ ] Gather lessons learned
- [ ] Make go/no-go decision for full rollout

---

## Phase 5.5: Full Rollout (Days 71+)

### 5.5.1 Rollout Planning

- [ ] Develop rollout schedule
- [ ] Identify remaining locations
- [ ] Plan training sessions
- [ ] Prepare communication

### 5.5.2 Phased Rollout

- [ ] Deploy to next batch of locations
- [ ] Conduct training
- [ ] Monitor closely
- [ ] Repeat until all locations live

### 5.5.3 Post-Rollout

- [ ] Transition to steady-state support
- [ ] Hand off to operations team
- [ ] Schedule regular maintenance
- [ ] Plan Phase 2 enhancements

---

# Appendix: Optional/Future Features

## Post-MVP Enhancements (Phase 2)

### Advanced Reporting

- [ ] Chart visualizations
- [ ] Trend analysis
- [ ] Predictive analytics
- [ ] Custom report builder

### Email Notifications

- [ ] Period close reminders
- [ ] Transfer approval requests
- [ ] Low stock alerts
- [ ] NCR status updates

### Excel Import/Export

- [ ] Import items from Excel
- [ ] Import deliveries from Excel
- [ ] Export reports to Excel
- [ ] Export data for analysis

### Advanced PWA Features

- [ ] Background sync for offline operations
- [ ] Push notifications
- [ ] IndexedDB for local caching
- [ ] Full offline mode

### Mobile Optimization

- [ ] Mobile-first redesign
- [ ] Native app wrapper
- [ ] Camera barcode scanning
- [ ] Touch-optimized UI

### Additional Features

- [ ] Multi-currency support
- [ ] FIFO costing option
- [ ] Partial period closes
- [ ] Complex transfer routing
- [ ] Supplier portal
- [ ] API for third-party integrations

---

# Task Tracking Guidelines

## How to Use This Checklist

1. **Start at the top** and work through tasks sequentially
2. **Mark tasks complete** by checking the box when done
3. **Add notes** inline if needed (use blockquotes or comments)
4. **Update progress summary** at the top regularly
5. **Skip optional tasks** marked as (optional) if not needed for MVP
6. **Report blockers** immediately if stuck on a task

## Task Status Indicators

- `[ ]` - Not started
- `[x]` - Completed
- `[~]` - In progress (use for current task)
- `[!]` - Blocked (needs attention)

## Notes Section (Add as needed)

Use this space to track:

- Decisions made
- Blockers encountered
- Questions to resolve
- Changes to scope

---

**End of MVP Development Tasks**

_Last Updated: November 4, 2025_
_Version: 1.0_
