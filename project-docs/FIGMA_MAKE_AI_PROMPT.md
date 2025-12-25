### **INTRODUCTION & CONTEXT**

Design a complete, high-quality modern UI for a **Multi-Location Stock Management System** - an enterprise-grade inventory management web application that replaces Excel-based workflows. The app is built with Nuxt 4 (Vue 3) and deployed as a Progressive Web App (PWA).

**Target Users:** Inventory staff (Operators), Supervisors, and System Administrators managing stock across multiple warehouse/kitchen locations in the hospitality/catering industry.

**Design Philosophy:** Clean, professional, data-dense yet readable, with clear visual hierarchy. Think Stripe Dashboard meets Linear meets Notion - functional minimalism with premium polish.

---

### **BRAND CONSTRAINTS (MUST PRESERVE)**

**Colors:**

- **Primary Brand Color:** `#000046` (Deep Navy Blue) - Used for branding, headers, primary actions, navigation highlights
- **Secondary/Success Color:** `#45cf7b` (Vibrant Emerald Green) - Used for success states, positive metrics, confirmations, active states

**Additional Semantic Colors (Suggested):**

- Error/Danger: Modern coral red
- Warning: Warm amber
- Info: Soft blue
- Neutral: Slate/zinc grays

**Logo:** A pyramid of stacked emerald green (#45cf7b) boxes/cubes with white icons inside (grid patterns, checkmark, bar chart, upward arrow) - represents organized inventory. Keep this exact design.

**Layout to Preserve:**

- **Collapsible sidebar** (left) with navigation, logo at top, user profile at bottom
- **Top header bar** with page title, location switcher, period indicator, theme toggle, notifications, user menu
- **Main content area** (center/right) with responsive padding
- **Footer** with copyright and version

---

### **COMPLETE PAGE INVENTORY**

Design all of the following pages with consistent visual language:

#### **1. Authentication**

- **Login Page:** Clean, centered form with email/password, "Remember me", forgot password link. Show app logo prominently. Consider split-screen design with branded imagery.

#### **2. Dashboard (Home)**

- **Metric Cards (4):** Total Receipts (SAR), Total Issues (SAR), Total Mandays, Days Left in Period
- **Recent Activity Panels:** Recent Deliveries list, Recent Issues list with amounts
- **Quick Actions:** Prominent buttons for common tasks (New Delivery, New Issue, etc.)
- Show current location and period context prominently

#### **3. Stock Management**

**Stock Now (Real-time Inventory):**

- Toggle: Single Location View / Consolidated View (all locations)
- Data table: Item Code, Item Name, Category, On-Hand Qty, WAC, Total Value
- Filters: Search, category filter, low stock toggle
- Stock status badges: Healthy (green), Low (amber), Critical (red)
- Export to CSV button

**Items & Prices (Master Data):**

- List view with item cards or table
- Columns: Code, Name, Unit, Category, Current Stock, WAC, Value
- Filters: Search, Status (Active/Inactive/All)
- Admin actions: Create, Edit items
- Detail view with price history, stock across locations

**Item Create/Edit Forms:**

- Fields: Code, Name, Unit (KG/EA/LTR/BOX/CASE/PACK), Category, Sub-category, Description
- Clean form layout with validation states

#### **4. Transaction Pages**

**Deliveries (Goods Receipts):**

- List view with filters: Date range, Supplier, Status (Draft/Posted), Price variance indicator
- Table: Delivery #, Date, Supplier, Invoice #, Total Amount, Status badge, Variance warning icon
- **Create Delivery Form:**
  - Header: Supplier dropdown, Invoice #, Delivery date
  - Line items: Dynamic rows with Item selector, Quantity, Unit Price, Period Price (read-only), Variance indicator
  - Real-time total calculation
  - Price variance warning badges when prices differ from period prices
  - Actions: Save as Draft, Post Delivery (with confirmation modal)
- Detail view showing full delivery with line items

**Issues (Stock Consumption):**

- List with filters: Date range, Cost Centre (FOOD/CLEAN/OTHER)
- Table: Issue #, Date, Cost Centre, Total Value, Status
- **Create Issue Form:**
  - Header: Date, Cost Centre selector
  - Line items: Item selector, Quantity, On-Hand display, WAC (auto), Line Value (auto)
  - Stock validation warning when quantity exceeds on-hand
  - Total value display

**Transfers (Inter-Location):**

- List with filters: From Location, To Location, Date range, Status
- Status workflow badges: DRAFT -> PENDING_APPROVAL -> APPROVED/REJECTED -> COMPLETED
- **Create Transfer Form:**
  - From Location, To Location dropdowns (must be different)
  - Transfer date
  - Line items with item, quantity, stock validation
  - Notes field
- **Transfer Detail/Approval View:**
  - Full transfer details
  - Approval actions for Supervisors: Approve/Reject buttons with confirmation modals
  - Status timeline showing workflow progression

#### **5. Period Management (Admin)**

**Periods List:**

- Table: Period Name, Date Range, Status, Location Count
- Status badges: DRAFT, OPEN, PENDING_CLOSE, CLOSED
- Actions: View Details, Manage Prices

**Period Prices:**

- Table of items with locked prices for the period
- Bulk edit capabilities
- Lock/unlock actions

**Period Close:**

- Pre-close checklist with completion indicators
- Location readiness grid (all locations must be READY)
- Two-stage approval: Submit Request -> Admin Approve
- Visual workflow showing close progression
- Warning indicators for incomplete items

#### **6. Reconciliations**

**Reconciliation Summary:**

- Stock movement breakdown: Opening + Receipts - Issues +/- Adjustments = Closing
- Manday cost calculation display
- Per-location and consolidated views
- Adjustment entry forms

#### **7. Reports Hub**

- Report cards with icons: Stock Now Report, Deliveries Report, Issues Report, Reconciliation Report
- Each report with filter options and export capabilities

#### **8. NCR (Non-Conformance Reports)**

**NCR List:**

- Filter by type: Manual, Auto-generated (price variance)
- Status: Open, Sent to Supplier, Credited, Rejected
- Table with NCR #, Date, Type, Item, Status

**NCR Create/Detail:**

- Type selection, item details, description, attachments
- Status update workflow

#### **9. POB (Personnel on Board)**

- Calendar-style or table view of the period
- Daily entry: Date, Crew Count, Extra/Guests Count, Total
- Summary section: Total Mandays for period
- Auto-save on blur

#### **10. Master Data (Admin)**

**Locations:**

- Card-based layout with location type icons:
  - Kitchen (chef hat icon, amber accent)
  - Store (store icon, emerald accent)
  - Central (warehouse icon, blue accent)
  - Warehouse (package icon, zinc accent)
- Cards show: Name, Code, Type badge, Operator count, Status, Address
- Create/Edit forms

**Suppliers:**

- List/Table view with supplier details
- Contact information, active status
- Delivery history link

**Users:**

- Cards or table showing: Name, Username, Role badge, Status, Location assignments
- Role badges with colors: ADMIN (red), SUPERVISOR (amber), OPERATOR (green)
- Admin: "All Locations" access indicator
- Create/Edit with role selection, location assignment for Operators

#### **11. User Profile**

- View/Edit personal details (full name)
- Change password with strength indicator
- Role and permissions display
- Assigned locations (Operators) or "All Locations" (Admin/Supervisor)

---

### **COMPONENT PATTERNS TO DESIGN**

**Navigation:**

- Sidebar with collapsible behavior (icon-only when collapsed)
- Active state with accent indicator (emerald green left border)
- Grouped navigation sections
- User profile dropdown at bottom

**Page Headers:**

- Icon + Title + Optional subtitle
- Location context badge
- Period context badge
- Primary action button

**Data Tables:**

- Sortable columns
- Hover states
- Inline badges for status
- Action buttons (View, Edit, Delete)
- Empty states with illustration

**Cards:**

- Elevated cards with subtle shadow
- Muted background cards for secondary content
- Metric cards with icon, value, label, trend indicator

**Forms:**

- Clean input styling with labels
- Inline validation states (error, warning, success)
- Required field indicators
- Responsive grid layouts (1-2-3 column)
- Dynamic line items for transactions

**Modals:**

- Confirmation dialogs with semantic variants (danger, warning, info, success)
- Action modals for approve/reject workflows
- Form modals for quick edits

**Badges/Status Indicators:**

- Stock status: Healthy, Low, Critical, Pending
- Transaction status: Draft, Posted, Pending, Approved, Rejected, Completed
- Role badges: Admin, Supervisor, Operator

**Loading States:**

- Skeleton loaders for cards and tables
- Full-page loading overlay for critical operations
- Button loading states

**Empty States:**

- Friendly illustrations
- Clear messaging
- Action button when applicable

**Toast Notifications:**

- Success, error, warning, info variants
- Positioned at top-right or bottom-right

---

### **RESPONSIVE DESIGN REQUIREMENTS**

- **Desktop (1440px+):** Full sidebar, 3-column form grids, expanded tables
- **Laptop (1024-1439px):** Full sidebar, 2-column grids
- **Tablet (768-1023px):** Collapsible sidebar, 2-column grids, simplified tables
- **Mobile (< 768px):** Hidden sidebar (hamburger toggle), 1-column layouts, card-based data display

---

### **VISUAL DESIGN GUIDELINES**

**Typography:**

- Clear hierarchy: Display -> Heading -> Subheading -> Body -> Label -> Caption
- Readable font sizes, generous line height
- Monospace for numbers/codes where appropriate

**Spacing:**

- Consistent padding system (8px base)
- Generous whitespace for readability
- Clear section separation

**Shadows & Elevation:**

- Subtle shadows for cards and modals
- Clear elevation hierarchy

**Borders:**

- Subtle border colors
- Consistent border radius (rounded corners)

**Icons:**

- Consistent icon family (Heroicons recommended)
- Appropriate sizes for context

**Dark Mode:**

- Full dark theme support
- Proper color adjustments for all states
- Preserved brand colors

---

### **ACCESSIBILITY REQUIREMENTS**

- WCAG AA compliance minimum
- Sufficient color contrast ratios
- Focus states for all interactive elements
- Clear form labels and error messages
- Skip to main content link
- Semantic color usage (not color-only indicators)

---

### **SPECIAL CONSIDERATIONS**

**Data-Dense Views:**
Many pages display tables with multiple columns of numerical data. Prioritize:

- Clear column headers
- Right-aligned numbers
- Appropriate column widths
- Horizontal scroll on mobile if needed
- Fixed first column option for wide tables

**Workflow Visualization:**
For approval workflows (Transfers, Period Close), consider:

- Status timeline/stepper component
- Clear indication of current stage
- Who did what and when

**PWA Elements:**

- Offline indicator bar when connection lost
- Install prompt design
- App-like navigation feel

---

### **DELIVERABLES REQUESTED**

1. **Complete Page Designs** for all 44 pages listed above
2. **Component Library** with all reusable patterns
3. **Light & Dark Theme** versions
4. **Responsive Variants** for key pages (Desktop, Tablet, Mobile)
5. **Interactive States** (hover, active, disabled, loading)
6. **Empty States & Error States** for each context
7. **Icon Set** selections for navigation and actions
8. **Color System** documentation with semantic tokens

---

### **DESIGN INSPIRATION REFERENCES**

- Stripe Dashboard (data visualization, clean tables)
- Linear (workflow states, dark theme)
- Notion (sidebar navigation, clean forms)
- Figma (component organization, design system)
- Shopify Admin (inventory management context)
- Retool (data-dense but readable)

---

### **SUCCESS CRITERIA**

The redesign should:

1. Feel **premium and professional** - enterprise-grade quality
2. Be **immediately intuitive** - minimal learning curve
3. Support **fast data entry** - optimized for daily operations
4. Provide **clear visual hierarchy** - important info stands out
5. Maintain **consistency** - same patterns throughout
6. Be **accessible** - usable by all team members
7. Work **beautifully** on all devices
8. Support **both light and dark themes** seamlessly

---

**Create a modern, polished, production-ready UI design system for this Stock Management System that will impress enterprise clients while being genuinely useful for daily inventory operations.**
