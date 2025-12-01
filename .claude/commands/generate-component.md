# Component Generator

Generate boilerplate code following project standards from `UI_DESIGN_GUIDE.md`.

## Usage

```
/generate-component [type] [name]
```

**Types:** `page`, `feature`, `form`, `store`, `composable`

**Arguments:** $ARGUMENTS

Parse the arguments to determine:

1. **type** - First word (page, feature, form, store, composable)
2. **name** - Second word (PascalCase for components, camelCase for stores/composables)

## Instructions

1. **Read design standards first:**
   - Read `project-docs/UI_DESIGN_GUIDE.md` for component patterns
   - Read `CLAUDE.md` for formatting rules (double quotes, semicolons, 2-space indent)

2. **Generate the appropriate template** based on type:

---

## Templates

### Type: `page`

**Output path:** `app/pages/[name].vue` (kebab-case filename)

```vue
<script setup lang="ts">
definePageMeta({
  layout: "default",
  middleware: ["auth"],
});

// Composables
const { isOnline } = useOnlineStatus();

// State
const loading = ref(false);
const error = ref<string | null>(null);

// Data fetching
const fetchData = async () => {
  loading.value = true;
  error.value = null;
  try {
    // TODO: Implement data fetching
  } catch (e) {
    error.value = e instanceof Error ? e.message : "An error occurred";
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="p-4 md:p-6">
    <LayoutPageHeader
      title="[Page Title]"
      icon="i-lucide-[icon]"
      :show-location="true"
      :show-period="true"
      location-scope="current"
    >
      <template #actions>
        <UButton color="primary" icon="i-lucide-plus" :disabled="!isOnline" class="cursor-pointer">
          Action
        </UButton>
      </template>
    </LayoutPageHeader>

    <div class="space-y-6">
      <!-- Offline warning -->
      <UAlert
        v-if="!isOnline"
        color="warning"
        icon="i-lucide-wifi-off"
        title="You're offline"
        description="Some features may be unavailable"
      />

      <!-- Error state -->
      <ErrorAlert v-if="error" :message="error" @retry="fetchData" />

      <!-- Loading state -->
      <LoadingSpinner v-else-if="loading" />

      <!-- Content -->
      <UCard v-else>
        <!-- TODO: Add content -->
      </UCard>
    </div>
  </div>
</template>
```

---

### Type: `feature`

**Output path:** `app/components/[feature]/[Name].vue`

```vue
<script setup lang="ts">
interface Props {
  // TODO: Define props
  id: number;
  title: string;
  disabled?: boolean;
}

interface Emits {
  (e: "select", id: number): void;
  (e: "delete", id: number): void;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});

const emit = defineEmits<Emits>();

// Computed
const isActive = computed(() => {
  // TODO: Implement logic
  return false;
});

// Methods
const handleSelect = () => {
  if (!props.disabled) {
    emit("select", props.id);
  }
};

const handleDelete = () => {
  emit("delete", props.id);
};
</script>

<template>
  <div class="card-elevated p-4" :class="{ 'opacity-50': disabled }">
    <div class="flex items-start justify-between">
      <div>
        <h4 class="text-[var(--ui-text-highlighted)] font-semibold">
          {{ title }}
        </h4>
        <!-- TODO: Add content -->
      </div>
      <div class="flex gap-2">
        <UButton
          color="primary"
          variant="ghost"
          icon="i-lucide-edit"
          size="sm"
          :disabled="disabled"
          class="cursor-pointer"
          @click="handleSelect"
        />
        <UButton
          color="error"
          variant="ghost"
          icon="i-lucide-trash-2"
          size="sm"
          :disabled="disabled"
          class="cursor-pointer"
          @click="handleDelete"
        />
      </div>
    </div>
  </div>
</template>
```

---

### Type: `form`

**Output path:** `app/components/[feature]/[Name]Form.vue`

```vue
<script setup lang="ts">
import { z } from "zod";

// Schema
const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  // TODO: Add more fields
});

type FormData = z.infer<typeof schema>;

interface Props {
  initialData?: Partial<FormData>;
  loading?: boolean;
}

interface Emits {
  (e: "submit", data: FormData): void;
  (e: "cancel"): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<Emits>();

// State
const form = ref<FormData>({
  name: props.initialData?.name ?? "",
  email: props.initialData?.email ?? "",
});

const errors = ref<Partial<Record<keyof FormData, string>>>({});

// Validation
const validate = (): boolean => {
  const result = schema.safeParse(form.value);
  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors;
    errors.value = Object.fromEntries(
      Object.entries(fieldErrors).map(([key, value]) => [key, value?.[0] ?? ""])
    );
    return false;
  }
  errors.value = {};
  return true;
};

// Submit
const handleSubmit = () => {
  if (validate()) {
    emit("submit", form.value);
  }
};

// Reset
const handleCancel = () => {
  form.value = {
    name: props.initialData?.name ?? "",
    email: props.initialData?.email ?? "",
  };
  errors.value = {};
  emit("cancel");
};
</script>

<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <!-- Name Field -->
    <div>
      <label for="name" class="form-label">Name</label>
      <UInput
        id="name"
        v-model="form.name"
        placeholder="Enter name"
        :color="errors.name ? 'error' : undefined"
      />
      <p v-if="errors.name" class="form-error">{{ errors.name }}</p>
    </div>

    <!-- Email Field -->
    <div>
      <label for="email" class="form-label">Email</label>
      <UInput
        id="email"
        v-model="form.email"
        type="email"
        placeholder="Enter email"
        :color="errors.email ? 'error' : undefined"
      />
      <p v-if="errors.email" class="form-error">{{ errors.email }}</p>
    </div>

    <!-- TODO: Add more fields -->

    <!-- Actions -->
    <div class="flex justify-end gap-3 pt-4">
      <UButton type="button" variant="outline" class="cursor-pointer" @click="handleCancel">
        Cancel
      </UButton>
      <UButton type="submit" color="primary" :loading="loading" class="cursor-pointer">
        Submit
      </UButton>
    </div>
  </form>
</template>
```

