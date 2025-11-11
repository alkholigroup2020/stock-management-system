# Visual Feature Walkthroughs

**Step-by-step visual guides for key features**

This document shows exactly what happens when users perform common tasks in the system. Each walkthrough includes diagrams showing the flow from user action to database update.

---

## Table of Contents

1. [User Login Journey](#1-user-login-journey)
2. [Creating a New Item](#2-creating-a-new-item)
3. [Setting Period Prices](#3-setting-period-prices)
4. [Recording a Delivery](#4-recording-a-delivery)
5. [Recording an Issue](#5-recording-an-issue)
6. [Viewing Stock Levels](#6-viewing-stock-levels)
7. [Switching Locations](#7-switching-locations)
8. [Price Variance Detection](#8-price-variance-detection)
9. [Stock Validation](#9-stock-validation)

---

## 1. User Login Journey

### What Happens When User Logs In

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant LoginPage as Login Page
    participant API as Auth API
    participant DB as Database
    participant Dashboard

    User->>Browser: Navigate to app
    Browser->>LoginPage: Show login page

    Note over User,LoginPage: Step 1: Enter Credentials
    User->>LoginPage: Type email: admin@foodstock.local
    User->>LoginPage: Type password: Admin@123
    User->>LoginPage: Click "Login"

    Note over LoginPage,API: Step 2: Frontend Validation
    LoginPage->>LoginPage: Validate email format
    LoginPage->>LoginPage: Check password not empty

    Note over LoginPage,DB: Step 3: Server Authentication
    LoginPage->>API: POST /api/auth/login
    API->>DB: Find user by email
    DB->>API: Return user record
    API->>API: Compare password hash

    alt Password Correct
        Note over API: Step 4: Create Session
        API->>API: Generate JWT token
        API->>Browser: Set httpOnly cookie
        Browser->>LoginPage: Receive success

        Note over LoginPage,Dashboard: Step 5: Redirect to Dashboard
        LoginPage->>LoginPage: Show success toast
        LoginPage->>Dashboard: Navigate to /
        Dashboard->>API: GET /api/auth/session
        API->>Dashboard: Return user data
        Dashboard->>User: Show dashboard

    else Password Wrong
        API->>LoginPage: Return 401 error
        LoginPage->>User: Show error message
        LoginPage->>User: Keep on login page
    end
```

### Visual States

```mermaid
stateDiagram-v2
    [*] --> LoginPage: User visits app
    LoginPage --> Validating: Submit credentials
    Validating --> Authenticating: Frontend OK
    Authenticating --> Success: Server OK
    Authenticating --> Error: Server Failed
    Success --> Dashboard: Redirect
    Error --> LoginPage: Show error
    Dashboard --> [*]: User logged in

    note right of Success
        Cookie set
        Session created
        User data loaded
    end note
```

---

## 2. Creating a New Item

### Complete Item Creation Flow

```mermaid
sequenceDiagram
    actor Admin
    participant Page as Items List
    participant Form as Create Form
    participant Valid as Validation
    participant API as Items API
    participant DB as Database

    Note over Admin,Page: Step 1: Navigate to Create
    Admin->>Page: Click "Create Item"
    Page->>Form: Navigate to /items/create
    Form->>Admin: Show empty form

    Note over Admin,Form: Step 2: Fill Form
    Admin->>Form: Enter Code: FLR-001
    Form->>Form: Auto-convert to uppercase
    Admin->>Form: Enter Name: All Purpose Flour
    Admin->>Form: Select Unit: KG
    Admin->>Form: Enter Category: Dry Goods
    Admin->>Form: Enter Sub-Category: Baking

    Note over Admin,Valid: Step 3: Submit & Validate
    Admin->>Form: Click "Create Item"
    Form->>Valid: Check all fields

    Valid->>Valid: Code not empty? ✓
    Valid->>Valid: Name not empty? ✓
    Valid->>Valid: Unit selected? ✓

    Note over Valid,DB: Step 4: Server Processing
    Valid->>API: POST /api/items
    API->>API: Check user is admin
    API->>DB: Check if code exists

    alt Code Already Exists
        DB->>API: Found duplicate
        API->>Form: 409 Conflict error
        Form->>Admin: Show error:<br/>"Item code already used"

    else Code Available
        DB->>API: No duplicate
        Note over API,DB: Step 5: Create Item
        API->>DB: INSERT new item
        DB->>API: Item created successfully
        API->>Form: Return new item
        Form->>Form: Show success toast
        Form->>Page: Navigate to /items
        Page->>Admin: Show items list
    end
```

### Form States Diagram

```mermaid
graph TB
    A[Empty Form] --> B{User Fills Fields}
    B --> C{All Required Filled?}
    C -->|No| D[Submit Disabled]
    C -->|Yes| E[Submit Enabled]

    E --> F{User Clicks Submit}
    F --> G[Validate Format]
    G --> H{Valid Format?}
    H -->|No| I[Show Field Errors]
    H -->|Yes| J[Send to API]

    J --> K{API Response}
    K -->|Success| L[Show Toast]
    K -->|Error| M[Show Error]

    L --> N[Redirect to List]
    M --> O[Stay on Form]
    I --> O
```

---

## 3. Setting Period Prices

### Price Setting Workflow

```mermaid
sequenceDiagram
    actor Admin
    participant Page as Prices Page
    participant Stock as Stock API
    participant API as Prices API
    participant DB as Database

    Note over Admin,Page: Step 1: Open Prices Page
    Admin->>Page: Click "Items & Prices"
    Page->>Page: Get current period
    Page->>Stock: GET /api/locations/:id/stock
    Stock->>DB: Fetch items with WAC
    DB->>Stock: Return items + current WAC
    Stock->>Page: Send stock data

    Note over Admin,Page: Step 2: Display Items
    Page->>Admin: Show all items with:<br/>- Current WAC<br/>- Period Price (if set)

    Note over Admin,Page: Step 3: Edit Prices
    Admin->>Page: Edit Flour price: SAR 5.00 → SAR 5.50
    Page->>Page: Mark as modified
    Page->>Page: Check variance > 10%
    Page->>Page: Calculate: (5.50-5.00)/5.00 = 10%

    alt Variance > 10%
        Page->>Admin: Show amber warning
    else No Warning
        Page->>Admin: No visual indicator
    end

    Admin->>Page: Edit Rice price: SAR 3.00 → SAR 3.20
    Page->>Page: Mark as modified
    Page->>Admin: Update modified counter

    Note over Admin,API: Step 4: Save All Changes
    Admin->>Page: Click "Save All"
    Page->>API: POST /api/periods/:id/prices
    Note over API: Send only modified prices:<br/>[Flour: 5.50, Rice: 3.20]

    API->>API: Check period is OPEN
    API->>DB: START TRANSACTION

    loop For Each Modified Price
        API->>DB: UPSERT item_price
        Note over DB: Creates new or updates existing
    end

    API->>DB: COMMIT TRANSACTION
    DB->>API: Success
    API->>Page: Prices saved
    Page->>Admin: Show success toast
    Page->>Page: Clear modified markers
```

### Price Variance Warning Logic

```mermaid
graph TB
    A[Admin Edits Price] --> B[Get Current WAC]
    B --> C[Calculate Difference]
    C --> D{Difference > 10%?}

    D -->|Yes| E[Show Amber Warning]
    E --> F[Icon: alert-triangle]
    F --> G[Tooltip: Price differs<br/>significantly from WAC]

    D -->|No| H[No Warning Shown]

    I[Admin Hovers Warning] --> J[Show Tooltip]
    J --> K[Display:<br/>New: SAR X.XX<br/>WAC: SAR Y.YY<br/>Diff: Z%]
```

---

## 4. Recording a Delivery

### Complete Delivery Flow with Price Variance

```mermaid
sequenceDiagram
    actor User
    participant Form as Delivery Form
    participant Prices as Period Prices
    participant API as Delivery API
    participant Stock as LocationStock
    participant WAC as WAC Calculator
    participant NCR as NCR Creator
    participant DB as Database

    Note over User,Form: Step 1: Create Delivery
    User->>Form: Click "New Delivery"
    Form->>User: Show delivery form

    Note over User,Form: Step 2: Enter Header
    User->>Form: Select Supplier
    User->>Form: Enter Invoice: INV-001
    User->>Form: Select Date: Today

    Note over User,Form: Step 3: Add Line Items
    User->>Form: Click "Add Item"
    User->>Form: Select Item: Flour
    User->>Form: Enter Quantity: 100 kg
    User->>Form: Enter Unit Price: SAR 6.00

    Note over Form,Prices: Step 4: Check Price Variance
    Form->>Prices: Get period price for Flour
    Prices->>Form: Return SAR 5.00
    Form->>Form: Calculate variance:<br/>6.00 - 5.00 = SAR 1.00 (20%)
    Form->>User: Show amber warning

    User->>Form: Add more items...
    User->>Form: Click "Submit"

    Note over Form,API: Step 5: Server Processing
    Form->>API: POST /api/locations/:id/deliveries
    API->>DB: START TRANSACTION

    Note over API: Step 6: Create Delivery Record
    API->>DB: Generate delivery_no
    API->>DB: INSERT delivery
    API->>DB: Set has_variance = true

    Note over API,NCR: Step 7: Process Each Line
    loop For Each Line Item
        API->>Prices: Get period_price
        API->>API: Calculate variance

        alt Variance Detected
            API->>NCR: Create price variance NCR
            NCR->>DB: INSERT NCR record
            NCR->>NCR: Set auto_generated = true
            NCR->>NCR: Link to delivery_line
        end

        Note over API,Stock: Step 8: Update Stock
        API->>Stock: Get current stock
        Stock->>API: Current: 200 kg @ SAR 5.50

        API->>WAC: Calculate new WAC
        Note over WAC: Formula:<br/>(200 × 5.50) + (100 × 6.00)<br/>÷ (200 + 100)
        WAC->>API: New WAC: SAR 5.67

        API->>DB: UPDATE location_stock<br/>on_hand = 300<br/>wac = 5.67
    end

    Note over API,DB: Step 9: Commit & Return
    API->>DB: COMMIT TRANSACTION
    API->>Form: Success + NCR count
    Form->>User: Show toast:<br/>"Delivery created.<br/>2 price variances detected."
    Form->>User: Navigate to delivery detail
```

### Stock Update Visualization

```mermaid
graph LR
    subgraph "Before Delivery"
        B1[Flour Stock<br/>200 kg @ SAR 5.50<br/>Value: SAR 1,100]
    end

    subgraph "Delivery Received"
        D1[New Delivery<br/>100 kg @ SAR 6.00<br/>Value: SAR 600]
    end

    subgraph "WAC Calculation"
        W1[Total Value:<br/>1,100 + 600 = 1,700]
        W2[Total Qty:<br/>200 + 100 = 300]
        W3[New WAC:<br/>1,700 ÷ 300 = 5.67]
    end

    subgraph "After Delivery"
        A1[Flour Stock<br/>300 kg @ SAR 5.67<br/>Value: SAR 1,700]
    end

    B1 --> W1
    D1 --> W1
    W1 --> W2
    W2 --> W3
    W3 --> A1
```

---

## 5. Recording an Issue

### Complete Issue Flow with Stock Validation

```mermaid
sequenceDiagram
    actor User
    participant Form as Issue Form
    participant Stock as Stock Check
    participant API as Issue API
    participant DB as Database

    Note over User,Form: Step 1: Create Issue
    User->>Form: Click "New Issue"
    Form->>User: Show issue form

    Note over User,Form: Step 2: Enter Header
    User->>Form: Select Date: Today
    User->>Form: Select Cost Centre: FOOD

    Note over User,Form: Step 3: Add Line Items
    User->>Form: Click "Add Item"
    User->>Form: Select Item: Flour

    Note over Form,Stock: Step 4: Show Available Stock
    Form->>Stock: Get on-hand for Flour
    Stock->>Form: Available: 300 kg
    Form->>User: Display "Available: 300 kg"

    Note over User,Form: Step 5: Enter Quantity
    User->>Form: Enter Quantity: 400 kg
    Form->>Form: Check 400 > 300?
    Form->>User: Show RED warning:<br/>"Insufficient stock!"
    Form->>Form: Disable submit button

    User->>Form: Change to 250 kg
    Form->>Form: Check 250 ≤ 300?
    Form->>User: Remove warning
    Form->>Form: Enable submit button

    Note over User,Form: Step 6: Add More Items
    User->>Form: Add Rice: 50 kg
    Form->>Stock: Check Rice stock: 100 kg
    Form->>User: Show "Available: 100 kg"
    Form->>Form: 50 ≤ 100 ✓

    Note over User,API: Step 7: Submit Issue
    User->>Form: Click "Submit"
    Form->>API: POST /api/locations/:id/issues

    Note over API,DB: Step 8: Server Validation
    API->>DB: START TRANSACTION

    loop Validate Each Line
        API->>DB: Get current stock
        DB->>API: Return on_hand

        alt Stock Sufficient
            Note over API: Continue
        else Insufficient Stock
            API->>DB: ROLLBACK
            API->>Form: 400 Error:<br/>"Insufficient stock"
            Form->>User: Show detailed error
        end
    end

    Note over API,DB: Step 9: Create Issue
    API->>DB: Generate issue_no
    API->>DB: INSERT issue

    Note over API,DB: Step 10: Deduct Stock
    loop For Each Line
        API->>DB: Get current WAC
        DB->>API: WAC: SAR 5.67

        Note over API: Calculate line value:<br/>250 × 5.67 = SAR 1,417.50

        API->>DB: UPDATE location_stock<br/>on_hand = 300 - 250 = 50
        Note over DB: WAC stays at SAR 5.67<br/>NO RECALCULATION!
    end

    API->>DB: COMMIT TRANSACTION
    API->>Form: Success
    Form->>User: Show success toast
    Form->>User: Navigate to issues list
```

### Stock Validation Visual

```mermaid
graph TB
    A[User Enters Quantity] --> B{Quantity ≤ Available?}

    B -->|Yes| C[GREEN State]
    C --> D[No Warning]
    C --> E[Submit Enabled]

    B -->|No| F[RED State]
    F --> G[Show Warning Message]
    F --> H[Submit Disabled]
    F --> I[Display:<br/>Requested: X<br/>Available: Y<br/>Short: X-Y]

    J[User Changes Quantity] --> A
```

---

## 6. Viewing Stock Levels

### Stock Now Page Flow

```mermaid
sequenceDiagram
    actor User
    participant Page as Stock Page
    participant Store as Location Store
    participant API as Stock API
    participant DB as Database

    Note over User,Page: Step 1: Navigate to Stock
    User->>Page: Click "Stock Now"
    Page->>Store: Get user role
    Store->>Page: Return role: SUPERVISOR

    alt Supervisor/Admin
        Note over Page: Show view mode toggle
        Page->>User: Display:<br/>- Single Location button<br/>- All Locations button
    else Operator
        Note over Page: No toggle shown
        Page->>User: Show only single location view
    end

    Note over User,Page: Step 2: Select View Mode
    User->>Page: Click "All Locations"

    Note over Page,API: Step 3: Fetch Data
    Page->>API: GET /api/stock/consolidated
    API->>DB: Query all locations
    API->>DB: Aggregate stock per item

    Note over DB: Join location_stock<br/>Group by item_id<br/>Sum quantities

    DB->>API: Return consolidated data
    API->>Page: Send items with location breakdown

    Note over Page,User: Step 4: Display Results
    Page->>User: Show table with columns:<br/>- Item Code & Name<br/>- Kitchen qty<br/>- Store qty<br/>- Warehouse qty<br/>- Total qty<br/>- Total value

    Note over User,Page: Step 5: Filter & Search
    User->>Page: Enter search: "flour"
    Page->>Page: Filter items locally
    Page->>User: Show only matching items

    User->>Page: Select category: "Dairy"
    Page->>Page: Filter by category
    Page->>User: Update table

    User->>Page: Click "Export CSV"
    Page->>Page: Generate CSV file
    Page->>User: Download stock-now-2025-01-15.csv
```

### View Mode Comparison

```mermaid
graph TB
    subgraph "Single Location View"
        S1[Item: Flour]
        S2[On Hand: 300 kg]
        S3[WAC: SAR 5.67]
        S4[Value: SAR 1,700]

        S1 --> S2
        S2 --> S3
        S3 --> S4
    end

    subgraph "Consolidated View"
        C1[Item: Flour]
        C2[Kitchen: 100 kg]
        C3[Store: 50 kg]
        C4[Warehouse: 150 kg]
        C5[Total: 300 kg]
        C6[Value: SAR 1,700]

        C1 --> C2
        C1 --> C3
        C1 --> C4
        C2 --> C5
        C3 --> C5
        C4 --> C5
        C5 --> C6
    end
```

---

## 7. Switching Locations

### Location Switch Flow

```mermaid
sequenceDiagram
    actor User
    participant Nav as Navbar
    participant Switch as Location Switcher
    participant Store as Location Store
    participant Pages as Active Pages

    Note over User,Nav: Step 1: Click Location Switcher
    User->>Nav: Click location dropdown
    Switch->>Store: Get accessible locations
    Store->>Switch: Return 3 locations

    Switch->>User: Show dropdown:<br/>✓ Kitchen<br/>  Store<br/>  Warehouse

    Note over User,Switch: Step 2: Select New Location
    User->>Switch: Click "Store"

    alt Already Active
        Switch->>User: No action (already selected)
    else Different Location
        Note over Switch,Store: Step 3: Update State
        Switch->>Store: setActiveLocation('Store')
        Store->>Store: Update activeLocationId
        Store->>Store: Save to localStorage

        Note over Store,Pages: Step 4: Notify Components
        Store->>Pages: Emit location changed
        Pages->>Pages: Watch detects change

        Note over Pages: Step 5: Refresh Data
        Pages->>Pages: Clear old data
        Pages->>Pages: Fetch new data for Store

        Note over Switch,User: Step 6: User Feedback
        Switch->>User: Show toast:<br/>"Switched to Store"
        Nav->>User: Update navbar display
        Pages->>User: Show new data
    end
```

### Component Refresh Chain

```mermaid
graph TB
    A[User Switches Location] --> B[Location Store Updates]

    B --> C1[Dashboard refreshes]
    B --> C2[Items page refreshes]
    B --> C3[Stock page refreshes]
    B --> C4[Deliveries refresh]
    B --> C5[Issues refresh]

    C1 --> D1[Fetch new metrics]
    C2 --> D2[Fetch new items]
    C3 --> D3[Fetch new stock]
    C4 --> D4[Fetch new deliveries]
    C5 --> D5[Fetch new issues]

    D1 --> E[Show New Data]
    D2 --> E
    D3 --> E
    D4 --> E
    D5 --> E
```

---

## 8. Price Variance Detection

### Detailed Price Variance Flow

```mermaid
graph TB
    A[Admin Sets Period Price] --> B[Period Price: SAR 5.00]

    C[Delivery Arrives] --> D[Delivery Price: SAR 6.00]

    B --> E{Compare Prices}
    D --> E

    E --> F[Calculate Variance]
    F --> G[Absolute: SAR 1.00]
    F --> H[Percentage: 20%]
    F --> I[Line Total:<br/>100 kg × SAR 1.00 = SAR 100]

    G --> J{Exceeds Threshold?}

    J -->|Yes| K[Create Auto NCR]
    K --> L[NCR Details]
    L --> M[Type: PRICE_VARIANCE]
    L --> N[Auto Generated: true]
    L --> O[Reason: Price increased<br/>from SAR 5.00 to SAR 6.00<br/>20% variance]
    L --> P[Value: SAR 100]
    L --> Q[Status: OPEN]
    L --> R[Link to Delivery Line]

    J -->|No| S[No NCR Created]

    K --> T[Set Delivery.has_variance = true]
    T --> U[Show in Deliveries List]
```

### NCR Auto-Creation Decision Tree

```mermaid
graph TB
    A[Delivery Line Created] --> B{Has Period Price?}

    B -->|No| C[Skip Variance Check]
    B -->|Yes| D[Get Period Price]

    D --> E[Compare Prices]
    E --> F{Prices Different?}

    F -->|No| G[No Variance]
    F -->|Yes| H[Calculate Variance %]

    H --> I{Has Threshold Config?}

    I -->|No| J[Create NCR<br/>Any Difference]
    I -->|Yes| K{Variance > Threshold?}

    K -->|Yes| J
    K -->|No| L[No NCR<br/>Within Tolerance]

    J --> M[Auto NCR Created]
    M --> N[Link to Delivery]
    M --> O[Email Alert<br/>Future Feature]
```

---

## 9. Stock Validation

### Multi-Line Stock Validation

```mermaid
sequenceDiagram
    actor User
    participant Form as Issue Form
    participant Valid as Validation Logic
    participant Stock as Stock API
    participant API as Issue API
    participant DB as Database

    Note over User,Form: User Creates Multi-Line Issue

    User->>Form: Line 1: Flour - 250 kg
    Form->>Stock: Check Flour stock
    Stock->>Form: Available: 300 kg
    Form->>Valid: Validate 250 ≤ 300
    Valid->>Form: ✓ Sufficient

    User->>Form: Line 2: Rice - 80 kg
    Form->>Stock: Check Rice stock
    Stock->>Form: Available: 100 kg
    Form->>Valid: Validate 80 ≤ 100
    Valid->>Form: ✓ Sufficient

    User->>Form: Line 3: Sugar - 150 kg
    Form->>Stock: Check Sugar stock
    Stock->>Form: Available: 120 kg
    Form->>Valid: Validate 150 ≤ 120
    Valid->>Form: ✗ Insufficient!
    Form->>User: Show RED warning on Line 3
    Form->>Form: Disable submit button

    Note over User,Form: User Fixes Issue
    User->>Form: Change Line 3 to 100 kg
    Form->>Valid: Validate 100 ≤ 120
    Valid->>Form: ✓ Sufficient
    Form->>User: Remove warning
    Form->>Form: Enable submit button

    Note over User,API: Submit to Server
    User->>Form: Click Submit
    Form->>API: POST /api/locations/:id/issues

    Note over API,DB: Double-Check on Server
    API->>DB: START TRANSACTION

    loop Validate All Lines
        API->>DB: Get current stock
        DB->>API: Return on_hand

        alt Still Sufficient
            Note over API: Continue
        else Now Insufficient
            Note over API: Stock changed!<br/>Another user issued
            API->>DB: ROLLBACK
            API->>Form: Error: Stock changed
            Form->>User: Show error:<br/>"Stock levels changed.<br/>Please refresh."
        end
    end

    API->>API: All checks passed
    API->>DB: Process issue
    API->>DB: COMMIT
    API->>Form: Success
```

### Validation Timing Diagram

```mermaid
gantt
    title Stock Validation Timeline
    dateFormat X
    axisFormat %s

    section Frontend
    User enters quantity     :a1, 0, 1s
    Real-time check         :a2, 1, 2s
    Show warning            :a3, 2, 3s
    User fixes issue        :a4, 3, 5s
    Submit form             :a5, 5, 6s

    section Backend
    Receive request         :b1, 6, 7s
    Start transaction       :b2, 7, 8s
    Re-validate stock       :b3, 8, 10s
    Process if OK           :b4, 10, 12s
    Commit transaction      :b5, 12, 13s
    Return success          :b6, 13, 14s
```

---

## Summary

### Key Patterns We Use

1. **Optimistic UI with Server Validation**
   - Check on frontend for better UX
   - Re-check on backend for security

2. **Atomic Transactions**
   - All-or-nothing database operations
   - Rollback on any error

3. **Real-time Reactive Updates**
   - Vue's reactivity system
   - Pinia stores for shared state
   - Watch for automatic refreshes

4. **Progressive Enhancement**
   - Basic functionality works first
   - Advanced features layer on top
   - Graceful error handling

5. **Security in Depth**
   - Multiple permission checks
   - Frontend hides unauthorized UI
   - Backend enforces all rules

### Data Flow Summary

```mermaid
graph TB
    A[User Action] --> B[Frontend Validation]
    B --> C[API Request]
    C --> D[Server Middleware]
    D --> E[Authentication Check]
    E --> F[Permission Check]
    F --> G[Business Logic]
    G --> H[Database Transaction]
    H --> I{Success?}
    I -->|Yes| J[Commit & Return]
    I -->|No| K[Rollback & Error]
    J --> L[Update UI]
    K --> M[Show Error]
```

---

**For more details on any feature, refer to the main [Phase 1 Complete Guide](./PHASE_1_COMPLETE_GUIDE.md).**
