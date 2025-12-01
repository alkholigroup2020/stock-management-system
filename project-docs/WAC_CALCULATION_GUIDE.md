# WAC (Weighted Average Cost) Calculation Guide

## Overview

The WAC (Weighted Average Cost) calculation is a fundamental component of the Stock Management System's inventory valuation methodology. This guide explains the formula, its implementation, business rules, and usage scenarios.

## Business Context

### Why WAC?

The Stock Management System uses the Weighted Average Cost method for inventory valuation because it:

1. **Smooths Price Fluctuations**: Averages out price variations across multiple receipts
2. **Simple to Calculate**: Straightforward formula with clear logic
3. **Compliant with Accounting Standards**: Acceptable under IFRS and GAAP
4. **Fair Cost Allocation**: Distributes costs proportionally across all units
5. **Real-time Updates**: Automatically recalculates on each delivery

### When WAC is Calculated

- **Deliveries**: WAC is recalculated when goods are received
- **Issues**: Items are issued at the current WAC (no recalculation)
- **Transfers**: Stock moves at the current WAC from source location

## The Formula

### Basic Formula

```
newWAC = (currentQty × currentWAC + receivedQty × receiptPrice) / (currentQty + receivedQty)
```

### Components

- **currentQty**: Current on-hand quantity before the receipt
- **currentWAC**: Current Weighted Average Cost per unit
- **receivedQty**: Quantity being received in this delivery
- **receiptPrice**: Unit price of the goods being received
- **newWAC**: The newly calculated Weighted Average Cost

### Step-by-Step Calculation

1. **Calculate Current Value**: `currentValue = currentQty × currentWAC`
2. **Calculate Receipt Value**: `receiptValue = receivedQty × receiptPrice`
3. **Calculate New Quantity**: `newQuantity = currentQty + receivedQty`
4. **Calculate New WAC**: `newWAC = (currentValue + receiptValue) / newQuantity`

## Examples

### Example 1: Standard Delivery

**Scenario**: Restaurant kitchen receiving tomatoes

**Current Stock**:

- Quantity: 25 KG
- WAC: SAR 8.50/KG
- Value: SAR 212.50

**New Receipt**:

- Quantity: 15 KG
- Price: SAR 9.20/KG
- Value: SAR 138.00

**Calculation**:

```
newWAC = (25 × 8.50 + 15 × 9.20) / (25 + 15)
       = (212.50 + 138.00) / 40
       = 350.50 / 40
       = SAR 8.7625/KG
```

**Result**:

- New Quantity: 40 KG
- New WAC: SAR 8.76/KG
- New Value: SAR 350.50

### Example 2: First Receipt (Zero Stock)

**Scenario**: New item being ordered for the first time

**Current Stock**:

- Quantity: 0 KG
- WAC: SAR 0.00/KG
- Value: SAR 0.00

**New Receipt**:

- Quantity: 100 KG
- Price: SAR 15.75/KG
- Value: SAR 1,575.00

**Calculation**:

```
newWAC = (0 × 0.00 + 100 × 15.75) / (0 + 100)
       = (0.00 + 1,575.00) / 100
       = 1,575.00 / 100
       = SAR 15.75/KG
```

**Result**:

- New Quantity: 100 KG
- New WAC: SAR 15.75/KG
- New Value: SAR 1,575.00

### Example 3: Price Increase

**Scenario**: Supplier increased prices due to supply chain issues

**Current Stock**:

- Quantity: 100 LTR
- WAC: SAR 20.00/LTR
- Value: SAR 2,000.00

**New Receipt**:

- Quantity: 50 LTR
- Price: SAR 25.00/LTR (25% increase)
- Value: SAR 1,250.00

**Calculation**:

```
newWAC = (100 × 20.00 + 50 × 25.00) / (100 + 50)
       = (2,000.00 + 1,250.00) / 150
       = 3,250.00 / 150
       = SAR 21.6667/LTR
```

**Result**:

- New Quantity: 150 LTR
- New WAC: SAR 21.67/LTR (8.33% increase)
- New Value: SAR 3,250.00

### Example 4: Promotional Pricing

**Scenario**: Supplier offering discount on bulk order

**Current Stock**:

- Quantity: 200 BOX
- WAC: SAR 50.00/BOX
- Value: SAR 10,000.00

**New Receipt**:

- Quantity: 100 BOX
- Price: SAR 40.00/BOX (20% discount)
- Value: SAR 4,000.00

**Calculation**:

```
newWAC = (200 × 50.00 + 100 × 40.00) / (200 + 100)
       = (10,000.00 + 4,000.00) / 300
       = 14,000.00 / 300
       = SAR 46.6667/BOX
```

