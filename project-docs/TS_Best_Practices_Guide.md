### TypeScript Best Practices and Type Safety

**CRITICAL:** This project maintains **strict TypeScript type safety**. Never use `any` types. Always run `pnpm typecheck` after completing any task.

#### Mandatory Type Checking Workflow

**After completing ANY task (bug fix, feature, refactor), ALWAYS:**

1. Run `pnpm typecheck` to verify zero TypeScript errors
2. Fix any type errors before considering the task complete
3. Never commit code with TypeScript errors

#### Never Use `any` Types

**❌ NEVER do this:**

```typescript
const data: any = await $fetch('/api/endpoint')
const result: any = someFunction()
catch (err: any) { ... }
const items: any[] = []
```

**✅ ALWAYS do this:**

```typescript
const data = await $fetch('/api/endpoint') as unknown
const response = data as { user: User }

interface Result { id: string; name: string }
const result: Result = someFunction()

catch (err) {
  if (err && typeof err === 'object' && 'data' in err && err.data && typeof err.data === 'object' && 'message' in err.data) {
    error.value = String(err.data.message)
  } else {
    error.value = "An error occurred"
  }
  console.error("Error:", err)
}

const items: unknown[] = []
// or better:
interface Item { id: string; name: string }
const items: Item[] = []
```

#### Common Type Patterns

**1. Interface Definitions**

Always define interfaces for complex data structures:

```typescript
// Server API routes - AuthUser interface
interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  default_location_id: string | null;
  locations?: UserLocation[];
}

// Component props
interface Props {
  item: Item;
  quantity: number;
  readonly?: boolean;
}
```

**2. Error Handling Pattern**

Never use `catch (err: any)`. Use proper type guards:

```typescript
// ❌ WRONG
catch (err: any) {
  console.error(err.message)
}

// ✅ CORRECT
catch (err) {
  if (err && typeof err === 'object' && 'data' in err && err.data && typeof err.data === 'object' && 'message' in err.data) {
    error.value = String(err.data.message)
  } else {
    error.value = "An error occurred"
  }
  console.error("Error:", err)
}

// Server routes
catch (error) {
  // Re-throw H3 createError errors
  if (error && typeof error === 'object' && 'statusCode' in error) {
    throw error
  }

  console.error('Error:', error)
  throw createError({
    statusCode: 500,
    statusMessage: 'Internal Server Error',
    data: { code: 'INTERNAL_ERROR', message: 'Operation failed' }
  })
}
```

**3. Dynamic Objects**

Use `Record<string, unknown>` for dynamic Prisma where clauses:

```typescript
// ❌ WRONG
const where: any = {};

// ✅ CORRECT
const where: Record<string, unknown> = {};
where.is_active = true;
where.location_id = locationId;

// For nested objects, use intermediate variables
const dateFilter: Record<string, Date> = {};
if (startDate) dateFilter.gte = new Date(startDate);
if (endDate) dateFilter.lte = new Date(endDate);
where.created_at = dateFilter;
```

**4. Array Types**

```typescript
// ❌ WRONG
const items: any[] = [];

// ✅ CORRECT - Use unknown[] with type assertions
const items: unknown[] = [];
items.map((item: unknown) => {
  const typedItem = item as { id: string; name: string };
  return typedItem.name;
});

// ✅ BETTER - Define proper interface
interface Item {
  id: string;
  name: string;
}
const items: Item[] = [];
```

**5. Prisma Decimal Serialization**

Prisma `Decimal` types are serialized as `string` in API responses:

```typescript
// API Response Interface
interface DeliveryLine {
  quantity: string | number; // Decimal becomes string
  unit_price: string | number; // Decimal becomes string
  line_value: string | number; // Decimal becomes string
}

// In templates, handle both types:
{
  {
    typeof line.quantity === "number"
      ? line.quantity.toFixed(4)
      : parseFloat(line.quantity).toFixed(4);
  }
}
```

**6. Type Assertions**

Use type assertions responsibly, always through `unknown` first:

```typescript
// ❌ WRONG - Direct assertion
const data = response as User;

// ✅ CORRECT - Assert through unknown
const data = response as unknown;
const user = data as User;

// Only when you're certain of the structure
const response = data as { user: User };
```

**7. Server Route User Context**

Always type user from event context:

```typescript
import type { UserRole } from '@prisma/client'

interface AuthUser {
  id: string
  username: string
  email: string
  role: UserRole
  default_location_id: string | null
}

export default defineEventHandler(async (event) => {
  const user = event.context.user as AuthUser | undefined

  if (!user) {
    throw createError({ statusCode: 401, ... })
  }

  // Now user is typed as AuthUser
})
```

**8. Testing with Invalid Inputs**

Use `@ts-expect-error` for intentional invalid input tests:

```typescript
// In test files only
it("should throw for invalid input", () => {
  // @ts-expect-error - Testing invalid input
  expect(() => calculateWAC("100", 10.0, 50, 12.0)).toThrow();
});
```
