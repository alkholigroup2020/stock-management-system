# Research: Sync Stock Button for New Issue Page

**Feature Branch**: `002-sync-stock-issue`
**Date**: 2026-01-18

## Research Summary

This feature requires minimal research as it builds entirely on existing patterns and infrastructure. All technical decisions are straightforward extensions of current implementations.

---

## Decision 1: API Endpoint for Stock Data

**Decision**: Reuse existing `/api/items` endpoint with `locationId` parameter

**Rationale**:
- The `fetchItems()` function in `create.vue` already fetches items with `location_stock` data
- The existing endpoint returns `location_stock` array with `on_hand` and `wac` for each item
- No new API endpoint needed - the data is already available

**Alternatives Considered**:
- `/api/reports/stock-now` - Returns same data but structured for reports, includes additional metadata not needed for this feature
- New dedicated endpoint - Unnecessary complexity when existing endpoint provides all required data

**Code Reference**: `app/pages/issues/create.vue:418-458` - existing `fetchItems()` implementation

---

## Decision 2: Button Placement and Styling

**Decision**: Position "Sync Stock" button before "Add Item" button using outline variant

**Rationale**:
- Screenshot shows button positioned left of "Add Item"
- Using `variant="outline"` distinguishes it from primary "Add Item" action while maintaining visual hierarchy
- Consistent with existing button patterns in the application

**Alternatives Considered**:
- Same styling as "Add Item" - Would create visual confusion about which button does what
- Dropdown/menu approach - Over-engineered for single action

**Code Reference**: `app/pages/issues/create.vue:80-89` - existing "Add Item" button pattern

---

## Decision 3: Data Population Strategy

**Decision**: Replace existing lines (not append) when syncing

**Rationale**:
- FR-005 explicitly requires replacement, not append
- Cleaner UX - users expect "sync" to mean "refresh with current state"
- Prevents duplicate items if user syncs multiple times
- Matches user mental model from screenshot description

**Alternatives Considered**:
- Append mode - Creates duplicates and confusion
- Confirmation dialog before replace - Over-engineered for the use case; users can re-add items if needed

---

## Decision 4: Quantity Pre-fill Strategy

**Decision**: Pre-fill quantity with full on-hand amount

**Rationale**:
- FR-004 specifies pre-fill with current on-hand amount
- Enables "full stock issue" workflow with single click
- Users can reduce quantities as needed (common workflow per spec)
- Validation already exists for quantities exceeding on-hand

**Alternatives Considered**:
- Pre-fill with zero - Defeats purpose of sync feature; requires manual entry
- Pre-fill with 1 - Arbitrary and not useful for stock issue workflow

---

## Decision 5: Empty Stock Handling

**Decision**: Show toast notification when no items have positive stock

**Rationale**:
- FR-012 requires informative message when no stock to sync
- Toast is non-intrusive and follows existing error handling patterns
- No need to modify table state if nothing to sync

**Alternatives Considered**:
- Alert dialog - Too disruptive for this scenario
- Inline message in table - Requires additional UI state management

**Code Reference**: `app/composables/useErrorHandler.ts` - existing toast notification patterns

---

## Decision 6: Loading State Implementation

**Decision**: Use `loading` prop on UButton during fetch

**Rationale**:
- Nuxt UI's `UButton` has built-in `:loading` prop
- Automatically shows spinner and disables button
- Matches existing patterns in the codebase

**Alternatives Considered**:
- LoadingOverlay component - Too heavy for single button action; reserved for full-page operations
- Custom spinner - Unnecessary when Nuxt UI provides this out of the box

---

## Existing Code Patterns to Follow

### Items Fetch Pattern
```typescript
// From create.vue - existing pattern
const data = await $fetch<{ items: Array<ItemType> }>("/api/items", {
  query: {
    limit: 200,
    is_active: true,
    locationId: locationStore.activeLocation.id,
  },
});
```

### Stock Levels Extraction Pattern
```typescript
// From create.vue - existing pattern
items.value.forEach((item) => {
  if (item.location_stock && item.location_stock.length > 0) {
    const stock = item.location_stock[0];
    stockLevels.value[item.id] = {
      on_hand: Number(stock.on_hand) || 0,
      wac: Number(stock.wac) || 0,
    };
  }
});
```

### Button in Card Header Pattern
```vue
<!-- From create.vue - existing pattern -->
<template #header>
  <div class="flex items-center justify-between">
    <h2 class="text-lg font-semibold text-[var(--ui-text)]">Issue Items</h2>
    <UButton
      icon="i-lucide-plus"
      color="primary"
      variant="soft"
      size="sm"
      class="cursor-pointer"
      @click="addLine"
    >
      Add Item
    </UButton>
  </div>
</template>
```

---

## No Clarifications Needed

All technical decisions are covered by existing patterns in the codebase. The feature implementation is straightforward.
