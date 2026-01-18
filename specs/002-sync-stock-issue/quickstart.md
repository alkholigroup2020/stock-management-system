# Quickstart: Sync Stock Button for New Issue Page

**Feature Branch**: `002-sync-stock-issue`
**Date**: 2026-01-18

## Prerequisites

- Node.js 18+
- pnpm installed globally
- Access to development database (Supabase)
- `.env` file configured with required variables

## Setup

```bash
# Switch to feature branch
git checkout 002-sync-stock-issue

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

## Development

### File to Modify

The entire feature is implemented in a single file:

```
app/pages/issues/create.vue
```

### Implementation Steps

1. **Add Sync Stock Button** (Template Section)
   - Location: Inside the `<template #header>` of the Issue Items card
   - Position: Before the existing "Add Item" button
   - Pattern: Follow existing button styling with `variant="outline"`

2. **Add Loading State** (Script Section)
   - Add `syncing` ref for button loading state
   - Use existing pattern from `submitting` ref

3. **Add Sync Handler** (Script Section)
   - Function: `syncStock()`
   - Filter items with positive stock from existing `stockLevels` map
   - Create `IssueLine` objects for each item
   - Replace `lines.value` with new array

4. **Handle Edge Cases**
   - Empty stock: Show toast notification
   - Offline: Disable button (use existing `isOnline` check)

### Key Patterns to Follow

**Button in Header** (from existing code):
```vue
<UButton
  icon="i-lucide-refresh-cw"
  color="primary"
  variant="outline"
  size="sm"
  class="cursor-pointer"
  :loading="syncing"
  :disabled="!isOnline"
  @click="syncStock"
>
  Sync Stock
</UButton>
```

**Sync Handler** (new function):
```typescript
const syncing = ref(false);

const syncStock = async () => {
  // Filter items with positive stock
  const itemsWithStock = items.value.filter((item) => {
    const stock = stockLevels.value[item.id];
    return stock && stock.on_hand > 0;
  });

  if (itemsWithStock.length === 0) {
    handleError({ data: { message: "No items with stock to sync" } });
    return;
  }

  // Replace lines with synced items
  lines.value = itemsWithStock.map((item) => {
    const stock = stockLevels.value[item.id]!;
    return {
      id: crypto.randomUUID(),
      item_id: item.id,
      quantity: stock.on_hand.toString(),
      wac: stock.wac,
      line_value: stock.on_hand * stock.wac,
      on_hand: stock.on_hand,
      has_insufficient_stock: false,
    };
  });
};
```

## Testing

### Manual Testing Checklist

- [ ] Navigate to `/issues/create`
- [ ] Verify "Sync Stock" button appears before "Add Item"
- [ ] Click "Sync Stock" with stock available
  - [ ] Table populates with all stocked items
  - [ ] Quantities match on-hand values
  - [ ] WAC and Line Value display correctly
- [ ] Edit a quantity
  - [ ] Line Value recalculates
  - [ ] Insufficient stock warning appears if exceeding on-hand
- [ ] Delete an item
  - [ ] Item removed from table
  - [ ] Total Value recalculates
- [ ] Click "Sync Stock" again
  - [ ] Previous items replaced with fresh stock data
- [ ] Test with location that has no stock
  - [ ] Toast message appears
- [ ] Go offline (DevTools > Network > Offline)
  - [ ] Sync Stock button is disabled

### Automated Checks

```bash
# Type checking (must pass)
pnpm typecheck

# Format checking
pnpm format:check

# Start dev server for manual testing
pnpm dev
```

## Verification with Playwright

After implementation, verify with Playwright MCP:

1. Navigate to `http://localhost:3000/issues/create`
2. Click "Sync Stock" button
3. Verify table contains expected items
4. Edit a quantity field
5. Delete an item
6. Submit the issue

## Common Issues

### Items not appearing after sync
- Check that `fetchItems()` has completed (wait for `onMounted`)
- Verify `stockLevels` map is populated
- Check browser console for API errors

### Quantities showing as zero
- Ensure `stock.on_hand` is being converted to number correctly
- Check Prisma Decimal handling (`Number(stock.on_hand)`)

### Button not disabling offline
- Verify `useOfflineGuard` composable is imported
- Check `isOnline` is destructured from composable
