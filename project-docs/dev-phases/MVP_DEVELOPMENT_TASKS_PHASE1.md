# MVP Development Tasks - Complete Checklist

**Project:** Stock Management System - Multi-Location
**Version:** 1.0

---

## Overview

This document contains a comprehensive, step-by-step task list for building the complete MVP of the Stock Management System. Tasks are organized by development slices as defined in [MVP.md](project-docs/MVP.md).

**Development Timeline:**

- **Slice 1:** Foundation & Locations
- **Slice 2:** Transfers & Controls
- **Slice 3:** Period Management
- **Slice 4:** Polish & Performance
- **Slice 5:** Post-Development: UAT & Launch

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

- [x] Create `pages/items/[id]/edit.vue`
- [x] Pre-fill form with existing item data
- [x] Allow editing all fields except code
- [x] Implement update handler
- [x] Handle success/error
- [x] Add "Deactivate" button (soft delete)
- [x] Test item editing

### 1.6.6 Item Price Setting UI

- [x] Create `pages/periods/[periodId]/prices.vue`
- [x] Display all items with current prices
- [x] Show: Item, Current Price, Period Price, Update
- [x] Allow bulk price update
  - [x] Editable price column
  - [x] "Save All" button
- [x] Show warning if prices differ from WAC
- [x] Implement price update handler
- [x] Handle success/error
- [x] Test price setting

### 1.6.7 Location Stock Display

- [x] Create `components/item/LocationStockTable.vue`
- [x] Display stock levels per location
  - [x] Location name
  - [x] On-Hand quantity
  - [x] WAC
  - [x] Total value
- [x] Implement on items detail page
- [x] Test stock display

---

## Phase 1.7: Deliveries with Price Variance (Days 8-10)

### 1.7.1 WAC Calculation Utility

- [x] Create `server/utils/wac.ts`
- [x] Implement WAC calculation function
  ```typescript
  calculateWAC(currentQty, currentWAC, receivedQty, receiptPrice): number
  ```
- [x] Add tests for WAC calculation
- [x] Document WAC formula

### 1.7.2 Price Variance Detection

- [x] Create `server/utils/priceVariance.ts`
- [x] Implement price variance check
  - [x] Compare delivery price to period price
  - [x] Calculate variance amount
  - [x] Determine if NCR needed (threshold check)
- [x] Implement auto-NCR creation logic
- [x] Test price variance detection

### 1.7.3 Delivery API Routes

- [x] Create `server/api/locations/[locationId]/deliveries/index.get.ts`
  - [x] Fetch deliveries for location
  - [x] Filter by period, supplier, date range
  - [x] Include delivery lines
  - [x] Return deliveries list
- [x] Create `server/api/locations/[locationId]/deliveries/index.post.ts`
  - [x] Validate delivery data (Zod)
  - [x] Check user has access to location
  - [x] Check period is open
  - [x] Start database transaction
  - [x] Create delivery record
  - [x] Process each delivery line:
    - [x] Check price variance against period price
    - [x] Create auto-NCR if variance detected
    - [x] Update location stock (quantity)
    - [x] Recalculate WAC
  - [x] Commit transaction
  - [x] Return delivery with variance info
- [x] Create `server/api/deliveries/[id].get.ts`
  - [x] Fetch single delivery by ID
  - [x] Include lines and NCRs
  - [x] Return delivery details
- [x] Test delivery API routes with price variance scenarios

### 1.7.4 Deliveries List Page

- [x] Create `pages/deliveries/index.vue`
- [x] Display deliveries table
  - [x] Delivery No, Date, Supplier, Invoice No, Total, Has Variance
- [x] Implement filters
  - [x] Date range
  - [x] Supplier
  - [x] Has variance (checkbox)
- [x] Add "New Delivery" button
- [x] Implement pagination
- [x] Add row click to view details
- [x] Style with brand colors
- [x] Test deliveries list

### 1.7.5 Create Delivery UI

- [x] Create `pages/deliveries/create.vue`
- [x] Design delivery form
  - [x] Supplier dropdown
  - [x] PO selection (optional)
  - [x] Invoice number input
  - [x] Delivery note input
  - [x] Delivery date picker
- [x] Implement delivery lines table
  - [x] Item selection dropdown
  - [x] Quantity input
  - [x] Unit price input
  - [x] Line value (auto-calculated)
  - [x] Add/Remove line buttons
- [x] Show total amount (auto-calculated)
- [x] Show price variance warnings inline
  - [x] Highlight lines with price variance
  - [x] Show expected vs actual price
- [x] Implement form validation
- [x] Implement submit handler
  - [x] Call API to post delivery
  - [x] Handle success (show NCR info if created)
  - [x] Handle errors
- [x] Test delivery creation

### 1.7.6 Delivery Detail Page

- [x] Create `pages/deliveries/[id].vue`
- [x] Display delivery header
  - [x] Delivery No, Date, Supplier, Invoice
- [x] Display delivery lines table
  - [x] Item, Quantity, Unit Price, Period Price, Variance, Value
  - [x] Highlight lines with variance
- [x] Display auto-generated NCRs
  - [x] Link to NCR details
- [x] Add "Print" button (optional for MVP)
- [x] Test delivery details

### 1.7.7 Components

- [x] Create `components/delivery/DeliveryForm.vue`
  - [x] Reusable delivery form component
- [x] Create `components/delivery/DeliveryLineInput.vue`
  - [x] Single line input with price variance check
- [x] Create `components/delivery/PriceVarianceAlert.vue`
  - [x] Alert component for price variance warnings
- [x] Test components

---

## Phase 1.8: Issues & Stock Validation (Days 10-12)

### 1.8.1 Issue API Routes

- [x] Create `server/api/locations/[locationId]/issues/index.get.ts`
  - [x] Fetch issues for location
  - [x] Filter by period, date range, cost centre
  - [x] Include issue lines
  - [x] Return issues list
- [x] Create `server/api/locations/[locationId]/issues/index.post.ts`
  - [x] Validate issue data (Zod)
  - [x] Check user has access to location
  - [x] Check period is open
  - [x] Start database transaction
  - [x] Validate sufficient stock for each line
    - [x] Check on_hand >= quantity
    - [x] Throw error if insufficient stock
  - [x] Create issue record
  - [x] Process each issue line:
    - [x] Get current WAC
    - [x] Calculate line value (qty × WAC)
    - [x] Deduct from location stock
  - [x] Commit transaction
  - [x] Return created issue
- [x] Create `server/api/issues/[id].get.ts`
  - [x] Fetch single issue by ID
  - [x] Include lines
  - [x] Return issue details
- [x] Test issue API routes with stock validation

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

# Task Tracking Guidelines

## How to Use This Checklist

1. **Start at the top** and work through tasks sequentially
2. **Mark tasks complete** by checking the box when done
3. **Add notes** inline if needed (use blockquotes or comments)
4. **Update progress summary** at the top regularly
5. **Skip optional tasks** marked as (optional) if not needed for MVP
6. **Report blockers** immediately if stuck on a task
