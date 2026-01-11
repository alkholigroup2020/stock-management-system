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
  tsconfig: `// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true
  }
}`,

  interfaces: `// shared/types/entities.ts
export interface Item {
  id: string;
  code: string;
  name: string;
  unit: "KG" | "EA" | "LTR" | "BOX" | "CASE" | "PACK";
  category: string;
  minimumStock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Delivery {
  id: string;
  locationId: string;
  supplierId: string;
  periodId: string;
  invoiceNumber: string;
  deliveryDate: string;
  status: "DRAFT" | "POSTED";
  totalValue: number;
  lines: DeliveryLine[];
}`,

  zod: `import { z } from "zod";

// Define schema
const createItemSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  unit: z.enum(["KG", "EA", "LTR", "BOX", "CASE", "PACK"]),
  category: z.string().min(1),
  minimumStock: z.number().min(0).default(0),
});

// Infer TypeScript type from schema
type CreateItemInput = z.infer<typeof createItemSchema>;

// Validate in API route
export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const result = createItemSchema.safeParse(body);
  if (!result.success) {
    throw createError({
      statusCode: 400,
      data: {
        code: "VALIDATION_ERROR",
        message: "Invalid input",
        details: result.error.flatten(),
      },
    });
  }

  // result.data is typed as CreateItemInput
  return await prisma.item.create({ data: result.data });
});`,

  prismaDecimal: `import { Decimal } from "@prisma/client/runtime/library";

// Converting Prisma Decimal to JavaScript number
const quantity = item.quantity.toNumber();

// Converting to string for display
const displayValue = item.price.toString();

// Creating Decimal from number
const price = new Decimal(19.99);

// Precise arithmetic with Decimal.js
const total = quantity.mul(price);`,

  errorGuard: `// Error type guard pattern
try {
  await $fetch("/api/items", { method: "POST", body });
} catch (err) {
  // Type assertion for error handling
  const error = err as {
    data?: {
      code?: string;
      message?: string;
      details?: Record<string, string[]>;
    };
  };

  if (error.data?.code === "VALIDATION_ERROR") {
    // Handle validation error
  } else if (error.data?.code === "INSUFFICIENT_STOCK") {
    // Handle stock error
  } else {
    // Generic error handling
    toast.showError(error.data?.message || "An error occurred");
  }
}`,

  typeGuards: `// Check if value is defined
function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

// Check specific error code
function hasErrorCode(err: unknown, code: string): boolean {
  return (err as { data?: { code?: string } }).data?.code === code;
}`,
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="border-b border-[var(--ui-border)] pb-4">
      <h2 class="text-2xl font-bold text-[var(--ui-text-highlighted)]">Type Safety Guide</h2>
      <p class="mt-1 text-sm text-[var(--ui-text-muted)]">
        TypeScript strict mode and Zod validation patterns
      </p>
    </div>

    <!-- Strict Section -->
    <section
      id="dev-section-strict"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('strict')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-shield-check" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">TypeScript Strict Mode</span>
        </span>
        <UIcon
          :name="isExpanded('strict') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('strict')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          The project uses TypeScript strict mode with additional checks:
        </p>

        <DeveloperCodeBlock :code="codeExamples.tsconfig" language="json" />

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Requirements</h4>
          <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
            <li class="flex items-start gap-2">
              <UIcon
                name="i-heroicons-check-circle"
                class="mt-0.5 shrink-0 text-[var(--ui-success)]"
              />
              <span>
                <strong>No implicit any:</strong> Always explicitly type variables and parameters
              </span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon
                name="i-heroicons-check-circle"
                class="mt-0.5 shrink-0 text-[var(--ui-success)]"
              />
              <span>
                <strong>Null checks:</strong> Handle null/undefined explicitly with optional
                chaining
              </span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon
                name="i-heroicons-check-circle"
                class="mt-0.5 shrink-0 text-[var(--ui-success)]"
              />
              <span><strong>Return types:</strong> Define return types for all functions</span>
            </li>
          </ul>
        </div>

        <div class="rounded-lg border border-[var(--ui-error)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-error)]">
            <UIcon name="i-heroicons-exclamation-triangle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Required:</strong> <code class="rounded bg-[var(--ui-bg-muted)] px-1 py-0.5 text-xs">pnpm typecheck</code> must pass with zero errors
              before any PR.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Interfaces Section -->
    <section
      id="dev-section-interfaces"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('interfaces')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-document-text" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Interface Definitions</span>
        </span>
        <UIcon
          :name="isExpanded('interfaces') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('interfaces')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Define interfaces in <code class="rounded bg-[var(--ui-bg-muted)] px-1 py-0.5 text-xs">/shared/types/</code> for shared types between frontend and
          backend:
        </p>

        <DeveloperCodeBlock :code="codeExamples.interfaces" language="typescript" />

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Common Patterns</h4>
          <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
            <li>
              <strong>Entity interfaces</strong> - User, Location, Item, Delivery, Issue, Transfer
            </li>
            <li><strong>API response interfaces</strong> - Wrapped with pagination or metadata</li>
            <li><strong>Form data interfaces</strong> - For component props and form state</li>
            <li><strong>Props interfaces</strong> - Use defineProps&lt;{}&gt; in components</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Zod Section -->
    <section
      id="dev-section-zod"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('zod')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-check-badge" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Zod Validation</span>
        </span>
        <UIcon
          :name="isExpanded('zod') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('zod')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Use Zod for runtime validation in API routes:
        </p>

        <DeveloperCodeBlock :code="codeExamples.zod" language="typescript" />

        <div class="rounded-lg border border-[var(--ui-info)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-info)]">
            <UIcon name="i-heroicons-information-circle" class="mt-0.5 shrink-0" />
            <span>
              Use <code class="rounded bg-[var(--ui-bg-muted)] px-1 py-0.5 text-xs">z.infer&lt;typeof schema&gt;</code> to derive TypeScript types from Zod
              schemas - no need to define types twice.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Prisma Section -->
    <section
      id="dev-section-prisma"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('prisma')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-circle-stack" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Prisma Decimal Handling</span>
        </span>
        <UIcon
          :name="isExpanded('prisma') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('prisma')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Prisma Decimal type requires special handling - it's not a plain number:
        </p>

        <DeveloperCodeBlock :code="codeExamples.prismaDecimal" language="typescript" />

        <div class="rounded-lg border border-[var(--ui-warning)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-warning)]">
            <UIcon name="i-heroicons-exclamation-triangle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Important:</strong> Always use <code class="rounded bg-[var(--ui-bg-muted)] px-1 py-0.5 text-xs">.toNumber()</code> when sending Decimal
              values to the frontend, as they cannot be JSON serialized directly.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Guards Section -->
    <section
      id="dev-section-guards"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('guards')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-funnel" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Type Guards</span>
        </span>
        <UIcon
          :name="isExpanded('guards') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('guards')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Use type guards for safe error handling:
        </p>

        <DeveloperCodeBlock :code="codeExamples.errorGuard" language="typescript" />

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Common Type Guards</h4>
          <DeveloperCodeBlock :code="codeExamples.typeGuards" language="typescript" />
        </div>

        <div class="rounded-lg border border-[var(--ui-error)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-error)]">
            <UIcon name="i-heroicons-exclamation-triangle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Never use bare <code class="rounded bg-[var(--ui-bg-muted)] px-1 py-0.5 text-xs">any</code>:</strong> Always use proper type assertions
              or type guards.
            </span>
          </p>
        </div>
      </div>
    </section>
  </div>
</template>
