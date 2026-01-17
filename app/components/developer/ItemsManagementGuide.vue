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
  itemSchema: `// Item Schema - Database Model
// File: prisma/schema.prisma

model Item {
  id             String          @id @default(uuid()) @db.Uuid
  code           String          @unique @db.VarChar(50)      // Unique item code (e.g., "ITEM-001")
  name           String          @db.VarChar(200)              // Item name
  unit           Unit                                          // Unit of measure (enum)
  category       String?         @db.VarChar(50)               // Optional category
  sub_category   String?         @db.VarChar(50)               // Optional subcategory
  is_active      Boolean         @default(true)                // Active status
  created_at     DateTime        @default(now())
  updated_at     DateTime        @updatedAt

  // Relationships
  delivery_lines DeliveryLine[]  // Items can appear in delivery lines
  issue_lines    IssueLine[]     // Items can appear in issue lines
  item_prices    ItemPrice[]     // Per-period pricing
  location_stock LocationStock[] // Stock levels at each location
  transfer_lines TransferLine[]  // Items can appear in transfer lines

  @@index([category])
  @@index([is_active])
  @@index([is_active, category])
  @@map("items")
}

// Unit enum (supported units of measure)
enum Unit {
  KG    // Kilograms
  EA    // Each (individual items)
  LTR   // Liters
  BOX   // Box
  CASE  // Case
  PACK  // Pack
}`,

  locationStock: `// LocationStock - Per-location inventory tracking
// File: prisma/schema.prisma

model LocationStock {
  location_id  String    @db.Uuid
  item_id      String    @db.Uuid
  on_hand      Decimal   @default(0) @db.Decimal(15, 4)  // Current quantity on hand
  wac          Decimal   @default(0) @db.Decimal(15, 4)  // Weighted Average Cost
  min_stock    Decimal?  @db.Decimal(15, 4)              // Minimum stock level (optional)
  max_stock    Decimal?  @db.Decimal(15, 4)              // Maximum stock level (optional)
  last_counted DateTime? @db.Timestamptz(6)              // Last physical count date
  updated_at   DateTime  @updatedAt

  // Relationships
  item         Item      @relation(fields: [item_id], references: [id], onDelete: Cascade)
  location     Location  @relation(fields: [location_id], references: [id], onDelete: Cascade)

  @@id([location_id, item_id])  // Composite primary key
  @@index([location_id])
}`,

  itemPrice: `// ItemPrice - Period-based pricing
// File: prisma/schema.prisma

model ItemPrice {
  id        String   @id @default(uuid()) @db.Uuid
  item_id   String   @db.Uuid
  period_id String   @db.Uuid
  price     Decimal  @db.Decimal(15, 4)  // Price for this item in this period
  currency  String   @default("SAR") @db.VarChar(3)
  set_by    String?  @db.Uuid            // User who set the price
  set_at    DateTime @default(now())

  // Relationships
  item      Item     @relation(fields: [item_id], references: [id], onDelete: Cascade)
  period    Period   @relation(fields: [period_id], references: [id], onDelete: Cascade)

  @@unique([item_id, period_id])  // One price per item per period
  @@index([period_id])
  @@index([item_id])
  @@map("item_prices")
}`,

  useItemsComposable: `// useItems Composable - Fetch items with caching and pagination
// File: app/composables/useItems.ts

export function useItems(
  filters?: Ref<ItemFilters> | ItemFilters,
  options: { immediate?: boolean; watch?: boolean } = {}
) {
  const { immediate = true, watch: watchFilters = true } = options;
  const filterRef = isRef(filters) ? filters : ref(filters || {});

  // Build query params from filters
  const query = computed(() => {
    const params: Record<string, string | number | boolean> = {};
    if (filterRef.value.category) params.category = filterRef.value.category;
    if (filterRef.value.search) params.search = filterRef.value.search;
    if (filterRef.value.locationId) params.locationId = filterRef.value.locationId;
    if (filterRef.value.is_active !== undefined) params.is_active = filterRef.value.is_active;
    if (filterRef.value.page) params.page = filterRef.value.page;
    if (filterRef.value.limit) params.limit = filterRef.value.limit;
    return params;
  });

  // Use useAsyncData for automatic caching (20 seconds)
  const { data, error, status, refresh, execute } = useAsyncData<ItemsResponse>(
    \`items:\${JSON.stringify(query.value)}\`,
    () => $fetch<ItemsResponse>("/api/items", { query: query.value }),
    {
      getCachedData: (key) => {
        const cached = useNuxtApp().payload.data[key];
        if (!cached) return;
        const now = Date.now();
        const cacheTime = useNuxtApp().payload.data[\`\${key}:time\`] as number | undefined;
        if (cacheTime && now - cacheTime < 20 * 1000) return cached;
        return;
      },
      immediate,
      watch: watchFilters ? [query] : [],
    }
  );

  // Computed values
  const items = computed(() => (data.value as ItemsResponse | null)?.items || []);
  const pagination = computed(() => (data.value as ItemsResponse | null)?.pagination);
  const loading = computed(() => status.value === "pending");

  return { items, pagination, data, loading, error, status, refresh, execute };
}`,

  listItemsEndpoint: `// GET /api/items - Fetch items with filters and pagination
// File: server/api/items/index.get.ts

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) throw createError({ statusCode: 401, ... });

  // Parse and validate query parameters
  const query = getQuery(event);
  const { category, search, locationId, is_active, page, limit } = querySchema.parse(query);

  // Build where clause
  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (is_active !== undefined) where.is_active = is_active;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { code: { contains: search, mode: "insensitive" } },
    ];
  }

  // Calculate pagination
  const skip = (page - 1) * limit;
  const take = limit;

  // Include location stock if locationId provided
  const include: Record<string, unknown> = {};
  if (locationId) {
    // Check location access for Operators
    if (user.role === "OPERATOR") {
      const hasAccess = user.locations?.includes(locationId);
      if (!hasAccess) throw createError({ statusCode: 403, ... });
    }

    include.location_stock = {
      where: { location_id: locationId },
      include: { location: { select: { id: true, code: true, name: true } } },
    };
  }

  // Fetch items with pagination
  const [items, total] = await Promise.all([
    prisma.item.findMany({ where, include, orderBy: [{ category: "asc" }, { name: "asc" }], skip, take }),
    prisma.item.count({ where }),
  ]);

  return {
    items,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit), ... },
  };
});`,

  createItemEndpoint: `// POST /api/items - Create a new item
// File: server/api/items/index.post.ts

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) throw createError({ statusCode: 401, ... });

  // Check if user is ADMIN
  if (user.role !== "ADMIN") {
    throw createError({
      statusCode: 403,
      data: { code: "INSUFFICIENT_PERMISSIONS", message: "Only admins can create items" },
    });
  }

  // Parse and validate request body
  const body = await readBody(event);
  const data = itemSchema.parse(body);  // Zod validation

  // Check if item code already exists
  const existingItem = await prisma.item.findUnique({ where: { code: data.code } });
  if (existingItem) {
    throw createError({
      statusCode: 409,
      data: { code: "DUPLICATE_CODE", message: \`Item with code '\${data.code}' already exists\` },
    });
  }

  // Create the item
  const item = await prisma.item.create({
    data: {
      code: data.code,
      name: data.name,
      unit: data.unit,
      category: data.category || null,
      sub_category: data.sub_category || null,
      is_active: true,
    },
  });

  return { item, message: "Item created successfully" };
});`,

  updateItemEndpoint: `// PATCH /api/items/:id - Update an existing item
// File: server/api/items/[id].patch.ts

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user || user.role !== "ADMIN") throw createError({ statusCode: 403, ... });

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, ... });

  // Check if item exists
  const existingItem = await prisma.item.findUnique({ where: { id } });
  if (!existingItem) throw createError({ statusCode: 404, ... });

  // Parse and validate request body (all fields optional)
  const body = await readBody(event);
  const data = updateItemSchema.parse(body);

  if (Object.keys(data).length === 0) {
    throw createError({ statusCode: 400, data: { code: "NO_UPDATE_DATA" } });
  }

  // Update the item (Note: code cannot be changed)
  const item = await prisma.item.update({ where: { id }, data });

  return { item, message: "Item updated successfully" };
});`,

  updatePriceEndpoint: `// PATCH /api/items/:itemId/price - Update item price for current period
// File: server/api/items/[itemId]/price.patch.ts

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user || user.role !== "ADMIN") throw createError({ statusCode: 403, ... });

  const itemId = getRouterParam(event, "itemId");
  const { price, period_id } = updatePriceSchema.parse(await readBody(event));

  // Fetch item and period in parallel
  const [item, period] = await Promise.all([
    prisma.item.findUnique({ where: { id: itemId } }),
    period_id
      ? prisma.period.findUnique({ where: { id: period_id } })
      : prisma.period.findFirst({ where: { status: "OPEN" }, orderBy: { start_date: "desc" } }),
  ]);

  if (!item) throw createError({ statusCode: 404, data: { code: "ITEM_NOT_FOUND" } });
  if (!item.is_active) throw createError({ statusCode: 400, data: { code: "ITEM_INACTIVE" } });
  if (!period) throw createError({ statusCode: 404, data: { code: "NO_OPEN_PERIOD" } });
  if (period.status === "CLOSED") {
    throw createError({ statusCode: 400, data: { code: "PERIOD_CLOSED" } });
  }

  // Upsert the item price
  const itemPrice = await prisma.itemPrice.upsert({
    where: { item_id_period_id: { item_id: itemId, period_id: period.id } },
    update: { price: new Decimal(price), set_by: user.id, set_at: new Date() },
    create: { item_id: itemId, period_id: period.id, price: new Decimal(price), currency: "SAR", set_by: user.id },
    include: { item: true, period: true },
  });

  return { message: "Item price updated successfully", item_price: itemPrice };
});`,

  importWorkflow: `// Items Import Workflow States
//
// +-------------------------------------------------------------------------+
// |                         ITEMS IMPORT WORKFLOW                           |
// +-------------------------------------------------------------------------+
//
//  +-------------+     +-------------+     +-------------+     +-------------+
//  |   SELECT    |---->|  PREVIEWING |---->|   PREVIEW   |---->|  IMPORTING  |
//  |  (file)     |     |  (parsing)  |     |  (validate) |     |  (database) |
//  +-------------+     +-------------+     +-------------+     +-------------+
//        |                                       |                    |
//        |                                       | Back               v
//        |                                 +-------------+      +-------------+
//        +-------------------------------->|   SELECT    |<-----|   RESULTS   |
//                    Reset                 +-------------+      |  (summary)  |
//                                                               +-------------+
//                                                               Import Another`,

  importComposable: `// useItemsImport Composable - Manage import workflow
// File: app/composables/useItemsImport.ts

export function useItemsImport() {
  const { isOnline } = useOnlineStatus();
  const toast = useAppToast();

  // Reactive state
  const selectedFile = ref<File | null>(null);
  const currentStep = ref<ImportStep>("select");
  const loading = ref(false);
  const result = ref<ImportResult | null>(null);
  const preview = ref<ImportPreview | null>(null);
  const error = ref<string | null>(null);

  // Validate and set file
  function setFile(file: File | null) {
    if (!file) {
      selectedFile.value = null;
      return;
    }

    // Validate file type
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext || "")) {
      error.value = "Invalid file type. Please select an Excel or CSV file.";
      toast.error("Invalid File", { description: error.value });
      return;
    }

    selectedFile.value = file;
    error.value = null;
  }

  // Preview file before import
  async function previewFile(): Promise<boolean> {
    if (!selectedFile.value || !isOnline.value) return false;

    loading.value = true;
    currentStep.value = "previewing";
    error.value = null;

    try {
      const formData = new FormData();
      formData.append("file", selectedFile.value);

      const data = await $fetch<ImportPreview>("/api/items/import-preview", {
        method: "POST",
        body: formData,
      });

      preview.value = data;
      currentStep.value = "preview";
      return true;
    } catch (err: unknown) {
      error.value = extractErrorMessage(err);
      currentStep.value = "select";
      toast.error("Preview Failed", { description: error.value });
      return false;
    } finally {
      loading.value = false;
    }
  }

  // Execute the import
  async function uploadFile(): Promise<boolean> {
    if (!selectedFile.value || !isOnline.value) return false;

    loading.value = true;
    currentStep.value = "importing";
    error.value = null;

    try {
      const formData = new FormData();
      formData.append("file", selectedFile.value);

      const data = await $fetch<ImportResult>("/api/items/import", {
        method: "POST",
        body: formData,
      });

      result.value = data;
      currentStep.value = "results";

      if (data.success) {
        toast.success("Import Complete", {
          description: \`\${data.summary.successCount} items imported successfully\`,
        });
      }
      return data.success;
    } catch (err: unknown) {
      error.value = extractErrorMessage(err);
      currentStep.value = "select";
      toast.error("Import Failed", { description: error.value });
      return false;
    } finally {
      loading.value = false;
    }
  }

  // Download template
  function downloadTemplate(format: "xlsx" | "csv" = "xlsx") {
    window.open(\`/api/items/import-template?format=\${format}\`, "_blank");
  }

  // Reset to initial state
  function reset() {
    selectedFile.value = null;
    currentStep.value = "select";
    loading.value = false;
    result.value = null;
    preview.value = null;
    error.value = null;
  }

  return {
    // State (readonly)
    selectedFile: readonly(selectedFile),
    currentStep: readonly(currentStep),
    loading: readonly(loading),
    result: readonly(result),
    preview: readonly(preview),
    error: readonly(error),
    isOnline,

    // Actions
    setFile,
    previewFile,
    uploadFile,
    downloadTemplate,
    reset,
  };
}`,

  itemTypes: `// Item Types and Interfaces
// File: app/composables/useItems.ts

export interface ItemStock {
  location_id: string;
  item_id: string;
  on_hand: number;
  wac: number;
  location: {
    id: string;
    code: string;
    name: string;
  };
}

export interface ItemData {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  default_price: number;
  is_active: boolean;
  location_stock?: ItemStock[];
}

export interface ItemsResponse {
  items: ItemData[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ItemFilters {
  category?: string;
  search?: string;
  locationId?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
}`,

  validationSchema: `// Item Validation Schema (Zod)
// File: server/api/items/index.post.ts

const itemSchema = z.object({
  code: z
    .string()
    .min(1)
    .max(50)
    .transform((val) => val.toUpperCase()),  // Auto-uppercase codes
  name: z.string().min(1).max(200),
  unit: z.enum(["KG", "EA", "LTR", "BOX", "CASE", "PACK"]),
  category: z.string().max(50).optional(),
  sub_category: z.string().max(50).optional(),
});

// For updates, all fields are optional
const updateItemSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  unit: z.enum(["KG", "EA", "LTR", "BOX", "CASE", "PACK"]).optional(),
  category: z.string().max(50).optional().nullable(),
  sub_category: z.string().max(50).optional().nullable(),
  is_active: z.boolean().optional(),
});`,
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="border-b border-[var(--ui-border)] pb-4">
      <h2 class="text-2xl font-bold text-[var(--ui-text-highlighted)]">Items Management</h2>
      <p class="mt-1 text-sm text-[var(--ui-text-muted)]">
        Comprehensive guide to managing inventory items, stock tracking, pricing, and bulk imports
      </p>
    </div>

    <!-- Section 1: Overview -->
    <section
      id="dev-section-overview"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 text-left transition-colors hover:bg-[var(--ui-bg-muted)]"
        @click="toggleSection('overview')"
      >
        <div class="flex items-center gap-3">
          <UIcon name="i-heroicons-information-circle" class="size-5 text-[var(--ui-primary)]" />
          <h4 class="font-semibold text-[var(--ui-text-highlighted)]">Overview</h4>
        </div>
        <UIcon
          :name="isExpanded('overview') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="size-5 text-[var(--ui-text-muted)]"
        />
      </button>

      <div v-if="isExpanded('overview')" class="space-y-4 border-t border-[var(--ui-border)] p-4">
        <p>
          Items are the foundation of the inventory management system. They represent physical
          goods tracked across multiple locations with independent stock levels, weighted average
          costing (WAC), and period-based pricing.
        </p>

        <div class="rounded-lg bg-[var(--ui-bg-muted)] p-4">
          <h5 class="mb-2 font-semibold">What are Items?</h5>
          <p class="text-sm">
            Items are master data records that define inventory products. Each item has a unique
            code, name, unit of measure, and optional categorization. Items are central to all
            stock operations (deliveries, issues, transfers) and maintain per-location stock levels
            and pricing information.
          </p>
        </div>

        <div class="rounded-lg bg-[var(--ui-bg-muted)] p-4">
          <h5 class="mb-2 font-semibold">Key Concepts</h5>
          <ul class="list-inside list-disc space-y-2 text-sm">
            <li>
              <strong>Item Master Data:</strong> Central repository of item definitions (code, name,
              unit, category)
            </li>
            <li>
              <strong>LocationStock:</strong> Per-location inventory tracking (quantity on-hand,
              WAC)
            </li>
            <li>
              <strong>ItemPrice:</strong> Period-based pricing locked at period start to prevent
              unauthorized price changes
            </li>
            <li>
              <strong>Multi-location:</strong> Same item can exist at Kitchen, Store, Central, and
              Warehouse with independent stock levels
            </li>
            <li>
              <strong>WAC (Weighted Average Cost):</strong> Automatically calculated per location on
              deliveries
            </li>
          </ul>
        </div>

        <div class="rounded-lg bg-[var(--ui-bg-muted)] p-4">
          <h5 class="mb-2 font-semibold">Role Requirements</h5>
          <ul class="list-inside list-disc space-y-1 text-sm">
            <li><strong>View Items:</strong> All authenticated users (Operator, Supervisor, Admin)</li>
            <li>
              <strong>Create/Update/Delete Items:</strong> Admin only (master data management)
            </li>
            <li><strong>Set Prices:</strong> Admin only (requires open period)</li>
            <li>
              <strong>Import Items:</strong> Admin or Supervisor (bulk operations with validation)
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Section 2: Data Model -->
    <section
      id="dev-section-data-model"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 text-left transition-colors hover:bg-[var(--ui-bg-muted)]"
        @click="toggleSection('data-model')"
      >
        <div class="flex items-center gap-3">
          <UIcon name="i-heroicons-table-cells" class="size-5 text-[var(--ui-primary)]" />
          <h4 class="font-semibold text-[var(--ui-text-highlighted)]">Data Model</h4>
        </div>
        <UIcon
          :name="isExpanded('data-model') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="size-5 text-[var(--ui-text-muted)]"
        />
      </button>

      <div
        v-if="isExpanded('data-model')"
        class="space-y-4 border-t border-[var(--ui-border)] p-4"
      >
        <p>
          The Item data model consists of three core tables: Item (master data), LocationStock
          (per-location inventory), and ItemPrice (period-based pricing).
        </p>

        <h5 class="font-semibold">Item Schema</h5>
        <DeveloperCodeBlock
          :code="codeExamples.itemSchema"
          language="typescript"
          filename="prisma/schema.prisma"
        />

        <div class="rounded-lg bg-[var(--ui-bg-muted)] p-4">
          <h5 class="mb-2 font-semibold">Field Constraints</h5>
          <ul class="list-inside list-disc space-y-1 text-sm">
            <li><strong>code:</strong> Unique, max 50 chars, auto-uppercase, cannot be changed after creation</li>
            <li><strong>name:</strong> Required, max 200 chars</li>
            <li><strong>unit:</strong> Required enum (KG, EA, LTR, BOX, CASE, PACK)</li>
            <li><strong>category/sub_category:</strong> Optional, max 50 chars each</li>
            <li><strong>is_active:</strong> Boolean flag for soft deletion (defaults to true)</li>
          </ul>
        </div>

        <h5 class="font-semibold">LocationStock Relationship</h5>
        <DeveloperCodeBlock
          :code="codeExamples.locationStock"
          language="typescript"
          filename="prisma/schema.prisma"
        />

        <div class="rounded-lg bg-[var(--ui-bg-muted)] p-4">
          <h5 class="mb-2 font-semibold">LocationStock Tracking</h5>
          <p class="text-sm">
            Each item can have stock at multiple locations. The composite key (location_id, item_id)
            ensures one stock record per item per location. The WAC and on_hand values are updated
            automatically by deliveries, issues, and transfers.
          </p>
        </div>

        <h5 class="font-semibold">ItemPrice Relationship</h5>
        <DeveloperCodeBlock
          :code="codeExamples.itemPrice"
          language="typescript"
          filename="prisma/schema.prisma"
        />

        <div class="rounded-lg bg-[var(--ui-bg-muted)] p-4">
          <h5 class="mb-2 font-semibold">Period-Based Pricing</h5>
          <p class="text-sm">
            Prices are locked at the start of each accounting period. This prevents unauthorized
            price changes mid-period. If a delivery arrives at a different price than the locked
            period price, a price variance NCR is automatically generated for approval.
          </p>
        </div>
      </div>
    </section>

    <!-- Section 3: List & Filtering -->
    <section
      id="dev-section-list-filter"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 text-left transition-colors hover:bg-[var(--ui-bg-muted)]"
        @click="toggleSection('list-filter')"
      >
        <div class="flex items-center gap-3">
          <UIcon name="i-heroicons-funnel" class="size-5 text-[var(--ui-primary)]" />
          <h4 class="font-semibold text-[var(--ui-text-highlighted)]">
            Items List & Filtering
          </h4>
        </div>
        <UIcon
          :name="
            isExpanded('list-filter') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="size-5 text-[var(--ui-text-muted)]"
        />
      </button>

      <div
        v-if="isExpanded('list-filter')"
        class="space-y-4 border-t border-[var(--ui-border)] p-4"
      >
        <p>
          The items list supports filtering by category, search (name/code), active status, and
          optional location-specific stock data. The useItems composable provides built-in caching
          and pagination.
        </p>

        <h5 class="font-semibold">useItems Composable</h5>
        <DeveloperCodeBlock
          :code="codeExamples.useItemsComposable"
          language="typescript"
          filename="app/composables/useItems.ts"
        />

        <div class="rounded-lg bg-[var(--ui-bg-muted)] p-4">
          <h5 class="mb-2 font-semibold">Caching Strategy</h5>
          <p class="text-sm">
            Items are cached for 20 seconds using Nuxt's useAsyncData. Each unique filter
            combination creates a separate cache key. Cache is automatically invalidated when items
            are created, updated, or deleted using the
            <code class="code-inline">invalidateItemsCache()</code> function.
          </p>
        </div>

        <h5 class="font-semibold">API Endpoint</h5>
        <DeveloperCodeBlock
          :code="codeExamples.listItemsEndpoint"
          language="typescript"
          filename="server/api/items/index.get.ts"
        />

        <div class="rounded-lg bg-[var(--ui-bg-muted)] p-4">
          <h5 class="mb-2 font-semibold">Query Parameters</h5>
          <ul class="list-inside list-disc space-y-1 text-sm">
            <li>
              <code class="code-inline">category</code> - Filter by category (exact match)
            </li>
            <li>
              <code class="code-inline">search</code> - Search by name or code (case-insensitive
              partial match)
            </li>
            <li>
              <code class="code-inline">locationId</code> - Include stock data for specific location
              (requires location access)
            </li>
            <li>
              <code class="code-inline">is_active</code> - Filter by active status (true/false)
            </li>
            <li>
              <code class="code-inline">page</code> - Page number (default: 1)
            </li>
            <li>
              <code class="code-inline">limit</code> - Items per page (default: 50, max: 200)
            </li>
          </ul>
        </div>

        <div class="rounded-lg bg-[var(--ui-bg-muted)] p-4">
          <h5 class="mb-2 font-semibold">Location Access Control</h5>
          <p class="text-sm">
            Operators can only view stock data for locations they have access to. The API validates
            the <code class="code-inline">locationId</code> parameter against the user's assigned
            locations before including stock data. Admins and Supervisors have access to all
            locations.
          </p>
        </div>
      </div>
    </section>

    <!-- Section 4: CRUD Operations -->
    <section
      id="dev-section-crud"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 text-left transition-colors hover:bg-[var(--ui-bg-muted)]"
        @click="toggleSection('crud')"
      >
        <div class="flex items-center gap-3">
          <UIcon name="i-heroicons-pencil-square" class="size-5 text-[var(--ui-primary)]" />
          <h4 class="font-semibold text-[var(--ui-text-highlighted)]">CRUD Operations</h4>
        </div>
        <UIcon
          :name="isExpanded('crud') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="size-5 text-[var(--ui-text-muted)]"
        />
      </button>

      <div v-if="isExpanded('crud')" class="space-y-4 border-t border-[var(--ui-border)] p-4">
        <p>
          All create, update, and delete operations are restricted to Admin users only. These
          operations modify master data and require elevated permissions.
        </p>

        <!-- Create Item -->
        <div class="rounded-lg border border-[var(--ui-border)] p-4">
          <h5 class="mb-2 font-semibold text-[var(--ui-success)]">Create Item</h5>
          <p class="mb-2 text-sm">
            Creates a new item with automatic code uppercasing and duplicate detection.
          </p>
          <DeveloperCodeBlock
            :code="codeExamples.createItemEndpoint"
            language="typescript"
            filename="server/api/items/index.post.ts"
          />
          <div class="mt-2 rounded bg-[var(--ui-bg-muted)] p-2 text-sm">
            <strong>Permission:</strong> Admin only<br />
            <strong>Validation:</strong> Zod schema validates all fields<br />
            <strong>Duplicate Check:</strong> Returns 409 Conflict if code already exists
          </div>
        </div>

        <!-- Update Item -->
        <div class="rounded-lg border border-[var(--ui-border)] p-4">
          <h5 class="mb-2 font-semibold text-[var(--ui-info)]">Update Item</h5>
          <p class="mb-2 text-sm">
            Updates an existing item. All fields are optional except ID. Item code cannot be
            changed.
          </p>
          <DeveloperCodeBlock
            :code="codeExamples.updateItemEndpoint"
            language="typescript"
            filename="server/api/items/[id].patch.ts"
          />
          <div class="mt-2 rounded bg-[var(--ui-bg-muted)] p-2 text-sm">
            <strong>Permission:</strong> Admin only<br />
            <strong>Immutable Field:</strong> Item code cannot be changed after creation<br />
            <strong>Soft Delete:</strong> Set <code class="code-inline">is_active: false</code> to
            deactivate
          </div>
        </div>

        <!-- Delete Item -->
        <div class="rounded-lg border border-[var(--ui-border)] p-4">
          <h5 class="mb-2 font-semibold text-[var(--ui-error)]">Delete Item</h5>
          <p class="mb-2 text-sm">
            Hard delete is restricted. Use <code class="code-inline">is_active: false</code> for
            soft deletion instead. Hard delete endpoint (DELETE /api/items/:id) is only for cleanup
            of unused items.
          </p>
          <div class="mt-2 rounded bg-[var(--ui-bg-muted)] p-2 text-sm">
            <strong>Permission:</strong> Admin only<br />
            <strong>Recommendation:</strong> Use soft delete (is_active: false) for items with
            transaction history<br />
            <strong>Cascade:</strong> Hard delete cascades to LocationStock, ItemPrice, and related
            transaction lines
          </div>
        </div>
      </div>
    </section>

    <!-- Section 5: Price Management -->
    <section
      id="dev-section-pricing"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 text-left transition-colors hover:bg-[var(--ui-bg-muted)]"
        @click="toggleSection('pricing')"
      >
        <div class="flex items-center gap-3">
          <UIcon name="i-heroicons-currency-dollar" class="size-5 text-[var(--ui-primary)]" />
          <h4 class="font-semibold text-[var(--ui-text-highlighted)]">Price Management</h4>
        </div>
        <UIcon
          :name="isExpanded('pricing') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="size-5 text-[var(--ui-text-muted)]"
        />
      </button>

      <div v-if="isExpanded('pricing')" class="space-y-4 border-t border-[var(--ui-border)] p-4">
        <p>
          Item prices are managed per accounting period. Prices are locked at period start to
          prevent unauthorized changes. Price variance detection automatically creates NCRs when
          delivery prices differ from locked period prices.
        </p>

        <h5 class="font-semibold">Update Price Endpoint</h5>
        <DeveloperCodeBlock
          :code="codeExamples.updatePriceEndpoint"
          language="typescript"
          filename="server/api/items/[itemId]/price.patch.ts"
        />

        <div class="rounded-lg bg-[var(--ui-bg-muted)] p-4">
          <h5 class="mb-2 font-semibold">Business Rules</h5>
          <ul class="list-inside list-disc space-y-1 text-sm">
            <li>Only Admin users can set or update item prices</li>
            <li>Prices can only be set for OPEN or READY periods (not CLOSED)</li>
            <li>Each item has one price per period (upsert pattern)</li>
            <li>Price must be positive (validated by Zod)</li>
            <li>Inactive items cannot have prices set</li>
            <li>
              If no period_id is provided, defaults to the current open period (most recent with
              status: OPEN)
            </li>
          </ul>
        </div>

        <div class="rounded-lg bg-[var(--ui-bg-muted)] p-4">
          <h5 class="mb-2 font-semibold">Price Variance Detection</h5>
          <p class="text-sm">
            When a delivery arrives with a unit price different from the locked period price, a
            price variance NCR is automatically created with
            <code class="code-inline">type: PRICE_VARIANCE</code> and
            <code class="code-inline">auto_generated: true</code>. This requires Supervisor or Admin
            approval before the delivery can be finalized.
          </p>
        </div>

        <div class="rounded-lg bg-[var(--ui-bg-muted)] p-4">
          <h5 class="mb-2 font-semibold">Upsert Pattern</h5>
          <p class="text-sm">
            The price endpoint uses Prisma's upsert to either create a new ItemPrice record or
            update an existing one. This allows Admins to adjust prices during the period (while
            still OPEN) without creating duplicate records.
          </p>
        </div>
      </div>
    </section>

    <!-- Section 6: Stock Tracking -->
    <section
      id="dev-section-stock-tracking"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 text-left transition-colors hover:bg-[var(--ui-bg-muted)]"
        @click="toggleSection('stock-tracking')"
      >
        <div class="flex items-center gap-3">
          <UIcon name="i-heroicons-cube" class="size-5 text-[var(--ui-primary)]" />
          <h4 class="font-semibold text-[var(--ui-text-highlighted)]">Stock Tracking</h4>
        </div>
        <UIcon
          :name="
            isExpanded('stock-tracking') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="size-5 text-[var(--ui-text-muted)]"
        />
      </button>

      <div
        v-if="isExpanded('stock-tracking')"
        class="space-y-4 border-t border-[var(--ui-border)] p-4"
      >
        <p>
          Stock levels are tracked per location using the LocationStock table. Each item can have
          independent stock at Kitchen, Store, Central, and Warehouse locations with separate
          quantities and WAC values.
        </p>

        <div class="rounded-lg bg-[var(--ui-bg-muted)] p-4">
          <h5 class="mb-2 font-semibold">LocationStock Fields</h5>
          <ul class="list-inside list-disc space-y-1 text-sm">
            <li>
              <strong>on_hand:</strong> Current quantity available at this location (Decimal 15,4)
            </li>
            <li>
              <strong>wac:</strong> Weighted Average Cost per unit at this location (Decimal 15,4)
            </li>
            <li>
              <strong>min_stock:</strong> Optional minimum stock level for alerts (not enforced in
              MVP)
            </li>
            <li>
              <strong>max_stock:</strong> Optional maximum stock level for alerts (not enforced in
              MVP)
            </li>
            <li>
              <strong>last_counted:</strong> Timestamp of last physical count (for reconciliation)
            </li>
          </ul>
        </div>

        <div class="rounded-lg bg-[var(--ui-bg-muted)] p-4">
          <h5 class="mb-2 font-semibold">WAC Calculation</h5>
          <p class="text-sm mb-2">
            Weighted Average Cost is recalculated only on deliveries (receipts). Issues and
            transfers deduct at the current WAC without recalculating.
          </p>
          <div class="rounded bg-[var(--ui-bg-elevated)] p-3 font-mono text-sm">
            newWAC = (currentQty × currentWAC + receivedQty × receiptPrice) / (currentQty +
            receivedQty)
          </div>
        </div>

        <div class="rounded-lg bg-[var(--ui-bg-muted)] p-4">
          <h5 class="mb-2 font-semibold">Stock Operations Impact</h5>
          <ul class="list-inside list-disc space-y-1 text-sm">
            <li>
              <strong>Delivery:</strong> Increases on_hand, recalculates WAC based on receipt price
            </li>
            <li><strong>Issue:</strong> Decreases on_hand, WAC unchanged</li>
            <li>
              <strong>Transfer:</strong> Decreases source location on_hand (WAC unchanged),
              increases destination on_hand (recalculates WAC)
            </li>
            <li>
              <strong>Reconciliation:</strong> Adjusts on_hand to match physical count, may adjust
              WAC if variance detected
            </li>
          </ul>
        </div>

        <div class="rounded-lg bg-[var(--ui-bg-muted)] p-4">
          <h5 class="mb-2 font-semibold">Multi-Location Isolation</h5>
          <p class="text-sm">
            Stock levels are completely isolated by location. An item at Kitchen has no relation to
            the same item at Warehouse. Transfers are the only mechanism to move stock between
            locations, and they update both source and destination LocationStock records atomically.
          </p>
        </div>
      </div>
    </section>

    <!-- Section 7: Bulk Import -->
    <section
      id="dev-section-bulk-import"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 text-left transition-colors hover:bg-[var(--ui-bg-muted)]"
        @click="toggleSection('bulk-import')"
      >
        <div class="flex items-center gap-3">
          <UIcon name="i-heroicons-arrow-up-tray" class="size-5 text-[var(--ui-primary)]" />
          <h4 class="font-semibold text-[var(--ui-text-highlighted)]">Bulk Import</h4>
        </div>
        <UIcon
          :name="
            isExpanded('bulk-import') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="size-5 text-[var(--ui-text-muted)]"
        />
      </button>

      <div
        v-if="isExpanded('bulk-import')"
        class="space-y-4 border-t border-[var(--ui-border)] p-4"
      >
        <p>
          The bulk import feature allows Admins and Supervisors to import multiple items from Excel
          or CSV files. The workflow includes preview, validation, and error reporting before
          database changes.
        </p>

        <h5 class="font-semibold">Import Workflow</h5>
        <DeveloperCodeBlock
          :code="codeExamples.importWorkflow"
          language="typescript"
          filename="app/composables/useItemsImport.ts"
        />

        <div class="rounded-lg bg-[var(--ui-bg-muted)] p-4">
          <h5 class="mb-2 font-semibold">Workflow Steps</h5>
          <ol class="list-inside list-decimal space-y-2 text-sm">
            <li>
              <strong>SELECT:</strong> User selects a file via drag-drop or file picker. Can
              download template.
            </li>
            <li>
              <strong>PREVIEWING:</strong> Loading state while file is parsed server-side.
            </li>
            <li>
              <strong>PREVIEW:</strong> User reviews first 10 rows with validation warnings. Can go
              back.
            </li>
            <li><strong>IMPORTING:</strong> Loading state while items are inserted.</li>
            <li>
              <strong>RESULTS:</strong> Success/failure summary with error details. Can import
              another file.
            </li>
          </ol>
        </div>

        <h5 class="font-semibold">useItemsImport Composable</h5>
        <DeveloperCodeBlock
          :code="codeExamples.importComposable"
          language="typescript"
          filename="app/composables/useItemsImport.ts"
        />

        <div class="rounded-lg bg-[var(--ui-bg-muted)] p-4">
          <h5 class="mb-2 font-semibold">Supported Formats</h5>
          <ul class="list-inside list-disc space-y-1 text-sm">
            <li><strong>Excel (.xlsx, .xls)</strong> - Parsed using XLSX library</li>
            <li><strong>CSV</strong> - Parsed with auto-delimiter detection</li>
          </ul>
        </div>

        <div class="rounded-lg bg-[var(--ui-bg-muted)] p-4">
          <h5 class="mb-2 font-semibold">Import Limits</h5>
          <ul class="list-inside list-disc space-y-1 text-sm">
            <li><strong>File Size:</strong> Maximum 10MB</li>
            <li><strong>Row Limit:</strong> Maximum 1,000 rows per import</li>
            <li><strong>Preview:</strong> First 10 rows shown before confirmation</li>
          </ul>
        </div>

        <div class="rounded-lg bg-[var(--ui-bg-muted)] p-4">
          <h5 class="mb-2 font-semibold">Validation Checks</h5>
          <ol class="list-inside list-decimal space-y-1 text-sm">
            <li>Check for duplicate codes within the file</li>
            <li>Validate each row against Zod schema (field types, lengths, required fields)</li>
            <li>Check for existing codes in database</li>
            <li>Only insert rows that pass all validations</li>
          </ol>
        </div>

        <div class="rounded-lg bg-[var(--ui-bg-muted)] p-4">
          <h5 class="mb-2 font-semibold">Flexible Header Mapping</h5>
          <p class="text-sm">
            Column headers are matched against multiple aliases, allowing users to use their
            preferred column names. For example, "code" matches "Code", "Item Code", "ItemCode",
            "item_code", or "SKU".
          </p>
        </div>
      </div>
    </section>

    <!-- Section 8: Composables Reference -->
    <section
      id="dev-section-composables"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 text-left transition-colors hover:bg-[var(--ui-bg-muted)]"
        @click="toggleSection('composables')"
      >
        <div class="flex items-center gap-3">
          <UIcon name="i-heroicons-cube-transparent" class="size-5 text-[var(--ui-primary)]" />
          <h4 class="font-semibold text-[var(--ui-text-highlighted)]">Composables Reference</h4>
        </div>
        <UIcon
          :name="isExpanded('composables') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="size-5 text-[var(--ui-text-muted)]"
        />
      </button>

      <div
        v-if="isExpanded('composables')"
        class="space-y-4 border-t border-[var(--ui-border)] p-4"
      >
        <p>Items management provides three main composables for data fetching and import workflows.</p>

        <!-- useItems -->
        <div class="rounded-lg border border-[var(--ui-border)] p-4">
          <h5 class="mb-2 font-semibold text-[var(--ui-primary)]">
            useItems()
            <span class="ml-2 text-xs font-normal text-[var(--ui-text-muted)]"
              >app/composables/useItems.ts</span
            >
          </h5>
          <p class="mb-2 text-sm">
            Fetch items list with pagination, filtering, and built-in caching (20 seconds).
          </p>
          <div class="rounded bg-[var(--ui-bg-muted)] p-2 text-sm">
            <strong>Parameters:</strong><br />
            - <code class="code-inline">filters</code>: Ref or object with category, search,
            locationId, is_active, page, limit<br />
            - <code class="code-inline">options</code>: { immediate, watch }<br />
            <strong>Returns:</strong> { items, pagination, loading, error, refresh, execute }
          </div>
        </div>

        <!-- useItem -->
        <div class="rounded-lg border border-[var(--ui-border)] p-4">
          <h5 class="mb-2 font-semibold text-[var(--ui-primary)]">
            useItem()
            <span class="ml-2 text-xs font-normal text-[var(--ui-text-muted)]"
              >app/composables/useItems.ts</span
            >
          </h5>
          <p class="mb-2 text-sm">Fetch a single item by ID with caching (20 seconds).</p>
          <div class="rounded bg-[var(--ui-bg-muted)] p-2 text-sm">
            <strong>Parameters:</strong><br />
            - <code class="code-inline">itemId</code>: Ref or string (item UUID)<br />
            <strong>Returns:</strong> { item, loading, error, refresh }
          </div>
        </div>

        <!-- useItemsImport -->
        <div class="rounded-lg border border-[var(--ui-border)] p-4">
          <h5 class="mb-2 font-semibold text-[var(--ui-primary)]">
            useItemsImport()
            <span class="ml-2 text-xs font-normal text-[var(--ui-text-muted)]"
              >app/composables/useItemsImport.ts</span
            >
          </h5>
          <p class="mb-2 text-sm">Manage bulk import workflow (file selection, preview, execution).</p>
          <div class="rounded bg-[var(--ui-bg-muted)] p-2 text-sm">
            <strong>State:</strong> selectedFile, currentStep, loading, result, preview, error,
            isOnline<br />
            <strong>Actions:</strong> setFile(), previewFile(), uploadFile(), downloadTemplate(),
            reset()
          </div>
        </div>

        <!-- Cache Invalidation -->
        <div class="rounded-lg border border-[var(--ui-border)] p-4">
          <h5 class="mb-2 font-semibold text-[var(--ui-primary)]">
            invalidateItemsCache()
            <span class="ml-2 text-xs font-normal text-[var(--ui-text-muted)]"
              >app/composables/useItems.ts</span
            >
          </h5>
          <p class="mb-2 text-sm">
            Invalidates all items caches. Call after creating, updating, or deleting items to force
            refetch on next access.
          </p>
        </div>

        <div class="rounded-lg border border-[var(--ui-border)] p-4">
          <h5 class="mb-2 font-semibold text-[var(--ui-primary)]">
            invalidateItemCache(itemId)
            <span class="ml-2 text-xs font-normal text-[var(--ui-text-muted)]"
              >app/composables/useItems.ts</span
            >
          </h5>
          <p class="mb-2 text-sm">
            Invalidates a specific item cache by ID. Also invalidates the items list cache.
          </p>
        </div>
      </div>
    </section>

    <!-- Section 9: API Endpoints -->
    <section
      id="dev-section-api-endpoints"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 text-left transition-colors hover:bg-[var(--ui-bg-muted)]"
        @click="toggleSection('api-endpoints')"
      >
        <div class="flex items-center gap-3">
          <UIcon name="i-heroicons-server" class="size-5 text-[var(--ui-primary)]" />
          <h4 class="font-semibold text-[var(--ui-text-highlighted)]">API Endpoints</h4>
        </div>
        <UIcon
          :name="
            isExpanded('api-endpoints') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="size-5 text-[var(--ui-text-muted)]"
        />
      </button>

      <div
        v-if="isExpanded('api-endpoints')"
        class="space-y-4 border-t border-[var(--ui-border)] p-4"
      >
        <p>Complete reference for all items-related API endpoints.</p>

        <!-- List Items -->
        <div class="rounded-lg border border-[var(--ui-border)] p-4">
          <h5 class="mb-2 font-semibold text-[var(--ui-success)]">GET /api/items</h5>
          <p class="mb-2 text-sm">Fetch items with filters and pagination</p>
          <div class="rounded bg-[var(--ui-bg-muted)] p-2 text-sm">
            <strong>Query:</strong> category, search, locationId, is_active, page, limit<br />
            <strong>Returns:</strong> { items, pagination }<br />
            <strong>Permission:</strong> All authenticated users<br />
            <strong>Cache:</strong> Server: 2s, Client: 20s
          </div>
        </div>

        <!-- Create Item -->
        <div class="rounded-lg border border-[var(--ui-border)] p-4">
          <h5 class="mb-2 font-semibold text-[var(--ui-primary)]">POST /api/items</h5>
          <p class="mb-2 text-sm">Create a new item</p>
          <div class="rounded bg-[var(--ui-bg-muted)] p-2 text-sm">
            <strong>Body:</strong> { code, name, unit, category?, sub_category? }<br />
            <strong>Returns:</strong> { item, message }<br />
            <strong>Permission:</strong> Admin only<br />
            <strong>Errors:</strong> 409 if code already exists
          </div>
        </div>

        <!-- Get Single Item -->
        <div class="rounded-lg border border-[var(--ui-border)] p-4">
          <h5 class="mb-2 font-semibold text-[var(--ui-success)]">GET /api/items/:id</h5>
          <p class="mb-2 text-sm">Fetch a single item by ID</p>
          <div class="rounded bg-[var(--ui-bg-muted)] p-2 text-sm">
            <strong>Returns:</strong> { item }<br />
            <strong>Permission:</strong> All authenticated users<br />
            <strong>Errors:</strong> 404 if item not found
          </div>
        </div>

        <!-- Update Item -->
        <div class="rounded-lg border border-[var(--ui-border)] p-4">
          <h5 class="mb-2 font-semibold text-[var(--ui-info)]">PATCH /api/items/:id</h5>
          <p class="mb-2 text-sm">Update an existing item (all fields optional except ID)</p>
          <div class="rounded bg-[var(--ui-bg-muted)] p-2 text-sm">
            <strong>Body:</strong> { name?, unit?, category?, sub_category?, is_active? }<br />
            <strong>Returns:</strong> { item, message }<br />
            <strong>Permission:</strong> Admin only<br />
            <strong>Note:</strong> Code cannot be changed
          </div>
        </div>

        <!-- Delete Item -->
        <div class="rounded-lg border border-[var(--ui-border)] p-4">
          <h5 class="mb-2 font-semibold text-[var(--ui-error)]">DELETE /api/items/:id</h5>
          <p class="mb-2 text-sm">
            Hard delete an item (use soft delete with is_active: false instead)
          </p>
          <div class="rounded bg-[var(--ui-bg-muted)] p-2 text-sm">
            <strong>Returns:</strong> { message }<br />
            <strong>Permission:</strong> Admin only<br />
            <strong>Cascade:</strong> Deletes LocationStock, ItemPrice, and transaction lines
          </div>
        </div>

        <!-- Update Price -->
        <div class="rounded-lg border border-[var(--ui-border)] p-4">
          <h5 class="mb-2 font-semibold text-[var(--ui-info)]">PATCH /api/items/:itemId/price</h5>
          <p class="mb-2 text-sm">Update item price for current period</p>
          <div class="rounded bg-[var(--ui-bg-muted)] p-2 text-sm">
            <strong>Body:</strong> { price, period_id? }<br />
            <strong>Returns:</strong> { item_price, message }<br />
            <strong>Permission:</strong> Admin only<br />
            <strong>Errors:</strong> 400 if period is CLOSED or item is inactive
          </div>
        </div>

        <!-- Import Template -->
        <div class="rounded-lg border border-[var(--ui-border)] p-4">
          <h5 class="mb-2 font-semibold text-[var(--ui-success)]">
            GET /api/items/import-template
          </h5>
          <p class="mb-2 text-sm">Download import template file</p>
          <div class="rounded bg-[var(--ui-bg-muted)] p-2 text-sm">
            <strong>Query:</strong> format=xlsx|csv (default: xlsx)<br />
            <strong>Returns:</strong> File download<br />
            <strong>Permission:</strong> Admin or Supervisor
          </div>
        </div>

        <!-- Import Preview -->
        <div class="rounded-lg border border-[var(--ui-border)] p-4">
          <h5 class="mb-2 font-semibold text-[var(--ui-info)]">POST /api/items/import-preview</h5>
          <p class="mb-2 text-sm">Preview import file without database changes</p>
          <div class="rounded bg-[var(--ui-bg-muted)] p-2 text-sm">
            <strong>Body:</strong> FormData with file<br />
            <strong>Returns:</strong> { fileName, headers, rows, totalRows, previewCount,
            missingColumns, warnings }<br />
            <strong>Permission:</strong> Admin or Supervisor<br />
            <strong>Limits:</strong> 10MB file, 1000 rows max
          </div>
        </div>

        <!-- Import Execute -->
        <div class="rounded-lg border border-[var(--ui-border)] p-4">
          <h5 class="mb-2 font-semibold text-[var(--ui-primary)]">POST /api/items/import</h5>
          <p class="mb-2 text-sm">Execute full import with validation</p>
          <div class="rounded bg-[var(--ui-bg-muted)] p-2 text-sm">
            <strong>Body:</strong> FormData with file<br />
            <strong>Returns:</strong> { success, summary, errors }<br />
            <strong>Permission:</strong> Admin or Supervisor<br />
            <strong>Validation:</strong> Duplicates, Zod schema, existing codes
          </div>
        </div>
      </div>
    </section>

    <!-- Section 10: Types & Validation -->
    <section
      id="dev-section-types"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 text-left transition-colors hover:bg-[var(--ui-bg-muted)]"
        @click="toggleSection('types')"
      >
        <div class="flex items-center gap-3">
          <UIcon name="i-heroicons-code-bracket" class="size-5 text-[var(--ui-primary)]" />
          <h4 class="font-semibold text-[var(--ui-text-highlighted)]">Types & Validation</h4>
        </div>
        <UIcon
          :name="isExpanded('types') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="size-5 text-[var(--ui-text-muted)]"
        />
      </button>

      <div v-if="isExpanded('types')" class="space-y-4 border-t border-[var(--ui-border)] p-4">
        <p>TypeScript types and Zod validation schemas for Items management.</p>

        <h5 class="font-semibold">Item Types</h5>
        <DeveloperCodeBlock
          :code="codeExamples.itemTypes"
          language="typescript"
          filename="app/composables/useItems.ts"
        />

        <h5 class="font-semibold">Validation Schemas</h5>
        <DeveloperCodeBlock
          :code="codeExamples.validationSchema"
          language="typescript"
          filename="server/api/items/index.post.ts"
        />

        <div class="rounded-lg bg-[var(--ui-bg-muted)] p-4">
          <h5 class="mb-2 font-semibold">Unit Enum Values</h5>
          <ul class="list-inside list-disc space-y-1 text-sm">
            <li><code class="code-inline">KG</code> - Kilograms</li>
            <li><code class="code-inline">EA</code> - Each (individual items)</li>
            <li><code class="code-inline">LTR</code> - Liters</li>
            <li><code class="code-inline">BOX</code> - Box</li>
            <li><code class="code-inline">CASE</code> - Case</li>
            <li><code class="code-inline">PACK</code> - Pack</li>
          </ul>
        </div>

        <div class="rounded-lg bg-[var(--ui-bg-muted)] p-4">
          <h5 class="mb-2 font-semibold">Validation Rules Summary</h5>
          <ul class="list-inside list-disc space-y-1 text-sm">
            <li>Item codes are automatically uppercased and must be unique</li>
            <li>All string fields are trimmed before validation</li>
            <li>Category and sub_category are nullable (stored as null if omitted)</li>
            <li>Unit must be one of the enum values (case-sensitive)</li>
            <li>Prices must be positive numbers</li>
            <li>
              Validation errors return 400 status with detailed Zod error messages in the response
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
