# Data Model: Sync Stock Button for New Issue Page

**Feature Branch**: `002-sync-stock-issue`
**Date**: 2026-01-18

## Summary

This feature does not introduce new database entities. It reuses existing entities and UI state structures. This document describes the existing data structures that the feature interacts with.

---

## Existing Entities Used

### LocationStock (Database - Read Only)

The feature reads stock levels from the existing `LocationStock` table via the `/api/items` endpoint.

| Field | Type | Description |
|-------|------|-------------|
| location_id | UUID | Foreign key to Location |
| item_id | UUID | Foreign key to Item |
| on_hand | Decimal | Current quantity in stock |
| wac | Decimal | Weighted Average Cost |
| min_stock | Decimal? | Minimum stock level (optional) |
| max_stock | Decimal? | Maximum stock level (optional) |
| last_counted | DateTime? | Last physical count date |

**Access Pattern**: Read via `/api/items?locationId={id}` which includes `location_stock` relation

---

### Item (Database - Read Only)

The feature reads item master data alongside stock levels.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| code | String | Item code |
| name | String | Item display name |
| unit | String | Unit of measure |
| is_active | Boolean | Active status |
| location_stock | LocationStock[] | Stock levels by location |

**Access Pattern**: Read via `/api/items?locationId={id}&is_active=true&limit=200`

---

## UI State Structures

### Issue Line (Existing - Modified Usage)

The feature populates the existing `lines` reactive array with synced items.

```typescript
interface IssueLine {
  id: string;           // Generated UUID for tracking
  item_id: string;      // Selected item ID
  quantity: string;     // User-editable quantity (string for input binding)
  wac: number;          // WAC from stock data
  line_value: number;   // Calculated: quantity × wac
  on_hand: number;      // Current stock level
  has_insufficient_stock: boolean;  // quantity > on_hand
}
```

**Sync Behavior**: When sync is triggered, all existing lines are replaced with new lines created from stock data.

### Stock Levels Map (Existing)

```typescript
// Map of itemId -> stock info
const stockLevels = ref<Record<string, { on_hand: number; wac: number }>>({});
```

**Usage**: Already populated by `fetchItems()` - sync feature reads from this existing map.

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         User clicks "Sync Stock"                     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Read from existing `items` and `stockLevels` (already fetched)     │
│  Filter: items where stockLevels[item.id].on_hand > 0               │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Transform to IssueLine[] array:                                     │
│  - id: crypto.randomUUID()                                           │
│  - item_id: item.id                                                  │
│  - quantity: stockLevels[item.id].on_hand.toString()                │
│  - wac: stockLevels[item.id].wac                                    │
│  - line_value: on_hand × wac                                        │
│  - on_hand: stockLevels[item.id].on_hand                            │
│  - has_insufficient_stock: false (quantity === on_hand)             │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Replace lines.value with new array                                  │
│  (Existing watchers handle recalculations)                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## No Database Changes Required

This feature is purely a UI enhancement. All data access uses existing:
- Database tables: `Item`, `LocationStock`
- API endpoints: `GET /api/items`
- UI state structures: `lines`, `stockLevels`, `items`