---

### Type: `store`

**Output path:** `app/stores/[name].ts` (camelCase filename)

```typescript
import { defineStore } from "pinia";

// Types
interface [Name]Item {
  id: number;
  name: string;
  // TODO: Add more fields
}

interface [Name]State {
  items: [Name]Item[];
  currentItem: [Name]Item | null;
  loading: boolean;
  error: string | null;
}

export const use[Name]Store = defineStore("[name]", () => {
  // State
  const items = ref<[Name]Item[]>([]);
  const currentItem = ref<[Name]Item | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const itemCount = computed(() => items.value.length);

  const getById = computed(() => {
    return (id: number) => items.value.find((item) => item.id === id);
  });

  // Actions
  const fetchItems = async () => {
    loading.value = true;
    error.value = null;
    try {
      const data = await $fetch<[Name]Item[]>("/api/[name]");
      items.value = data;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to fetch items";
      throw e;
    } finally {
      loading.value = false;
    }
  };

  const setCurrentItem = (item: [Name]Item | null) => {
    currentItem.value = item;
  };

  const addItem = async (data: Omit<[Name]Item, "id">) => {
    loading.value = true;
    error.value = null;
    try {
      const newItem = await $fetch<[Name]Item>("/api/[name]", {
        method: "POST",
        body: data,
      });
      items.value.push(newItem);
      return newItem;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to add item";
      throw e;
    } finally {
      loading.value = false;
    }
  };

  const updateItem = async (id: number, data: Partial<[Name]Item>) => {
    loading.value = true;
    error.value = null;
    try {
      const updated = await $fetch<[Name]Item>(`/api/[name]/${id}`, {
        method: "PATCH",
        body: data,
      });
      const index = items.value.findIndex((item) => item.id === id);
      if (index !== -1) {
        items.value[index] = updated;
      }
      return updated;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to update item";
      throw e;
    } finally {
      loading.value = false;
    }
  };

  const deleteItem = async (id: number) => {
    loading.value = true;
    error.value = null;
    try {
      await $fetch(`/api/[name]/${id}`, { method: "DELETE" });
      items.value = items.value.filter((item) => item.id !== id);
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to delete item";
      throw e;
    } finally {
      loading.value = false;
    }
  };

  const reset = () => {
    items.value = [];
    currentItem.value = null;
    loading.value = false;
    error.value = null;
  };

  return {
    // State
    items,
    currentItem,
    loading,
    error,
    // Getters
    itemCount,
    getById,
    // Actions
    fetchItems,
    setCurrentItem,
    addItem,
    updateItem,
    deleteItem,
    reset,
  };
});
```

---

### Type: `composable`

**Output path:** `app/composables/use[Name].ts` (camelCase with use prefix)

```typescript
import type { Ref } from "vue";

// Types
interface Use[Name]Options {
  // TODO: Define options
  initialValue?: number;
}

interface Use[Name]Return {
  // TODO: Define return type
  value: Ref<number>;
  isValid: ComputedRef<boolean>;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

export const use[Name] = (options: Use[Name]Options = {}): Use[Name]Return => {
  const { initialValue = 0 } = options;

  // State
  const value = ref(initialValue);

  // Computed
  const isValid = computed(() => value.value >= 0);

  // Methods
  const increment = () => {
    value.value++;
  };

  const decrement = () => {
    if (value.value > 0) {
      value.value--;
    }
  };

  const reset = () => {
    value.value = initialValue;
  };

  return {
    value,
    isValid,
    increment,
    decrement,
    reset,
  };
};
```

---

## After Generation

1. Replace all `[Name]` placeholders with the actual component name (PascalCase)
2. Replace all `[name]` placeholders with the kebab-case or camelCase version
3. Add appropriate TODO comments for sections that need customization
4. Ensure the file is created in the correct directory
5. Run `pnpm typecheck` to verify no TypeScript errors

## Critical Rules

- Follow Prettier formatting: double quotes, semicolons, 2-space indent
- All buttons must have `cursor-pointer` class
- All pages must use `p-4 md:p-6` padding
- Use semantic color props in Nuxt UI components
- Include proper TypeScript types for all props, emits, and state
- Reference `project-docs/UI_DESIGN_GUIDE.md` for any design patterns