**Result**:

- New Quantity: 300 BOX
- New WAC: SAR 46.67/BOX (6.67% decrease)
- New Value: SAR 14,000.00

## Implementation

### Code Location

The WAC calculation utility is located at:

```
server/utils/wac.ts
```

### Function Signature

```typescript
function calculateWAC(
  currentQty: number,
  currentWAC: number,
  receivedQty: number,
  receiptPrice: number
): WACCalculationResult;
```

### Return Type

```typescript
interface WACCalculationResult {
  newWAC: number; // The newly calculated WAC
  newQuantity: number; // Total quantity after receipt
  newValue: number; // Total value (newQuantity × newWAC)
  currentValue: number; // Current value before receipt
  receiptValue: number; // Value of the receipt
}
```

### Usage Example

```typescript
import { calculateWAC } from "~/server/utils/wac";

// Calculate WAC for a delivery
const result = calculateWAC(
  100, // Current quantity: 100 KG
  10.0, // Current WAC: SAR 10.00/KG
  50, // Received quantity: 50 KG
  12.0 // Receipt price: SAR 12.00/KG
);

console.log(result);
// {
//   newWAC: 10.6667,
//   newQuantity: 150,
//   newValue: 1600.00,
//   currentValue: 1000.00,
//   receiptValue: 600.00
// }
```

## Business Rules

### 1. Deliveries Update WAC

When goods are received:

- Calculate new WAC using the formula
- Update `LocationStock.wac` field
- Update `LocationStock.on_hand` field
- Store WAC value in `DeliveryLine.unit_price` for audit trail

### 2. Issues Do NOT Recalculate WAC

When goods are issued:

- Deduct quantity from `LocationStock.on_hand`
- Use current WAC for valuation (no recalculation)
- Store WAC at issue time in `IssueLine.wac_at_issue`
- Calculate line value: `quantity × wac_at_issue`

**Why?** Issues reduce inventory but don't change the average cost of remaining units.

### 3. Transfers Use Current WAC

When goods are transferred between locations:

- Source location: Deduct at current WAC (no recalculation)
- Destination location: Add with receipt price = source WAC
- Store WAC in `TransferLine.wac_at_transfer`
- This maintains consistent costing across locations

### 4. Price Variance Detection

When delivery price differs from period-locked price:

- Calculate WAC with actual receipt price
- Compare receipt price to period price
- If variance exceeds threshold, auto-generate NCR
- This prevents unauthorized price changes

## Precision and Rounding

### Database Storage

- **Quantity**: Stored with up to 4 decimal places (`Decimal(10, 4)`)
- **WAC**: Stored with up to 4 decimal places (`Decimal(10, 4)`)
- **Values**: Currency stored with 2 decimal places (`Decimal(12, 2)`)

### Calculation Precision

- Internal calculations use full floating-point precision
- Final results rounded to appropriate decimal places:
  - WAC: 4 decimals
  - Quantities: 4 decimals
  - Currency values: 2 decimals

### Example

```typescript
// Input with high precision
const result = calculateWAC(10.123456, 5.678901, 20.456789, 6.789012);

// Output with proper rounding
result.newWAC; // 6.4215 (4 decimals)
result.newQuantity; // 30.5801 (4 decimals)
result.newValue; // 196.37 (2 decimals)
```

## Edge Cases

### Zero Current Stock

**Scenario**: First receipt sets the WAC

```typescript
calculateWAC(0, 0, 100, 15.75);
// Result: { newWAC: 15.75, newQuantity: 100, newValue: 1575.00 }
```

### Same Price as Current WAC

**Scenario**: No price change, WAC remains constant

```typescript
calculateWAC(100, 10.0, 50, 10.0);
// Result: { newWAC: 10.00, newQuantity: 150, newValue: 1500.00 }
```

### Small Receipt Quantity

**Scenario**: Minimal impact on WAC

```typescript
calculateWAC(1000, 10.0, 1, 20.0);
// Result: { newWAC: 10.01, newQuantity: 1001 }
// WAC increases by only SAR 0.01
```

### Large Receipt Quantity

**Scenario**: Receipt dominates the average

```typescript
calculateWAC(10, 10.0, 1000, 12.0);
// Result: { newWAC: 11.98, newQuantity: 1010 }
// New WAC close to receipt price (12.00)
```

## Validation

### Input Validation

The `calculateWAC` function validates all inputs:

- **currentQty**: Must be ≥ 0 (can be zero for first receipt)
- **currentWAC**: Must be ≥ 0 (can be zero for first receipt)
- **receivedQty**: Must be > 0 (cannot receive zero or negative)
- **receiptPrice**: Must be ≥ 0 (can be zero for complimentary goods)
- All values must be finite numbers (no NaN or Infinity)

