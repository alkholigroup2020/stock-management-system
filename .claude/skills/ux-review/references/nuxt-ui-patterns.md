# Nuxt UI Patterns

Best practices and common issues for Nuxt UI (free version) components.

## Component Selection Guide

| Need                     | Component                   | Notes                                        |
| ------------------------ | --------------------------- | -------------------------------------------- |
| Primary action           | `UButton`                   | Use `color="primary"`                        |
| Secondary action         | `UButton`                   | Use `variant="outline"` or `variant="ghost"` |
| Destructive action       | `UButton`                   | Use `color="red"`                            |
| Navigation link          | `UButton`                   | Use `to="/path"` (renders as `<NuxtLink>`)   |
| Form input               | `UInput`                    | Wrap in `UFormGroup` for labels              |
| Selection (few options)  | `URadioGroup` / `UCheckbox` | Visible options                              |
| Selection (many options) | `USelectMenu`               | Dropdown with search                         |
| Boolean toggle           | `UToggle`                   | For on/off settings                          |
| Data display             | `UTable`                    | For tabular data                             |
| Grouped content          | `UCard`                     | For visual grouping                          |
| Overlay content          | `UModal` / `USlideover`     | Modal for focus, slideover for detail panels |
| User feedback            | `UNotification`             | Toast-style alerts                           |
| Loading placeholder      | `USkeleton`                 | Content loading states                       |

## Forms

### Standard Form Pattern

```vue
<UForm :state="state" :schema="schema" @submit="onSubmit">
  <UFormGroup label="Email" name="email" required>
    <UInput v-model="state.email" type="email" autocomplete="email" />
  </UFormGroup>
  
  <UFormGroup label="Password" name="password" required>
    <UInput v-model="state.password" type="password" autocomplete="current-password" />
  </UFormGroup>
  
  <div class="flex gap-3 justify-end">
    <UButton variant="ghost" @click="onCancel">Cancel</UButton>
    <UButton type="submit" :loading="isSubmitting">Save</UButton>
  </div>
</UForm>
```

### Form Issues to Check

- ❌ Missing `UFormGroup` wrapper (no label association)
- ❌ Missing `name` prop (validation won't work)
- ❌ Missing `type` on inputs (wrong keyboard on mobile)
- ❌ Missing `autocomplete` (no browser autofill)
- ❌ Submit button without `type="submit"`
- ❌ No loading state during submission
- ❌ No cancel/escape route

## Buttons

### Button Hierarchy

```vue
<!-- Primary: main action, 1 per section -->
<UButton color="primary">Save Changes</UButton>

<!-- Secondary: alternative actions -->
<UButton variant="outline">Export</UButton>

<!-- Tertiary: low-emphasis actions -->
<UButton variant="ghost">Cancel</UButton>

<!-- Destructive: dangerous actions -->
<UButton color="red">Delete</UButton>

<!-- Icon-only: must have aria-label -->
<UButton icon="i-heroicons-trash" color="red" variant="ghost" aria-label="Delete item" />
```

### Button Issues to Check

- ❌ Multiple primary buttons competing
- ❌ Icon-only without `aria-label`
- ❌ Missing `loading` state on async actions
- ❌ Link styled as button without `to` prop
- ❌ Disabled without visual explanation why

## Modals and Overlays

### Modal Pattern

```vue
<UModal v-model="isOpen" :ui="{ width: 'sm:max-w-md' }">
  <UCard>
    <template #header>
      <h3 class="text-lg font-semibold">Confirm Delete</h3>
    </template>
    
    <p>Are you sure? This cannot be undone.</p>
    
    <template #footer>
      <div class="flex gap-3 justify-end">
        <UButton variant="ghost" @click="isOpen = false">Cancel</UButton>
        <UButton color="red" @click="onDelete">Delete</UButton>
      </div>
    </template>
  </UCard>
</UModal>
```

### Modal Issues to Check

- ❌ No close button or escape route
- ❌ Missing heading (screen readers need context)
- ❌ Destructive action as primary (should be secondary visual weight)
- ❌ Too much content (should be focused)
- ❌ Form inside modal without proper submit handling

## Tables

### Table Pattern

```vue
<UTable :rows="items" :columns="columns">
  <template #actions-data="{ row }">
    <UDropdown :items="getActions(row)">
      <UButton icon="i-heroicons-ellipsis-vertical" variant="ghost" aria-label="Actions" />
    </UDropdown>
  </template>
  
  <template #empty-state>
    <div class="text-center py-8">
      <p class="text-gray-500">No items yet</p>
      <UButton class="mt-4" @click="onCreate">Create First Item</UButton>
    </div>
  </template>
</UTable>
```

### Table Issues to Check

- ❌ No empty state
- ❌ No loading state (`loading` prop)
- ❌ Actions column without accessible labels
- ❌ No sorting/filtering on large datasets
- ❌ Doesn't adapt for mobile (consider cards)

## Navigation

### Common Patterns

```vue
<!-- Horizontal nav -->
<UHorizontalNavigation :links="navLinks" />

<!-- Vertical nav (sidebar) -->
<UVerticalNavigation :links="sidebarLinks" />

<!-- Breadcrumbs -->
<UBreadcrumb :links="breadcrumbLinks" />

<!-- Tabs -->
<UTabs :items="tabItems" />
```

### Navigation Issues to Check

- ❌ No active state indication
- ❌ Current page as clickable link (should be span)
- ❌ Too many top-level items (>7 causes cognitive load)
- ❌ Deep nesting without breadcrumbs
- ❌ Mobile nav that doesn't collapse

## Feedback and States

### Loading States

```vue
<!-- Button loading -->
<UButton :loading="isLoading">Save</UButton>

<!-- Skeleton placeholders -->
<USkeleton class="h-4 w-48" />
<USkeleton class="h-32 w-full" />

<!-- Table loading -->
<UTable :loading="isLoading" :rows="items" />
```

### Notifications

```vue
<script setup>
const toast = useToast();

function onSuccess() {
  toast.add({
    title: "Saved successfully",
    color: "green",
    icon: "i-heroicons-check-circle",
  });
}

function onError() {
  toast.add({
    title: "Failed to save",
    description: "Please try again or contact support.",
    color: "red",
    icon: "i-heroicons-exclamation-circle",
  });
}
</script>
```

### Feedback Issues to Check

- ❌ No feedback after form submission
- ❌ Error without explanation or next step
- ❌ Success message that disappears too fast
- ❌ Loading without any indicator
- ❌ Inline errors that don't clear when fixed

## Nuxt 4 Specific

### Composables

```vue
<script setup>
// Color mode
const colorMode = useColorMode();

// App config for theming
const appConfig = useAppConfig();

// Toast notifications
const toast = useToast();

// Modal control
const modal = useModal();
</script>
```

### Dark Mode

- Test both light and dark modes
- Check contrast in both modes
- Ensure custom colors work in dark mode
- Use `dark:` variants for custom styles

```vue
<!-- Respects color mode automatically -->
<UCard>Content</UCard>

<!-- Custom dark mode styling -->
<div class="bg-white dark:bg-gray-900">
  <p class="text-gray-900 dark:text-gray-100">Text</p>
</div>
```
