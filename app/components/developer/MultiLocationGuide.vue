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
  locationModel: `// Location Model - Prisma Schema
// File: prisma/schema.prisma

model Location {
  id         String       @id @default(uuid())
  code       String       @unique @db.VarChar(20)
  name       String       @db.VarChar(100)
  type       LocationType
  address    String?      @db.VarChar(255)
  timezone   String       @default("Asia/Riyadh") @db.VarChar(50)
  is_active  Boolean      @default(true)
  created_at DateTime     @default(now())
  updated_at DateTime     @updatedAt

  // Relations
  deliveries       Delivery[]
  issues           Issue[]
  location_stock   LocationStock[]
  period_locations PeriodLocation[]
  transfers_from   Transfer[]       @relation("TransferFrom")
  transfers_to     Transfer[]       @relation("TransferTo")
  user_locations   UserLocation[]
  pobs             POB[]
  reconciliations  Reconciliation[]
  ncrs             NCR[]

  @@index([type])
  @@index([is_active])
}

// Location types enum
enum LocationType {
  KITCHEN    // Food preparation areas
  STORE      // Retail/front-of-house
  CENTRAL    // Central warehouse/hub
  WAREHOUSE  // Storage facility
}`,

  locationTypesUsage: `// Location Type Usage Patterns
// Each type has specific characteristics

// KITCHEN - Food preparation areas
// - Primary consumer of raw ingredients
// - Issues go to FOOD cost centre
// - Receives transfers from CENTRAL/WAREHOUSE

// STORE - Retail/front-of-house locations
// - Direct sales to customers
// - Issues go to various cost centres
// - May receive finished goods from KITCHEN

// CENTRAL - Central distribution hub
// - Receives bulk deliveries from suppliers
// - Distributes to KITCHEN and STORE locations
// - Higher stock levels, more items

// WAREHOUSE - Long-term storage
// - Bulk storage for non-perishables
// - Lower turnover, larger quantities
// - Backup stock for other locations`,

  locationStockModel: `// LocationStock - Per-Location Inventory
// File: prisma/schema.prisma

model LocationStock {
  location_id  String
  item_id      String
  on_hand      Decimal    @default(0) @db.Decimal(12, 4)
  wac          Decimal    @default(0) @db.Decimal(12, 4)
  min_stock    Decimal?   @db.Decimal(12, 4)
  max_stock    Decimal?   @db.Decimal(12, 4)
  last_counted DateTime?
  updated_at   DateTime   @updatedAt

  // Relations
  location Location @relation(fields: [location_id], references: [id])
  item     Item     @relation(fields: [item_id], references: [id])

  // Composite primary key
  @@id([location_id, item_id])
  @@index([location_id])
  @@index([item_id])
}

// Key concepts:
// - Composite key: Each item has separate stock per location
// - on_hand: Current quantity (updated on deliveries/issues/transfers)
// - wac: Weighted Average Cost (calculated per location, not global)
// - min_stock/max_stock: Location-specific thresholds`,

  locationStockOperations: `// Stock Operations Are Location-Scoped
// Every stock change operates on a specific location

// DELIVERY: Adds stock to receiving location
// Updates: LocationStock.on_hand += delivery quantity
// Recalculates: LocationStock.wac using WAC formula

// ISSUE: Deducts stock from issuing location
// Updates: LocationStock.on_hand -= issue quantity
// WAC: Unchanged (issues use current WAC, don't recalculate)

// TRANSFER: Moves stock between locations
// Source: LocationStock.on_hand -= transfer quantity
// Destination: LocationStock.on_hand += transfer quantity
// WAC: Destination recalculates, source unchanged

// Example: Prisma query for location stock
const stock = await prisma.locationStock.findUnique({
  where: {
    location_id_item_id: {
      location_id: "location-uuid",
      item_id: "item-uuid",
    },
  },
});

// Upsert pattern for stock updates
await prisma.locationStock.upsert({
  where: {
    location_id_item_id: {
      location_id: locationId,
      item_id: itemId,
    },
  },
  create: {
    location_id: locationId,
    item_id: itemId,
    on_hand: quantity,
    wac: unitPrice,
  },
  update: {
    on_hand: { increment: quantity },
    // WAC recalculation happens in business logic
  },
});`,

  userLocationModel: `// UserLocation - Access Control
// File: prisma/schema.prisma

model UserLocation {
  user_id     String
  location_id String
  assigned_at DateTime @default(now())
  assigned_by String?

  // Relations
  user     User     @relation(fields: [user_id], references: [id])
  location Location @relation(fields: [location_id], references: [id])

  // Composite primary key
  @@id([user_id, location_id])
  @@index([user_id])
  @@index([location_id])
}

// Access Rules:
// - OPERATOR: Only access locations via UserLocation assignments
// - SUPERVISOR: Implicit access to ALL active locations
// - ADMIN: Implicit access to ALL locations (including inactive)

// User model also has default_location_id for preferred location
model User {
  // ... other fields
  default_location_id String?
  default_location    Location? @relation(fields: [default_location_id])
  locations           UserLocation[]
}`,

  userLocationAssignment: `// Assigning Users to Locations
// File: server/api/locations/[id]/users/index.post.ts

export default defineEventHandler(async (event) => {
  // Admin-only operation
  const currentUser = event.context.user;
  if (currentUser.role !== "ADMIN") {
    throw createError({
      statusCode: 403,
      statusMessage: "Admin access required",
    });
  }

  const locationId = getRouterParam(event, "id");
  const body = await readBody(event);
  const { user_id } = body;

  // Validate location exists and is active
  const location = await prisma.location.findUnique({
    where: { id: locationId },
  });

  if (!location || !location.is_active) {
    throw createError({
      statusCode: 404,
      statusMessage: "Location not found or inactive",
    });
  }

  // Validate user is an OPERATOR (only operators need assignments)
  const targetUser = await prisma.user.findUnique({
    where: { id: user_id },
  });

  if (targetUser?.role !== "OPERATOR") {
    throw createError({
      statusCode: 400,
      statusMessage: "Only OPERATOR users need location assignments",
    });
  }

  // Create assignment (with duplicate check via upsert)
  const assignment = await prisma.userLocation.upsert({
    where: {
      user_id_location_id: { user_id, location_id: locationId },
    },
    create: {
      user_id,
      location_id: locationId,
      assigned_by: currentUser.id,
    },
    update: {}, // Already assigned, no changes
  });

  return { success: true, assignment };
});`,

  locationStoreInterface: `// Location Store - State Interface
// File: app/stores/location.ts

import { defineStore } from "pinia";
import type { Location } from "~~/shared/types/database";

// Extended location with access level
export interface LocationWithAccess extends Location {
  access_level?: "VIEW" | "POST" | "MANAGE";
}

export interface LocationState {
  activeLocationId: string | null;
  userLocations: LocationWithAccess[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  cacheTimeout: number; // Cache duration in milliseconds (5 minutes)
}`,

  locationStoreUsage: `// Location Store Implementation (Options API)
// File: app/stores/location.ts

export const useLocationStore = defineStore("location", {
  state: (): LocationState => ({
    activeLocationId: null,
    userLocations: [],
    loading: false,
    error: null,
    lastFetched: null,
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
  }),

  getters: {
    // Get the active location object
    activeLocation: (state): LocationWithAccess | null => {
      if (!state.activeLocationId) return null;
      return state.userLocations.find((loc) => loc.id === state.activeLocationId) || null;
    },

    // Check if user has any locations
    hasLocations: (state): boolean => state.userLocations.length > 0,

    // Get location by ID (getter factory)
    getLocationById: (state) => {
      return (locationId: string): LocationWithAccess | null => {
        return state.userLocations.find((loc) => loc.id === locationId) || null;
      };
    },

    // Check if cache is still valid
    isCacheValid: (state): boolean => {
      if (!state.lastFetched) return false;
      return Date.now() - state.lastFetched < state.cacheTimeout;
    },
  },

  actions: {
    async fetchUserLocations(forceRefresh = false) {
      if (!forceRefresh && this.isCacheValid && this.userLocations.length > 0) {
        return;
      }

      this.loading = true;
      this.error = null;

      try {
        const response = await $fetch<{ locations: LocationWithAccess[] }>(
          "/api/user/locations"
        );
        this.userLocations = response.locations;
        this.lastFetched = Date.now();

        // Set active location if not set
        if (!this.activeLocationId && this.userLocations.length > 0) {
          const authStore = useAuthStore();
          const defaultLocationId = authStore.user?.default_location_id;

          if (defaultLocationId) {
            const defaultLoc = this.userLocations.find((loc) => loc.id === defaultLocationId);
            this.activeLocationId = defaultLoc ? defaultLocationId : this.userLocations[0]!.id;
          } else {
            this.activeLocationId = this.userLocations[0]!.id;
          }
        }
      } catch (err: any) {
        this.error = err?.data?.message || "Failed to fetch locations";
      } finally {
        this.loading = false;
      }
    },

    async switchLocation(locationId: string) {
      const location = this.getLocationById(locationId);
      if (!location) {
        this.error = "Location not found";
        return false;
      }
      this.activeLocationId = locationId;
      this.error = null;
      return true;
    },

    clearError() { this.error = null; },
    reset() {
      this.activeLocationId = null;
      this.userLocations = [];
      this.loading = false;
      this.error = null;
      this.lastFetched = null;
    },
    invalidateCache() { this.lastFetched = null; },
  },
});`,

  locationSwitcherComponent: `// LocationSwitcher Component
// File: app/components/layout/LocationSwitcher.vue

<script setup lang="ts">
import { useLocationStore } from "~/stores/location";

const locationStore = useLocationStore();
const toast = useAppToast();

// Helper function to get location-specific icon (Lucide icons)
const getLocationIcon = (type: string): string => {
  const icons: Record<string, string> = {
    KITCHEN: "i-lucide-chef-hat",
    STORE: "i-lucide-store",
    CENTRAL: "i-lucide-warehouse",
    WAREHOUSE: "i-lucide-package-2",
  };
  return icons[type] || "i-lucide-map-pin";
};

// Helper function to get location icon color class
const getLocationIconClass = (type: string): string => {
  const classes: Record<string, string> = {
    KITCHEN: "text-amber-600 dark:text-amber-400",
    STORE: "text-emerald-600 dark:text-emerald-400",
    CENTRAL: "text-navy-600 dark:text-navy-400",
    WAREHOUSE: "text-zinc-600 dark:text-zinc-400",
  };
  return classes[type] || "text-zinc-600 dark:text-zinc-400";
};

// Compute dropdown items for UDropdownMenu
const locationItems = computed(() => {
  return [
    locationStore.userLocations.map((location) => ({
      label: location.name,
      icon: getLocationIcon(location.type),
      iconClass: getLocationIconClass(location.type),
      active: location.id === locationStore.activeLocationId,
      onSelect: async () => {
        if (location.id === locationStore.activeLocationId) return;

        const success = await locationStore.switchLocation(location.id);
        if (success) {
          toast.success("Location Changed", {
            description: \`Switched to \${location.name}\`,
          });
          await refreshNuxtData(); // Refresh page data
        }
      },
    })),
  ];
});
\x3C/script>

\x3Ctemplate>
  \x3CUDropdownMenu :items="locationItems" :content="{ side: 'bottom', align: 'center' }">
    \x3Ctemplate #default>
      \x3CUButton color="neutral" variant="ghost" trailing-icon="i-lucide-chevron-down">
        \x3Ctemplate #leading>
          \x3CUIcon :name="getLocationIcon(locationStore.activeLocation?.type || '')" />
        \x3C/template>
        {{ locationStore.activeLocation?.name }}
      \x3C/UButton>
    \x3C/template>
  \x3C/UDropdownMenu>
\x3C/template>`,

  locationAccessMiddleware: `// Location Access Middleware
// File: server/middleware/location-access.ts

import type { UserRole } from "@prisma/client";

// User session type (includes pre-loaded locations array for Operators)
interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  default_location_id: string | null;
  locations?: string[]; // Array of location IDs (for Operators)
}

export default defineEventHandler(async (event) => {
  const path = event.node.req.url || "";

  // Only apply to location-specific routes
  // Pattern: /api/locations/[locationId]/*
  const locationRoutePattern = /^\\/api\\/locations\\/([a-f0-9-]+)/i;
  const match = path.match(locationRoutePattern);

  if (!match) return; // Not a location-specific route

  const locationId = match[1];
  const user = event.context.user as AuthUser | undefined;

  // If no user in context, skip (auth middleware will handle)
  if (!user) return;

  // ADMIN and SUPERVISOR have access to all locations
  if (user.role === "ADMIN" || user.role === "SUPERVISOR") {
    event.context.locationId = locationId;
    return;
  }

  // OPERATOR: Check against pre-loaded locations array (from auth session)
  const hasAccess = user.locations?.includes(locationId);

  if (!hasAccess) {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      data: {
        code: "LOCATION_ACCESS_DENIED",
        message: "You do not have access to this location",
        locationId,
      },
    });
  }

  // Attach location ID to context for route handlers
  event.context.locationId = locationId;

  // Development logging
  if (process.env.NODE_ENV === "development") {
    console.log(\`[Location Access] User \${user.username} (\${user.role}) accessing \${locationId}\`);
  }
});`,

  userLocationsApi: `// User Locations API
// File: server/api/user/locations.get.ts

import prisma from "../../utils/prisma";
import { setCacheHeaders } from "../../utils/performance";

export default defineEventHandler(async (event) => {
  const user = event.context.user;

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      data: {
        code: "UNAUTHORIZED",
        message: "You must be logged in to access this resource",
      },
    });
  }

  try {
    // For ADMIN and SUPERVISOR, return all active locations (implicit access)
    if (user.role === "ADMIN" || user.role === "SUPERVISOR") {
      const locations = await prisma.location.findMany({
        where: { is_active: true },
        orderBy: { name: "asc" },
      });

      setCacheHeaders(event, { maxAge: 2, staleWhileRevalidate: 2 });
      return { locations };
    }

    // For OPERATOR, return only assigned locations
    const userLocations = await prisma.userLocation.findMany({
      where: { user_id: user.id },
      include: { location: true },
    });

    // Filter active locations
    const locations = userLocations
      .filter((ul) => ul.location.is_active)
      .map((ul) => ul.location);

    setCacheHeaders(event, { maxAge: 2, staleWhileRevalidate: 2 });
    return { locations };
  } catch (error) {
    console.error("Error fetching user locations:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: { code: "INTERNAL_ERROR", message: "Failed to fetch user locations" },
    });
  }
});`,

  locationScopedQueries: `// Location-Scoped Query Patterns

// 1. Fetch stock for a specific location
const locationStock = await prisma.locationStock.findMany({
  where: { location_id: locationId },
  include: { item: true },
  orderBy: { item: { name: "asc" } },
});

// 2. Fetch deliveries for a location
const deliveries = await prisma.delivery.findMany({
  where: {
    location_id: locationId,
    delivery_date: {
      gte: startDate,
      lte: endDate,
    },
  },
  include: {
    supplier: true,
    lines: { include: { item: true } },
  },
});

// 3. Fetch transfers involving a location (from or to)
const transfers = await prisma.transfer.findMany({
  where: {
    OR: [
      { from_location_id: locationId },
      { to_location_id: locationId },
    ],
    status: "COMPLETED",
  },
  include: {
    from_location: true,
    to_location: true,
    lines: { include: { item: true } },
  },
});

// 4. Check if item has stock at location
const hasStock = await prisma.locationStock.findUnique({
  where: {
    location_id_item_id: {
      location_id: locationId,
      item_id: itemId,
    },
  },
  select: { on_hand: true },
});

// 5. Period status for a specific location
const periodLocation = await prisma.periodLocation.findUnique({
  where: {
    period_id_location_id: {
      period_id: currentPeriodId,
      location_id: locationId,
    },
  },
});`,

  deliveryWithLocationContext: `// Delivery API with Location Context
// File: server/api/locations/[id]/deliveries/index.post.ts

export default defineEventHandler(async (event) => {
  const locationId = event.context.locationId; // From middleware
  const user = event.context.user;
  const body = await readBody(event);

  // Validate location exists
  const location = await prisma.location.findUnique({
    where: { id: locationId },
  });

  if (!location || !location.is_active) {
    throw createError({
      statusCode: 404,
      statusMessage: "Location not found",
    });
  }

  // Use transaction for atomic stock updates
  const result = await prisma.$transaction(async (tx) => {
    // Create delivery header
    const delivery = await tx.delivery.create({
      data: {
        location_id: locationId,
        supplier_id: body.supplier_id,
        delivery_date: new Date(body.delivery_date),
        reference_number: body.reference_number,
        created_by: user.id,
        status: "DRAFT",
      },
    });

    // Create lines and update stock
    for (const line of body.lines) {
      // Create delivery line
      await tx.deliveryLine.create({
        data: {
          delivery_id: delivery.id,
          item_id: line.item_id,
          quantity: line.quantity,
          unit_price: line.unit_price,
          period_price: line.period_price,
        },
      });

      // Update location-specific stock with WAC recalculation
      const currentStock = await tx.locationStock.findUnique({
        where: {
          location_id_item_id: {
            location_id: locationId,
            item_id: line.item_id,
          },
        },
      });

      const currentQty = currentStock?.on_hand.toNumber() || 0;
      const currentWac = currentStock?.wac.toNumber() || 0;
      const newQty = currentQty + line.quantity;
      const newWac = calculateWAC(
        currentQty,
        currentWac,
        line.quantity,
        line.unit_price
      );

      await tx.locationStock.upsert({
        where: {
          location_id_item_id: {
            location_id: locationId,
            item_id: line.item_id,
          },
        },
        create: {
          location_id: locationId,
          item_id: line.item_id,
          on_hand: newQty,
          wac: newWac,
        },
        update: {
          on_hand: newQty,
          wac: newWac,
        },
      });
    }

    return delivery;
  }, { timeout: 30000 }); // 30s for multi-line deliveries

  return { success: true, delivery: result };
});`,

  locationContextDiagram: `// Multi-Location Data Flow
//
// ┌─────────────────────────────────────────────────────────────┐
// │                        USER                                 │
// │  ┌─────────────────────────────────────────────────────┐    │
// │  │ Role: OPERATOR | SUPERVISOR | ADMIN                 │    │
// │  │ Default Location: Kitchen A                         │    │
// │  │ Assigned Locations: [Kitchen A, Store 1]            │    │
// │  └─────────────────────────────────────────────────────┘    │
// └───────────────────────────┬─────────────────────────────────┘
//                             │
//              ┌──────────────┴──────────────┐
//              ▼                             ▼
// ┌─────────────────────┐        ┌─────────────────────┐
// │    KITCHEN A        │        │      STORE 1        │
// │  ─────────────────  │        │  ─────────────────  │
// │  LocationStock:     │        │  LocationStock:     │
// │  - Item A: 100 kg   │◄──────►│  - Item A: 25 kg    │
// │  - Item B: 50 ea    │Transfer│  - Item B: 10 ea    │
// │  - WAC: SAR 5.00    │        │  - WAC: SAR 5.20    │
// │                     │        │                     │
// │  Deliveries: ───────│        │  Issues: ───────────│
// │  From Suppliers     │        │  To Cost Centres    │
// └─────────────────────┘        └─────────────────────┘
//           │                              │
//           └──────────┬───────────────────┘
//                      │
//                      ▼
// ┌─────────────────────────────────────────────────────────────┐
// │                      PERIOD                                 │
// │  ┌─────────────────────────────────────────────────────┐    │
// │  │  PeriodLocation (Kitchen A): OPEN                   │    │
// │  │  PeriodLocation (Store 1): READY                    │    │
// │  │  ItemPrices: Locked at period start                 │    │
// │  └─────────────────────────────────────────────────────┘    │
// └─────────────────────────────────────────────────────────────┘`,

  locationTypeIcons: `// Location Type Visual Patterns
// Consistent Lucide icons and colors across the app

// Icon mapping (Lucide icons)
const locationIcons: Record<LocationType, string> = {
  KITCHEN: "i-lucide-chef-hat",    // Chef hat for cooking
  STORE: "i-lucide-store",         // Storefront
  CENTRAL: "i-lucide-warehouse",   // Warehouse for central hub
  WAREHOUSE: "i-lucide-package-2", // Package for storage
};

// Color mapping (Tailwind classes with dark mode support)
const locationIconClasses: Record<LocationType, string> = {
  KITCHEN: "text-amber-600 dark:text-amber-400",
  STORE: "text-emerald-600 dark:text-emerald-400",
  CENTRAL: "text-navy-600 dark:text-navy-400",
  WAREHOUSE: "text-zinc-600 dark:text-zinc-400",
};

// Badge component usage
\x3CUBadge :color="locationColors[location.type]" variant="soft">
  {{ location.type }}
\x3C/UBadge>

// Icon with color class
\x3CUIcon
  :name="locationIcons[location.type]"
  :class="locationIconClasses[location.type]"
/>`,

  accessCheckPatterns: `// Access Check Patterns

// 1. In components - using auth store
const authStore = useAuthStore();
const locationStore = useLocationStore();

// Check if user can post transactions at active location
const canPost = computed(() =>
  authStore.canPostAtLocation(locationStore.activeLocationId ?? "")
);

// Check if user can view location
const canView = computed(() =>
  authStore.hasLocationAccess(locationStore.activeLocationId ?? "")
);

// 2. In server routes - from event context
export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const locationId = event.context.locationId; // From middleware

  // For explicit checks beyond middleware
  if (user.role === "OPERATOR") {
    const hasAccess = await prisma.userLocation.findUnique({
      where: {
        user_id_location_id: {
          user_id: user.id,
          location_id: locationId,
        },
      },
    });
    if (!hasAccess) {
      throw createError({
        statusCode: 403,
        statusMessage: "Location access denied",
      });
    }
  }
});

// 3. Using usePermissions composable
const permissions = usePermissions();

// Check location-specific permission
const canManageStock = computed(() =>
  permissions.canManageLocation(activeLocationId.value)
);`,
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="border-b border-[var(--ui-border)] pb-4">
      <h2 class="text-2xl font-bold text-[var(--ui-text-highlighted)]">Multi-Location System</h2>
      <p class="mt-1 text-sm text-[var(--ui-text-muted)]">
        Location-based operations, stock isolation, and user access control
      </p>
    </div>

    <!-- Location Model Section -->
    <section
      id="dev-section-location-model"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('location-model')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-map-pin" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Location Model & Types</span>
        </span>
        <UIcon
          :name="isExpanded('location-model') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('location-model')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          The Location model is the central entity in the multi-location system. Each location
          represents a physical site with its own inventory, transactions, and period status.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Location Schema</h4>
          <DeveloperCodeBlock
            :code="codeExamples.locationModel"
            language="typescript"
            filename="prisma/schema.prisma"
          />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Location Types</h4>
          <div class="grid gap-2 sm:grid-cols-2">
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-chef-hat" class="text-amber-600 dark:text-amber-400" />
                <span class="font-medium text-[var(--ui-text-highlighted)]">KITCHEN</span>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                Food preparation areas. Primary consumer of raw ingredients.
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-store" class="text-emerald-600 dark:text-emerald-400" />
                <span class="font-medium text-[var(--ui-text-highlighted)]">STORE</span>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                Retail/front-of-house locations. Direct sales to customers.
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-warehouse" class="text-navy-600 dark:text-navy-400" />
                <span class="font-medium text-[var(--ui-text-highlighted)]">CENTRAL</span>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                Central distribution hub. Receives bulk deliveries, distributes to others.
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-package-2" class="text-zinc-600 dark:text-zinc-400" />
                <span class="font-medium text-[var(--ui-text-highlighted)]">WAREHOUSE</span>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                Long-term storage facility. Bulk storage for non-perishables.
              </p>
            </div>
          </div>
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Type Usage Patterns</h4>
          <DeveloperCodeBlock :code="codeExamples.locationTypesUsage" language="typescript" />
        </div>
      </div>
    </section>

    <!-- LocationStock Section -->
    <section
      id="dev-section-location-stock"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('location-stock')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-cube-transparent" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]"
            >LocationStock (Per-Location Inventory)</span
          >
        </span>
        <UIcon
          :name="
            isExpanded('location-stock') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('location-stock')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          LocationStock maintains per-location inventory with isolated stock levels and WAC
          (Weighted Average Cost) for each item at each location.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">LocationStock Model</h4>
          <DeveloperCodeBlock
            :code="codeExamples.locationStockModel"
            language="typescript"
            filename="prisma/schema.prisma"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Stock Operations</h4>
          <DeveloperCodeBlock :code="codeExamples.locationStockOperations" language="typescript" />
        </div>

        <div class="rounded-lg border border-[var(--ui-error)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-error)]">
            <UIcon name="i-heroicons-exclamation-circle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Critical:</strong> Stock is completely isolated per location. An item with 100
              units at Kitchen A has no relationship to the same item at Store B.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- User-Location Assignment Section -->
    <section
      id="dev-section-user-location"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('user-location')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-user-group" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]"
            >User-Location Assignment</span
          >
        </span>
        <UIcon
          :name="
            isExpanded('user-location') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('user-location')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          The UserLocation table controls which users can access which locations. Access rules vary
          by role.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">UserLocation Model</h4>
          <DeveloperCodeBlock
            :code="codeExamples.userLocationModel"
            language="typescript"
            filename="prisma/schema.prisma"
          />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Access Rules by Role</h4>
          <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
            <li class="flex items-start gap-2">
              <UBadge color="neutral" variant="soft" size="xs">OPERATOR</UBadge>
              <span>Only access locations explicitly assigned via UserLocation table</span>
            </li>
            <li class="flex items-start gap-2">
              <UBadge color="warning" variant="soft" size="xs">SUPERVISOR</UBadge>
              <span>Implicit access to ALL active locations (no assignment needed)</span>
            </li>
            <li class="flex items-start gap-2">
              <UBadge color="error" variant="soft" size="xs">ADMIN</UBadge>
              <span>Implicit access to ALL locations, including inactive</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Assignment API</h4>
          <DeveloperCodeBlock
            :code="codeExamples.userLocationAssignment"
            language="typescript"
            filename="server/api/locations/[id]/users/index.post.ts"
          />
        </div>
      </div>
    </section>

    <!-- Location Switching UI Section -->
    <section
      id="dev-section-location-switching"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('location-switching')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-arrows-right-left" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Location Switching UI</span>
        </span>
        <UIcon
          :name="
            isExpanded('location-switching')
              ? 'i-heroicons-chevron-up'
              : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('location-switching')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          The Location Store manages the active location state, and the LocationSwitcher component
          provides the UI for users to change their working location.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Location Store Interface</h4>
          <DeveloperCodeBlock
            :code="codeExamples.locationStoreInterface"
            language="typescript"
            filename="app/stores/location.ts"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Store Implementation</h4>
          <DeveloperCodeBlock
            :code="codeExamples.locationStoreUsage"
            language="typescript"
            filename="app/stores/location.ts"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">LocationSwitcher Component</h4>
          <DeveloperCodeBlock
            :code="codeExamples.locationSwitcherComponent"
            language="vue"
            filename="app/components/layout/LocationSwitcher.vue"
          />
        </div>

        <div class="rounded-lg border border-[var(--ui-warning)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-warning)]">
            <UIcon name="i-heroicons-exclamation-triangle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Important:</strong> Always call
              <code class="code-inline">refreshNuxtData()</code> after switching locations to update
              page data with the new location context.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Location Context in API Routes Section -->
    <section
      id="dev-section-location-context"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('location-context')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-server" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]"
            >Location Context in API Routes</span
          >
        </span>
        <UIcon
          :name="
            isExpanded('location-context') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('location-context')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Server routes receive location context from middleware and use it to scope all database
          operations to the correct location.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">User Locations API</h4>
          <DeveloperCodeBlock
            :code="codeExamples.userLocationsApi"
            language="typescript"
            filename="server/api/user/locations.get.ts"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            Delivery with Location Context
          </h4>
          <DeveloperCodeBlock
            :code="codeExamples.deliveryWithLocationContext"
            language="typescript"
            filename="server/api/locations/[id]/deliveries/index.post.ts"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Data Flow Diagram</h4>
          <DeveloperCodeBlock :code="codeExamples.locationContextDiagram" language="plaintext" />
        </div>
      </div>
    </section>

    <!-- Location Access Middleware Section -->
    <section
      id="dev-section-access-middleware"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('access-middleware')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-shield-check" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]"
            >Location Access Middleware</span
          >
        </span>
        <UIcon
          :name="
            isExpanded('access-middleware') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('access-middleware')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          The location-access middleware protects all location-specific API routes, ensuring users
          can only access locations they're authorized for.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Middleware Implementation</h4>
          <DeveloperCodeBlock
            :code="codeExamples.locationAccessMiddleware"
            language="typescript"
            filename="server/middleware/location-access.ts"
          />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Error Codes</h4>
          <div class="space-y-2 text-sm">
            <div class="flex items-start gap-2">
              <UBadge color="error" variant="soft" size="xs">403</UBadge>
              <span class="text-[var(--ui-text-muted)]">
                <code class="code-inline">LOCATION_ACCESS_DENIED</code> - User lacks access to
                location
              </span>
            </div>
            <div class="flex items-start gap-2">
              <UBadge color="warning" variant="soft" size="xs">404</UBadge>
              <span class="text-[var(--ui-text-muted)]">
                <code class="code-inline">LOCATION_NOT_FOUND</code> - Location doesn't exist
              </span>
            </div>
            <div class="flex items-start gap-2">
              <UBadge color="warning" variant="soft" size="xs">400</UBadge>
              <span class="text-[var(--ui-text-muted)]">
                <code class="code-inline">LOCATION_INACTIVE</code> - Location is deactivated
              </span>
            </div>
          </div>
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Access Check Patterns</h4>
          <DeveloperCodeBlock :code="codeExamples.accessCheckPatterns" language="typescript" />
        </div>
      </div>
    </section>

    <!-- Location-Scoped Queries Section -->
    <section
      id="dev-section-scoped-queries"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('scoped-queries')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-circle-stack" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Location-Scoped Queries</span>
        </span>
        <UIcon
          :name="
            isExpanded('scoped-queries') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('scoped-queries')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          All major queries should be scoped to the active location using the
          <code class="code-inline">location_id</code> field.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Query Patterns</h4>
          <DeveloperCodeBlock :code="codeExamples.locationScopedQueries" language="typescript" />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Visual Patterns</h4>
          <DeveloperCodeBlock :code="codeExamples.locationTypeIcons" language="typescript" />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Index Optimizations</h4>
          <p class="text-sm text-[var(--ui-text-muted)]">
            All major tables have location-specific indexes for query performance:
          </p>
          <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-check" class="text-[var(--ui-success)]" />
              <code class="code-inline">@@index([location_id, status])</code> on Delivery
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-check" class="text-[var(--ui-success)]" />
              <code class="code-inline">@@index([location_id, issue_date])</code> on Issue
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-check" class="text-[var(--ui-success)]" />
              <code class="code-inline">@@index([location_id])</code> on LocationStock
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-check" class="text-[var(--ui-success)]" />
              <code class="code-inline">@@index([from_location_id])</code> and
              <code class="code-inline">@@index([to_location_id])</code> on Transfer
            </li>
          </ul>
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
