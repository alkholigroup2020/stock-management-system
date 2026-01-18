# Feature Specification: Sync Stock Button for New Issue Page

**Feature Branch**: `002-sync-stock-issue`
**Created**: 2026-01-18
**Status**: Draft
**Input**: User description: "We need to implement a new feature on the new issue page as per the attached screenshot. A new button that sync all items from the stock now and list them in the 'Issue Items' table. Then the user can edit the quantities or delete the unneeded items."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Sync All Stock Items to Issue (Priority: P1)

As an Operator creating a new stock issue, I want to quickly populate the Issue Items table with all items that have available stock at the current location, so that I can efficiently create an issue without manually adding each item one by one.

**Why this priority**: This is the core feature requested. Without this, the feature has no value. It directly addresses the pain point of having to manually add items when issuing most or all stock.

**Independent Test**: Can be fully tested by clicking the "Sync Stock" button and verifying all in-stock items appear in the table with correct on-hand quantities and WAC values.

**Acceptance Scenarios**:

1. **Given** I am on the New Issue page with an active location selected, **When** I click the "Sync Stock" button, **Then** all items with stock greater than zero at the current location are added to the Issue Items table with their quantities pre-filled to zero (user enters quantities manually).

2. **Given** the Issue Items table already has some items, **When** I click the "Sync Stock" button, **Then** the existing items are replaced with all items from the current stock.

3. **Given** I click the "Sync Stock" button, **When** the items are loaded, **Then** each line shows the correct On Hand, WAC, and Line Value calculated from current stock data.

---

### User Story 2 - Edit Synced Quantities (Priority: P1)

As an Operator, after syncing stock items, I want to edit the quantity for each item to specify the actual amount being issued, so that I only issue what is needed rather than the full stock.

**Why this priority**: Equally critical as syncing - the feature is useless if users cannot adjust quantities after syncing. This is the expected workflow.

**Independent Test**: After syncing items, modify the quantity field of any item and verify the Line Value recalculates correctly.

**Acceptance Scenarios**:

1. **Given** items have been synced from stock, **When** I edit the quantity field of an item, **Then** the Line Value recalculates based on the new quantity multiplied by the WAC.

2. **Given** items have been synced, **When** I enter a quantity less than or equal to the on-hand amount, **Then** no insufficient stock warning is shown.

3. **Given** items have been synced, **When** I increase the quantity above the on-hand amount, **Then** an insufficient stock warning is displayed for that line.

---

### User Story 3 - Remove Unneeded Items (Priority: P2)

As an Operator, after syncing stock items, I want to delete items that I don't need to issue, so that the final issue contains only the relevant items.

**Why this priority**: Important for the workflow but users can already delete items using existing functionality. This validates that the existing delete action continues to work correctly with synced items.

**Independent Test**: After syncing items, click the delete button on any item and verify it is removed from the table.

**Acceptance Scenarios**:

1. **Given** items have been synced from stock, **When** I click the delete button on an item row, **Then** that item is removed from the Issue Items table.

2. **Given** multiple items have been synced, **When** I delete all but one item, **Then** the delete button on the last remaining item is disabled (existing behavior).

3. **Given** I delete items after syncing, **When** I view the total value, **Then** it recalculates to reflect only the remaining items.

---

### User Story 4 - Loading State During Sync (Priority: P3)

As an Operator, when I click the "Sync Stock" button, I want to see a loading indicator so that I know the system is fetching the stock data.

**Why this priority**: Nice-to-have UX improvement that provides user feedback during the operation. The core functionality works without this.

**Independent Test**: Click the "Sync Stock" button and observe a loading state while data is being fetched.

**Acceptance Scenarios**:

1. **Given** I click the "Sync Stock" button, **When** stock data is being fetched, **Then** the button shows a loading spinner and is disabled.

2. **Given** the sync operation is in progress, **When** it completes successfully, **Then** the loading state is removed and items are displayed.

---

### Edge Cases

- **No items in stock**: When there are no items with positive on-hand quantity at the current location, show an informative message or toast indicating no stock items to sync.
- **Large number of items**: Handle locations with many items (50+) gracefully with good performance.
- **Location change during edit**: If the user changes the active location after syncing, the existing synced items should be cleared (existing behavior - form resets on location change).
- **Offline state**: The "Sync Stock" button should be disabled when offline, following the existing pattern for action buttons.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST display a "Sync Stock" button in the Issue Items card header, positioned before the existing "Add Item" button.
- **FR-002**: System MUST fetch all items with positive stock (on_hand > 0) from the current active location when the button is clicked.
- **FR-003**: System MUST populate the Issue Items table with one row per stocked item, showing item name, on-hand quantity, WAC, and calculated line value.
- **FR-004**: System MUST pre-fill the quantity field with zero for each synced item to prevent accidental full-stock submissions (user enters quantities manually).
- **FR-005**: System MUST replace any existing items in the table when sync is performed (not append).
- **FR-006**: System MUST allow users to edit the quantity of any synced item.
- **FR-007**: System MUST allow users to delete any synced item using the existing delete action.
- **FR-008**: System MUST recalculate Line Value when quantity is edited (quantity x WAC).
- **FR-009**: System MUST recalculate Total Value when items are added, edited, or removed.
- **FR-010**: System MUST show a loading state on the button while fetching stock data.
- **FR-011**: System MUST disable the "Sync Stock" button when offline.
- **FR-012**: System MUST display an informative message when no items have positive stock to sync.

### Key Entities _(include if feature involves data)_

- **LocationStock**: Existing entity containing item stock levels per location (on_hand, wac).
- **Issue Line (UI State)**: Temporary line item with item_id, quantity, wac, line_value, on_hand, and has_insufficient_stock flag.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can populate the Issue Items table with all stocked items in a single click.
- **SC-002**: Users can complete the stock-sync-edit-submit workflow in under 30 seconds for locations with up to 50 items.
- **SC-003**: 100% of synced items display accurate on-hand quantities matching the current stock levels.
- **SC-004**: The existing edit and delete functionality continues to work correctly with synced items.
- **SC-005**: The feature follows the existing visual design patterns of the New Issue page.

## Assumptions

- The existing `/api/reports/stock-now` endpoint or `/api/items` endpoint (with stock data) can be reused to fetch current stock levels.
- The button styling will follow the existing "Add Item" button pattern but with a distinct icon/label.
- The sync operation will use the already-selected active location from the location store.
- Items with zero on-hand quantity are excluded from the sync operation.
