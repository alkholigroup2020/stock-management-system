<script setup lang="ts">
import type { Ref } from "vue";

const expandedSections = ref<string[]>([]);

const toggleSection = (section: string) => {
  if (expandedSections.value.includes(section)) {
    expandedSections.value = [];
  } else {
    expandedSections.value = [section];
  }
};

const isExpanded = (section: string) => expandedSections.value.includes(section);

const targetSubSection = inject<Ref<string | null>>("devTargetSection", ref(null));

watch(
  targetSubSection,
  (newSection) => {
    if (newSection) {
      if (!expandedSections.value.includes(newSection)) {
        expandedSections.value.push(newSection);
      }
      nextTick(() => {
        const element = document.getElementById(`dev-section-${newSection}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        if (targetSubSection.value) {
          targetSubSection.value = null;
        }
      });
    }
  },
  { immediate: true }
);

// Code examples
const codeExamples = {
  routeConventions: `# Server API Route Conventions (/server/api/)

# File naming determines HTTP method and route:
server/api/
├── items/
│   ├── index.get.ts        # GET /api/items
│   ├── index.post.ts       # POST /api/items
│   ├── [id].get.ts         # GET /api/items/:id
│   ├── [id].patch.ts       # PATCH /api/items/:id
│   └── [id].delete.ts      # DELETE /api/items/:id
├── locations/
│   └── [id]/
│       ├── deliveries/
│       │   ├── index.get.ts   # GET /api/locations/:id/deliveries
│       │   └── index.post.ts  # POST /api/locations/:id/deliveries
│       └── issues/
│           └── index.post.ts  # POST /api/locations/:id/issues
└── auth/
    ├── login.post.ts       # POST /api/auth/login
    ├── logout.post.ts      # POST /api/auth/logout
    └── session.get.ts      # GET /api/auth/session

# Naming Rules:
# - index.{method}.ts → Route at parent folder path
# - [param].{method}.ts → Dynamic parameter segment
# - {name}.{method}.ts → Static segment (e.g., login.post.ts)
# - Nested folders create nested paths`,

  defineEventHandler: `import prisma from "../../utils/prisma";
import { z } from "zod";

export default defineEventHandler(async (event) => {
  // User attached by auth middleware (automatically for /api/* routes)
  const user = event.context.user;

  // Get dynamic route parameter
  const locationId = getRouterParam(event, "id");

  // Get query parameters
  const query = getQuery(event);
  const page = parseInt(query.page as string) || 1;
  const limit = parseInt(query.limit as string) || 50;

  // Read request body (for POST, PATCH, PUT)
  const body = await readBody(event);

  // Perform database operations
  const items = await prisma.item.findMany({
    where: { is_active: true },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { name: "asc" },
  });

  // Return response (automatically serialized to JSON)
  return {
    items,
    pagination: {
      page,
      limit,
      total: items.length,
    },
  };
});`,

  zodValidation: `import { z } from "zod";

// Define validation schema
const itemSchema = z.object({
  code: z
    .string()
    .min(1, "Code is required")
    .max(50, "Code must be 50 characters or less")
    .transform((val) => val.toUpperCase()), // Transform to uppercase
  name: z.string().min(1).max(200),
  unit: z.enum(["KG", "EA", "LTR", "BOX", "CASE", "PACK"]),
  category: z.string().max(50).optional(),
  sub_category: z.string().max(50).optional(),
});

// Nested schema for complex requests
const deliveryLineSchema = z.object({
  item_id: z.string().uuid(),
  quantity: z.number().positive("Quantity must be positive"),
  unit_price: z.number().nonnegative("Price cannot be negative"),
});

const deliverySchema = z.object({
  supplier_id: z.string().uuid(),
  invoice_no: z.string().min(1).nullable().optional(),
  delivery_date: z.string(), // ISO date string
  lines: z.array(deliveryLineSchema).min(1, "At least one line required"),
  status: z.enum(["DRAFT", "POSTED"]).default("DRAFT"),
});

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const data = itemSchema.parse(body); // Throws ZodError on failure

    // data is now fully typed with transformations applied
    console.log(data.code); // Guaranteed uppercase

    // ... rest of handler
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "VALIDATION_ERROR",
          message: "Invalid request data",
          details: error.issues, // Array of validation errors
        },
      });
    }
    throw error;
  }
});`,

  createErrorPattern: `// Standard error creation with createError()
throw createError({
  statusCode: 400,              // HTTP status code
  statusMessage: "Bad Request", // HTTP status text
  data: {
    code: "VALIDATION_ERROR",   // App-specific error code
    message: "Invalid item data", // Human-readable message
    details: error.issues,      // Optional: additional context
  },
});

// Common error patterns in the application:

// 401 - Not Authenticated
throw createError({
  statusCode: 401,
  statusMessage: "Unauthorized",
  data: {
    code: "NOT_AUTHENTICATED",
    message: "You must be logged in to access this resource",
  },
});

// 403 - Forbidden (authenticated but not authorized)
throw createError({
  statusCode: 403,
  statusMessage: "Forbidden",
  data: {
    code: "INSUFFICIENT_PERMISSIONS",
    message: "Only admins can create items",
  },
});

// 404 - Not Found
throw createError({
  statusCode: 404,
  statusMessage: "Not Found",
  data: {
    code: "LOCATION_NOT_FOUND",
    message: "Location not found",
  },
});

// 409 - Conflict (duplicate resource)
throw createError({
  statusCode: 409,
  statusMessage: "Conflict",
  data: {
    code: "DUPLICATE_CODE",
    message: \`Item with code '\${data.code}' already exists\`,
  },
});

// 500 - Internal Server Error
throw createError({
  statusCode: 500,
  statusMessage: "Internal Server Error",
  data: {
    code: "INTERNAL_ERROR",
    message: "Failed to create item",
  },
});`,

  errorCodes: `// Standard error codes used across the application:

const ERROR_CODES = {
  // Authentication & Authorization
  NOT_AUTHENTICATED: "User not logged in",
  INSUFFICIENT_PERMISSIONS: "Role cannot perform action",
  LOCATION_ACCESS_DENIED: "User has no access to location",

  // Validation
  VALIDATION_ERROR: "Request data failed validation",
  MISSING_LOCATION_ID: "Location ID required in route",

  // Business Logic
  INSUFFICIENT_STOCK: "Not enough stock for operation",
  PERIOD_CLOSED: "Period is closed, no transactions allowed",
  NO_OPEN_PERIOD: "No open accounting period",
  PRICE_VARIANCE: "Delivery price differs from period price",

  // Resource Errors
  NOT_FOUND: "Generic not found",
  LOCATION_NOT_FOUND: "Location doesn't exist",
  SUPPLIER_NOT_FOUND: "Supplier doesn't exist",
  ITEM_NOT_FOUND: "Item doesn't exist",
  INVALID_ITEMS: "One or more items invalid or inactive",

  // Conflict Errors
  DUPLICATE_CODE: "Code already exists",
  DUPLICATE_ENTRY: "Record already exists",

  // System Errors
  INTERNAL_ERROR: "Unexpected server error",
  DATABASE_ERROR: "Database operation failed",
};

// Usage in error handling:
if (items.length !== itemIds.length) {
  throw createError({
    statusCode: 400,
    statusMessage: "Bad Request",
    data: {
      code: "INVALID_ITEMS",
      message: "One or more items not found or inactive",
    },
  });
}`,

  responseFormat: `// SUCCESS RESPONSES

// Single resource creation
return {
  item,
  message: "Item created successfully",
};

// Resource with metadata
return {
  id: delivery.id,
  message: "Delivery posted successfully",
  delivery: {
    id: delivery.id,
    delivery_no: delivery.delivery_no,
    status: delivery.status,
    // ... selected fields
  },
  lines: createdLines,
  ncrs: createdNCRs, // Side effects (auto-created NCRs)
};

// List with pagination
return {
  items,
  pagination: {
    page,
    limit,
    total: totalCount,
    totalPages: Math.ceil(totalCount / limit),
  },
};

// Simple confirmation
return {
  success: true,
  message: "Location deleted successfully",
};

// ERROR RESPONSES (thrown via createError)
// Always include:
// - statusCode: HTTP status
// - statusMessage: HTTP status text
// - data.code: App-specific error code
// - data.message: Human-readable message
// - data.details: (optional) Additional context

throw createError({
  statusCode: 400,
  data: {
    code: "INSUFFICIENT_STOCK",
    message: "Not enough stock to complete issue",
    details: {
      item_id: "uuid",
      requested: 100,
      available: 50,
    },
  },
});`,

  transactionPatterns: `// BATCH READS: Array of queries executed together
const [location, period, supplier, items] = await prisma.$transaction([
  prisma.location.findUnique({ where: { id: locationId } }),
  prisma.period.findFirst({ where: { status: "OPEN" } }),
  prisma.supplier.findUnique({ where: { id: data.supplier_id } }),
  prisma.item.findMany({ where: { id: { in: itemIds } } }),
]);

// INTERACTIVE TRANSACTION: Atomic writes with rollback
const result = await prisma.$transaction(
  async (tx) => {
    // Generate delivery number
    const deliveryNo = await generateDeliveryNumber();

    // Create delivery header
    const delivery = await tx.delivery.create({
      data: {
        delivery_no: deliveryNo,
        location_id: locationId,
        supplier_id: data.supplier_id,
        // ...
      },
    });

    // Process each line item
    for (const lineData of data.lines) {
      // Create delivery line
      await tx.deliveryLine.create({
        data: {
          delivery_id: delivery.id,
          item_id: lineData.item_id,
          quantity: lineData.quantity,
          unit_price: lineData.unit_price,
        },
      });

      // Update stock with upsert (insert or update)
      await tx.locationStock.upsert({
        where: {
          location_id_item_id: {
            location_id: locationId,
            item_id: lineData.item_id,
          },
        },
        update: {
          on_hand: { increment: lineData.quantity },
          wac: newWAC,
        },
        create: {
          location_id: locationId,
          item_id: lineData.item_id,
          on_hand: lineData.quantity,
          wac: newWAC,
        },
      });
    }

    // Update delivery totals
    return await tx.delivery.update({
      where: { id: delivery.id },
      data: { total_amount: totalAmount },
    });
  },
  {
    maxWait: 10000, // Max wait for transaction slot (10s)
    timeout: 30000, // Max transaction duration (30s)
  }
);`,

  authContext: `// Auth middleware (server/middleware/auth.ts) runs on all /api/* routes
// It attaches user to event.context.user

export default defineEventHandler(async (event) => {
  // User is attached by auth middleware
  const user = event.context.user;

  // Check authentication
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      data: {
        code: "NOT_AUTHENTICATED",
        message: "You must be logged in",
      },
    });
  }

  // Check role-based permissions
  if (user.role !== "ADMIN") {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      data: {
        code: "INSUFFICIENT_PERMISSIONS",
        message: "Only admins can perform this action",
      },
    });
  }

  // Check role hierarchy
  const roleHierarchy = ["OPERATOR", "SUPERVISOR", "ADMIN"];
  const userRoleIndex = roleHierarchy.indexOf(user.role);
  const requiredRoleIndex = roleHierarchy.indexOf("SUPERVISOR");

  if (userRoleIndex < requiredRoleIndex) {
    throw createError({
      statusCode: 403,
      data: {
        code: "INSUFFICIENT_PERMISSIONS",
        message: "Supervisor or higher role required",
      },
    });
  }

  // Access user properties
  console.log(user.id);              // User UUID
  console.log(user.username);        // Username
  console.log(user.email);           // Email
  console.log(user.role);            // OPERATOR | SUPERVISOR | ADMIN
  console.log(user.default_location_id); // Default location (nullable)
});`,

  locationAccess: `// Location access middleware (server/middleware/location-access.ts)
// Runs on /api/locations/[id]/* routes

// Middleware automatically checks:
// - ADMIN/SUPERVISOR: Access to all locations (implicit)
// - OPERATOR: Must have UserLocation assignment

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const locationId = getRouterParam(event, "id");

  // For Operators, manually verify access if needed
  if (user.role === "OPERATOR") {
    const userLocation = await prisma.userLocation.findUnique({
      where: {
        user_id_location_id: {
          user_id: user.id,
          location_id: locationId,
        },
      },
    });

    if (!userLocation) {
      throw createError({
        statusCode: 403,
        data: {
          code: "LOCATION_ACCESS_DENIED",
          message: "You do not have access to this location",
        },
      });
    }
  }

  // locationId also available from context
  const contextLocationId = event.context.locationId;
});`,

  authMiddleware: `// server/middleware/auth.ts
// Protects all /api/* routes (except public auth routes)

import type { UserRole } from "@prisma/client";

interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  default_location_id: string | null;
}

export default defineEventHandler(async (event) => {
  const path = event.node.req.url || "";

  // Skip for non-API routes
  if (!path.startsWith("/api")) return;

  // Skip for public routes
  const publicRoutes = [
    "/api/auth/login",
    "/api/auth/logout",
    "/api/auth/session",
    "/api/auth/register",
    "/api/health",
  ];
  if (publicRoutes.some((route) => path.startsWith(route))) return;

  // Get session from nuxt-auth-utils
  const session = await getUserSession(event);

  if (!session.user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      data: {
        code: "NOT_AUTHENTICATED",
        message: "You must be logged in to access this resource",
      },
    });
  }

  // Attach user to context for route handlers
  event.context.user = session.user;
});`,

  completeExample: `/**
 * POST /api/items
 * Create a new item (ADMIN only)
 */
import prisma from "../../utils/prisma";
import { z } from "zod";

const itemSchema = z.object({
  code: z.string().min(1).max(50).transform((v) => v.toUpperCase()),
  name: z.string().min(1).max(200),
  unit: z.enum(["KG", "EA", "LTR", "BOX", "CASE", "PACK"]),
  category: z.string().max(50).optional(),
});

export default defineEventHandler(async (event) => {
  const user = event.context.user;

  // 1. Check authentication
  if (!user) {
    throw createError({
      statusCode: 401,
      data: { code: "NOT_AUTHENTICATED", message: "Login required" },
    });
  }

  // 2. Check authorization
  if (user.role !== "ADMIN") {
    throw createError({
      statusCode: 403,
      data: { code: "INSUFFICIENT_PERMISSIONS", message: "Admin only" },
    });
  }

  try {
    // 3. Validate request body
    const body = await readBody(event);
    const data = itemSchema.parse(body);

    // 4. Business validation
    const existing = await prisma.item.findUnique({
      where: { code: data.code },
    });
    if (existing) {
      throw createError({
        statusCode: 409,
        data: { code: "DUPLICATE_CODE", message: "Code exists" },
      });
    }

    // 5. Create resource
    const item = await prisma.item.create({
      data: { ...data, is_active: true },
    });

    // 6. Return success response
    return { item, message: "Item created successfully" };

  } catch (error) {
    // 7. Handle Zod errors
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        data: {
          code: "VALIDATION_ERROR",
          message: "Invalid data",
          details: error.issues,
        },
      });
    }

    // 8. Re-throw known errors
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    // 9. Handle unexpected errors
    console.error("Error:", error);
    throw createError({
      statusCode: 500,
      data: { code: "INTERNAL_ERROR", message: "Failed to create item" },
    });
  }
});`,
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="border-b border-[var(--ui-border)] pb-4">
      <h2 class="text-2xl font-bold text-[var(--ui-text-highlighted)]">Server API Patterns</h2>
      <p class="mt-1 text-sm text-[var(--ui-text-muted)]">
        API route development patterns, request validation, error handling, and best practices
      </p>
    </div>

    <!-- API Route Conventions Section -->
    <section
      id="dev-section-route-conventions"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('route-conventions')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-folder" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">API Route Conventions</span>
        </span>
        <UIcon
          :name="
            isExpanded('route-conventions') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('route-conventions')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Server API routes follow Nitro/H3 file-based routing conventions. File names determine
          both the HTTP method and URL path.
        </p>

        <DeveloperCodeBlock
          :code="codeExamples.routeConventions"
          language="bash"
          filename="server/api/"
        />

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Key Conventions</h4>
          <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>
                <code class="code-inline">index.{method}.ts</code>
                for collection routes (e.g.,
                <code class="code-inline">/api/items</code>
                )
              </span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>
                <code class="code-inline">[param].{method}.ts</code>
                for dynamic parameters (e.g.,
                <code class="code-inline">/api/items/:id</code>
                )
              </span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>
                <code class="code-inline">{name}.{method}.ts</code>
                for action routes (e.g.,
                <code class="code-inline">/api/auth/login</code>
                )
              </span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>
                Nested folders create nested URL paths (e.g.,
                <code class="code-inline">/api/locations/:id/deliveries</code>
                )
              </span>
            </li>
          </ul>
        </div>

        <div class="rounded-lg border border-[var(--ui-info)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-info)]">
            <UIcon name="i-heroicons-information-circle" class="mt-0.5 shrink-0" />
            <span>
              Methods:
              <code class="code-inline">.get.ts</code>
              ,
              <code class="code-inline">.post.ts</code>
              ,
              <code class="code-inline">.patch.ts</code>
              ,
              <code class="code-inline">.put.ts</code>
              ,
              <code class="code-inline">.delete.ts</code>
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- defineEventHandler Patterns Section -->
    <section
      id="dev-section-event-handler"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('event-handler')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-code-bracket" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            defineEventHandler Patterns
          </span>
        </span>
        <UIcon
          :name="
            isExpanded('event-handler') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('event-handler')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          All API routes export a default
          <code class="code-inline">defineEventHandler</code>
          function that receives the H3 event object.
        </p>

        <DeveloperCodeBlock :code="codeExamples.defineEventHandler" language="typescript" />

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Common Utilities</h4>
          <div class="space-y-2">
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <code class="code-inline">event.context.user</code>
              <span class="ml-2 text-sm text-[var(--ui-text-muted)]">
                Authenticated user (set by auth middleware)
              </span>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <code class="code-inline">getRouterParam(event, "id")</code>
              <span class="ml-2 text-sm text-[var(--ui-text-muted)]">
                Get dynamic route parameter
              </span>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <code class="code-inline">getQuery(event)</code>
              <span class="ml-2 text-sm text-[var(--ui-text-muted)]">Get URL query parameters</span>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <code class="code-inline">await readBody(event)</code>
              <span class="ml-2 text-sm text-[var(--ui-text-muted)]">Read JSON request body</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Request Validation with Zod Section -->
    <section
      id="dev-section-zod-validation"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('zod-validation')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-shield-check" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            Request Validation with Zod
          </span>
        </span>
        <UIcon
          :name="
            isExpanded('zod-validation') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('zod-validation')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          All request bodies are validated using Zod schemas. This provides type safety, automatic
          transformations, and detailed error messages.
        </p>

        <DeveloperCodeBlock :code="codeExamples.zodValidation" language="typescript" />

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Zod Best Practices</h4>
          <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>
                Use
                <code class="code-inline">.transform()</code>
                for data normalization (e.g., uppercase codes)
              </span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>Add custom error messages for user-friendly validation feedback</span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>
                Use
                <code class="code-inline">.uuid()</code>
                for all ID fields
              </span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>
                Use
                <code class="code-inline">.enum()</code>
                for predefined values
              </span>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Error Handling with createError Section -->
    <section
      id="dev-section-create-error"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('create-error')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-exclamation-triangle" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            Error Handling with createError
          </span>
        </span>
        <UIcon
          :name="isExpanded('create-error') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('create-error')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Use
          <code class="code-inline">createError()</code>
          from H3 to throw structured errors with proper HTTP status codes and application-specific
          error codes.
        </p>

        <DeveloperCodeBlock :code="codeExamples.createErrorPattern" language="typescript" />

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Error Structure</h4>
          <div class="space-y-2">
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="error" variant="soft">statusCode</UBadge>
                <span class="text-sm text-[var(--ui-text-muted)]">
                  HTTP status code (400, 401, 403, 404, 409, 500)
                </span>
              </div>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="warning" variant="soft">data.code</UBadge>
                <span class="text-sm text-[var(--ui-text-muted)]">
                  App-specific error code (e.g., INSUFFICIENT_STOCK)
                </span>
              </div>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="info" variant="soft">data.message</UBadge>
                <span class="text-sm text-[var(--ui-text-muted)]">
                  Human-readable error message
                </span>
              </div>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="neutral" variant="soft">data.details</UBadge>
                <span class="text-sm text-[var(--ui-text-muted)]">
                  Optional additional context (validation errors, IDs, etc.)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Standard Error Codes Section -->
    <section
      id="dev-section-error-codes"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('error-codes')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-tag" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Standard Error Codes</span>
        </span>
        <UIcon
          :name="isExpanded('error-codes') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('error-codes')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Consistent error codes across the application enable client-side error handling and
          user-friendly messages.
        </p>

        <DeveloperCodeBlock :code="codeExamples.errorCodes" language="typescript" />

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Critical Business Errors</h4>
          <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
            <li class="flex items-start gap-2">
              <UBadge color="error" variant="soft" size="xs">INSUFFICIENT_STOCK</UBadge>
              <span>Not enough stock for issue/transfer operation</span>
            </li>
            <li class="flex items-start gap-2">
              <UBadge color="error" variant="soft" size="xs">PERIOD_CLOSED</UBadge>
              <span>Attempting to post to a closed accounting period</span>
            </li>
            <li class="flex items-start gap-2">
              <UBadge color="warning" variant="soft" size="xs">PRICE_VARIANCE</UBadge>
              <span>Delivery price differs from period-locked price (NCR created)</span>
            </li>
            <li class="flex items-start gap-2">
              <UBadge color="warning" variant="soft" size="xs">LOCATION_ACCESS_DENIED</UBadge>
              <span>User doesn't have access to the requested location</span>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Response Format Standards Section -->
    <section
      id="dev-section-response-format"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('response-format')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-document-text" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            Response Format Standards
          </span>
        </span>
        <UIcon
          :name="
            isExpanded('response-format') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('response-format')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Consistent response structures make frontend integration predictable and maintainable.
        </p>

        <DeveloperCodeBlock :code="codeExamples.responseFormat" language="typescript" />

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Response Patterns</h4>
          <div class="space-y-2">
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="success" variant="soft">Create</UBadge>
                <span class="text-sm text-[var(--ui-text-muted)]">
                  Return created resource + success message
                </span>
              </div>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="primary" variant="soft">List</UBadge>
                <span class="text-sm text-[var(--ui-text-muted)]">
                  Return array + pagination metadata
                </span>
              </div>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="info" variant="soft">Complex</UBadge>
                <span class="text-sm text-[var(--ui-text-muted)]">
                  Include side effects (e.g., auto-created NCRs)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Prisma Transactions in Routes Section -->
    <section
      id="dev-section-transactions"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('transactions')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-arrow-path" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            Prisma Transactions in Routes
          </span>
        </span>
        <UIcon
          :name="isExpanded('transactions') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('transactions')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Use Prisma transactions for atomic operations. Batch reads for performance, interactive
          transactions for multi-step writes.
        </p>

        <DeveloperCodeBlock :code="codeExamples.transactionPatterns" language="typescript" />

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Transaction Types</h4>
          <div class="space-y-2">
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="primary" variant="soft">$transaction([])</UBadge>
              </div>
              <p class="mt-1 text-sm text-[var(--ui-text-muted)]">
                Batch multiple independent queries into a single database round-trip. Returns array
                of results.
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="success" variant="soft">$transaction(async tx)</UBadge>
              </div>
              <p class="mt-1 text-sm text-[var(--ui-text-muted)]">
                Interactive transaction for atomic writes. All operations succeed or all rollback.
              </p>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-[var(--ui-warning)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-warning)]">
            <UIcon name="i-heroicons-exclamation-triangle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Important:</strong>
              Set appropriate timeout values for complex transactions. Default is 5 seconds, but
              delivery posting may need 30 seconds.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Auth Context Section -->
    <section
      id="dev-section-auth-context"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('auth-context')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-user-circle" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            Auth Context (event.context.user)
          </span>
        </span>
        <UIcon
          :name="isExpanded('auth-context') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('auth-context')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          The auth middleware automatically attaches the authenticated user to
          <code class="code-inline">event.context.user</code>
          for all protected API routes.
        </p>

        <DeveloperCodeBlock :code="codeExamples.authContext" language="typescript" />

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">User Properties</h4>
          <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
            <li>
              <code class="code-inline">user.id</code>
              - UUID of the authenticated user
            </li>
            <li>
              <code class="code-inline">user.username</code>
              - Login username
            </li>
            <li>
              <code class="code-inline">user.email</code>
              - User email address
            </li>
            <li>
              <code class="code-inline">user.role</code>
              - OPERATOR | SUPERVISOR | ADMIN
            </li>
            <li>
              <code class="code-inline">user.default_location_id</code>
              - Default location (nullable)
            </li>
          </ul>
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Role Hierarchy</h4>
          <div class="flex items-center gap-2">
            <UBadge color="neutral" variant="soft">OPERATOR</UBadge>
            <UIcon name="i-heroicons-arrow-right" class="text-[var(--ui-text-muted)]" />
            <UBadge color="primary" variant="soft">SUPERVISOR</UBadge>
            <UIcon name="i-heroicons-arrow-right" class="text-[var(--ui-text-muted)]" />
            <UBadge color="success" variant="soft">ADMIN</UBadge>
          </div>
        </div>
      </div>
    </section>

    <!-- Auth Middleware Section -->
    <section
      id="dev-section-auth-middleware"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('auth-middleware')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-lock-closed" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Auth Middleware</span>
        </span>
        <UIcon
          :name="
            isExpanded('auth-middleware') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('auth-middleware')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          The auth middleware protects all
          <code class="code-inline">/api/*</code>
          routes automatically. Public routes are explicitly excluded.
        </p>

        <DeveloperCodeBlock
          :code="codeExamples.authMiddleware"
          language="typescript"
          filename="server/middleware/auth.ts"
        />

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Public Routes (No Auth)</h4>
          <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
            <li>
              <code class="code-inline">/api/auth/login</code>
              - Login endpoint
            </li>
            <li>
              <code class="code-inline">/api/auth/logout</code>
              - Logout endpoint
            </li>
            <li>
              <code class="code-inline">/api/auth/session</code>
              - Session check
            </li>
            <li>
              <code class="code-inline">/api/auth/register</code>
              - User registration
            </li>
            <li>
              <code class="code-inline">/api/health</code>
              - Health check
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Location Access Middleware Section -->
    <section
      id="dev-section-location-middleware"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('location-middleware')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-map-pin" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            Location Access Middleware
          </span>
        </span>
        <UIcon
          :name="
            isExpanded('location-middleware')
              ? 'i-heroicons-chevron-up'
              : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('location-middleware')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Location access middleware controls which locations users can access. Applies to
          <code class="code-inline">/api/locations/[id]/*</code>
          routes.
        </p>

        <DeveloperCodeBlock
          :code="codeExamples.locationAccess"
          language="typescript"
          filename="server/middleware/location-access.ts"
        />

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Access Rules</h4>
          <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
            <li class="flex items-start gap-2">
              <UBadge color="success" variant="soft" size="xs">ADMIN</UBadge>
              <span>Access to all locations (implicit)</span>
            </li>
            <li class="flex items-start gap-2">
              <UBadge color="primary" variant="soft" size="xs">SUPERVISOR</UBadge>
              <span>Access to all locations (implicit)</span>
            </li>
            <li class="flex items-start gap-2">
              <UBadge color="neutral" variant="soft" size="xs">OPERATOR</UBadge>
              <span>Access only to assigned locations (via UserLocation table)</span>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Complete Example Section -->
    <section
      id="dev-section-complete-example"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('complete-example')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-document-check" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Complete API Example</span>
        </span>
        <UIcon
          :name="
            isExpanded('complete-example') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('complete-example')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          A complete example showing all patterns together: authentication, authorization,
          validation, database operations, and error handling.
        </p>

        <DeveloperCodeBlock
          :code="codeExamples.completeExample"
          language="typescript"
          filename="server/api/items/index.post.ts"
        />

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Handler Flow</h4>
          <ol class="space-y-1 text-sm text-[var(--ui-text-muted)]">
            <li>1. Check authentication (user exists in context)</li>
            <li>2. Check authorization (role permissions)</li>
            <li>3. Validate request body with Zod schema</li>
            <li>4. Business logic validation (e.g., check duplicates)</li>
            <li>5. Perform database operation</li>
            <li>6. Return success response</li>
            <li>7. Handle Zod validation errors</li>
            <li>8. Re-throw known errors (createError)</li>
            <li>9. Catch and wrap unexpected errors</li>
          </ol>
        </div>

        <div class="rounded-lg border border-[var(--ui-success)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-success)]">
            <UIcon name="i-heroicons-check-circle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Best Practice:</strong>
              Always follow this consistent structure for predictable, maintainable API routes.
            </span>
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
@reference "~/assets/css/main.css";

.code-inline {
  @apply rounded bg-[var(--ui-bg-muted)] px-1.5 py-0.5 font-mono text-xs;
}
</style>