### Error Handling

```typescript
// Invalid input examples
calculateWAC(-10, 10.0, 50, 12.0); // Error: currentQty cannot be negative
calculateWAC(100, 10.0, 0, 12.0); // Error: receivedQty must be > 0
calculateWAC(100, 10.0, 50, -12.0); // Error: receiptPrice cannot be negative
```

## Helper Functions

### previewWAC()

Calculate WAC without applying changes:

```typescript
const newWAC = previewWAC(100, 10.0, 50, 12.0);
// Returns: 10.6667
// Useful for showing users the impact before saving
```

### validateWACInputs()

Validate inputs before calculation:

```typescript
const validation = validateWACInputs(100, 10.0, 50, 12.0);
// Returns: { valid: true }

const invalid = validateWACInputs(-10, 10.0, 50, 12.0);
// Returns: { valid: false, error: "currentQty cannot be negative" }
```

### calculateReceiptValueImpact()

Get the value added by a receipt:

```typescript
const impact = calculateReceiptValueImpact(100, 10.0, 50, 12.0);
// Returns: 600.00 (the receipt value)
```

## Testing

### Test Coverage

The WAC utility has comprehensive test coverage with 38 test cases covering:

- Standard calculations
- Edge cases (zero stock, same price, etc.)
- Error handling (negative values, invalid inputs)
- Precision and rounding
- Business logic scenarios
- Helper functions

### Running Tests

```bash
# Run all WAC tests
pnpm test:unit

# Run tests in watch mode
pnpm test:watch

# View test coverage
pnpm test:unit --coverage
```

### Test Location

```
tests/unit/wac.test.ts
```

## API Integration

### Delivery Processing

When processing a delivery, the API:

1. Fetches current stock: `LocationStock.on_hand` and `LocationStock.wac`
2. Calculates new WAC using `calculateWAC()`
3. Updates stock in transaction:
   ```typescript
   await prisma.locationStock.update({
     where: { location_id_item_id: { location_id, item_id } },
     data: {
       on_hand: { increment: receivedQty },
       wac: result.newWAC,
     },
   });
   ```
4. Stores delivery line with prices for audit

### Issue Processing

When processing an issue, the API:

1. Fetches current stock: `LocationStock.on_hand` and `LocationStock.wac`
2. Validates sufficient stock
3. Uses current WAC for valuation (no recalculation)
4. Deducts quantity:
   ```typescript
   await prisma.locationStock.update({
     where: { location_id_item_id: { location_id, item_id } },
     data: {
       on_hand: { decrement: issuedQty },
       // Note: WAC remains unchanged
     },
   });
   ```

## Performance Considerations

### Calculation Speed

- WAC calculation is O(1) time complexity
- Single arithmetic operation: `(a*b + c*d) / (a+c)`
- No database queries required
- Suitable for real-time calculations

### Database Updates

- Stock updates are atomic within transactions
- Use optimistic locking to prevent race conditions
- Index on `(location_id, item_id)` ensures fast lookups

## Troubleshooting

### Common Issues

**Issue**: WAC not updating after delivery

- **Cause**: Transaction rolled back or database error
- **Solution**: Check transaction logs and ensure database constraints are met

**Issue**: WAC calculation returns NaN

- **Cause**: Invalid input values (NaN, Infinity, etc.)
- **Solution**: Validate inputs before calling calculateWAC()

**Issue**: Rounding differences in reports

- **Cause**: Display rounding vs storage precision
- **Solution**: Always display with 2 decimals for currency, 4 for quantities

## Best Practices

1. **Always use transactions** when updating stock and WAC
2. **Store WAC at transaction time** in transaction line items for audit trail
3. **Validate inputs** before calling calculateWAC()
4. **Handle edge cases** like zero stock explicitly
5. **Round appropriately** for display vs storage
6. **Test with realistic data** including edge cases
7. **Document assumptions** in code comments

## References

- **PRD**: Multi-Location Stock Management System
- **System Design**: Inventory Valuation section
- **CLAUDE.md**: WAC calculation guidelines
- **Prisma Schema**: `LocationStock`, `DeliveryLine`, `IssueLine` models
- **Code**: `server/utils/wac.ts`
- **Tests**: `tests/unit/wac.test.ts`

## Version History

- **v1.0.0** (2025-11-10): Initial implementation with comprehensive testing

---

**Last Updated**: November 10, 2025
**Author**: Stock Management System Development Team
**Status**: Production Ready
