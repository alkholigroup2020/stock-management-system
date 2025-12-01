# UI Design Rules

This document outlines the UI design patterns and rules established for the Stock Management System. Follow these guidelines when creating or updating pages to maintain visual consistency.

---

## 1. Page Layout & Padding

### Page Container
```vue
<div class="px-3 py-0 md:px-4 md:py-1 space-y-3">
  <!-- Page content -->
</div>
```

- **Horizontal padding:** `px-3` (mobile), `md:px-4` (desktop)
- **Vertical padding:** `py-0` (mobile), `md:py-1` (desktop) - minimal vertical padding
- **Section spacing:** `space-y-3` between major sections

---

## 2. Page Header

### Structure (Responsive)
```vue
<div class="flex items-center justify-between gap-3">
  <div class="flex items-center gap-2 sm:gap-4">
    <!-- Responsive icon size -->
    <UIcon name="i-lucide-{icon-name}" class="w-8 h-8 sm:w-12 sm:h-12 text-primary" />
    <!-- Responsive title size -->
    <h1 class="text-xl sm:text-3xl font-bold text-primary">Page Title</h1>
  </div>
  <UButton
    v-if="hasPermission"
    color="primary"
    icon="i-lucide-plus"
    size="lg"
    class="cursor-pointer rounded-full px-3 sm:px-6"
    @click="handleAction"
  >
    <!-- Responsive button text -->
    <span class="hidden sm:inline">Create Item</span>
    <span class="sm:hidden">Create</span>
  </UButton>
</div>
```

### Rules
- **Icon:** Responsive size (`w-8 h-8 sm:w-12 sm:h-12`), primary color, NO background or border
- **Title:** Responsive size (`text-xl sm:text-3xl font-bold text-primary`)
- **Action button:** Rounded (`rounded-full`), responsive padding (`px-3 sm:px-6`)
- **Button text:** Short text on mobile, full text on larger screens

---

## 3. Filter Section

### Structure (Dual Layout: Desktop & Mobile)

Use separate layouts for desktop and mobile to ensure optimal UX on all screen sizes.

```vue
<UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
  <!-- Desktop: Single row layout (lg and above) -->
  <div class="hidden lg:flex items-center gap-3">
    <!-- Search -->
    <div class="flex-1 min-w-0 max-w-md">
      <UInput
        v-model="filters.search"
        placeholder="Search by name or code..."
        icon="i-lucide-search"
        size="lg"
        class="w-full"
      />
    </div>

    <!-- Toggle Button Group -->
    <div class="flex items-center gap-1 p-1 bg-muted rounded-full">
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        class="px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 cursor-pointer whitespace-nowrap"
        :class="getButtonClass(option.value)"
        @click="selectOption(option.value)"
      >
        {{ option.label }}
      </button>
    </div>

    <!-- Status Dropdown (Far Right) -->
    <UDropdownMenu :items="dropdownItems" class="ml-auto">
      <UButton
        color="neutral"
        variant="outline"
        size="lg"
        class="cursor-pointer rounded-full px-5"
        trailing-icon="i-lucide-chevron-down"
      >
        <UIcon :name="statusIcon" class="w-4 h-4 mr-2" />
        {{ statusLabel }}
      </UButton>
    </UDropdownMenu>
  </div>

  <!-- Mobile: Stacked layout (below lg) -->
  <div class="flex flex-col gap-3 lg:hidden">
    <!-- Row 1: Search and Status Dropdown -->
    <div class="flex items-center gap-3">
      <div class="flex-1 min-w-0">
        <UInput
          v-model="filters.search"
          placeholder="Search..."
          icon="i-lucide-search"
          size="lg"
          class="w-full"
        />
      </div>
      <!-- Icon-only dropdown on mobile -->
      <UDropdownMenu :items="dropdownItems">
        <UButton
          color="neutral"
          variant="outline"
          size="lg"
          class="cursor-pointer rounded-full px-3"
          trailing-icon="i-lucide-chevron-down"
        >
          <UIcon :name="statusIcon" class="w-4 h-4" />
        </UButton>
      </UDropdownMenu>
    </div>

    <!-- Row 2: Toggle Buttons (horizontally scrollable) -->
    <div class="overflow-x-auto -mx-3 px-3">
      <div class="flex items-center gap-1 p-1 bg-muted rounded-full w-fit">
        <button
          v-for="option in options"
          :key="option.value"
          type="button"
          class="px-3 py-2 text-sm font-medium rounded-full transition-all duration-200 cursor-pointer whitespace-nowrap"
          :class="getButtonClass(option.value)"
          @click="selectOption(option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </div>
  </div>
</UCard>
```

### Toggle Button Classes
```typescript
const getButtonClass = (value: string | null) => {
  const isSelected = filters.value === value;

  if (!isSelected) {
    return "text-muted hover:text-default hover:bg-elevated";
  }

  // All selected options use the same primary background
  return "bg-primary text-white shadow-sm";
};
```

### Rules

**Desktop (lg and above):**
- Single row: Search | Toggle buttons | Status dropdown
- Dropdown at far right using `ml-auto`
- Full dropdown button with icon + label

**Mobile (below lg):**
- **Row 1:** Search input + Status dropdown (side by side)
- **Row 2:** Toggle buttons (horizontally scrollable)
- Dropdown shows icon only (no label) with `px-3`
- Toggle container uses `overflow-x-auto` with negative margin trick (`-mx-3 px-3`)
- Shorter search placeholder
- Smaller button padding (`px-3` instead of `px-4`)

**General:**
- Card padding: `:ui="{ body: 'p-3 sm:p-4' }"`
- Toggle container: `bg-muted rounded-full` with `gap-1 p-1`
- Selected button: `bg-primary text-white shadow-sm`
- Unselected button: `text-muted hover:text-default hover:bg-elevated`

---

## 4. Dropdown Menus

### Structure with Different State Icons
```typescript
const dropdownItems = computed(() => [
  [
    {
      label: "Active",
      icon: "i-lucide-circle-check",
      active: filters.is_active === true,
      onSelect: () => selectStatus(true),
    },
    {
      label: "Inactive",
      icon: "i-lucide-archive",
      active: filters.is_active === false,
      onSelect: () => selectStatus(false),
    },
  ],
]);

// Dynamic icon for dropdown button
const statusIcon = computed(() => {
  if (filters.is_active === false) return "i-lucide-archive";
  return "i-lucide-circle-check";
});
```

### Rules
- Use `onSelect` (not `click`) for dropdown item handlers
- Each option should have its own descriptive icon
- Use `active` property to highlight the selected item
- Dropdown button icon should change based on current selection

---

## 5. Icons

### General Rules
- **NO backgrounds** on icons (remove `bg-*` classes)
- **NO borders** on icons (remove `border`, `ring-*` wrapper classes)
- **NO rounded containers** around icons
- Icons should be displayed directly with just color classes

### Page Header Icons
```vue
<UIcon name="i-lucide-map-pin" class="w-12 h-12 text-primary" />
```

### Card/List Item Icons
```vue
<UIcon :name="icon" class="w-10 h-10" :class="iconColor" />
```

### Icon Colors by Type (Example: Location Types)
```typescript
const iconColor = computed(() => {
  const colors = {
    KITCHEN: "text-amber-500 dark:text-amber-400",
    STORE: "text-emerald-500 dark:text-emerald-400",
    CENTRAL: "text-blue-500 dark:text-blue-400",
    WAREHOUSE: "text-zinc-500 dark:text-zinc-400",
  };
  return colors[type] || "text-zinc-500 dark:text-zinc-400";
});
```

---

## 6. Cards

### Usage
```vue
<UCard class="card-elevated">
  <!-- Card content -->
</UCard>
```

### Rules
- Use `card-elevated` class for elevated card styling
- **NO hover effects** - cards should remain static
- Cards have consistent border color matching other UI elements

---

## 7. Empty State

### Structure
```vue
<EmptyState
  icon="i-lucide-{icon-name}"
  title="No items found"
  description="Description text here."
>
  <template #actions>
    <UButton color="primary" icon="i-lucide-plus" class="cursor-pointer">
      Create Item
    </UButton>
  </template>
</EmptyState>
```

### Rules
- Icon displayed without background or border
- Icon uses `text-muted` color
- Clean, minimal appearance

---

## 8. Border Colors

### CSS Variables
```css
/* Light theme */
--ui-border: var(--color-zinc-400);
--ui-border-muted: var(--color-zinc-300);

/* Dark theme */
--ui-border: #454a54;
--ui-border-muted: #363b44;
```

### Rules
- All form fields (inputs, dropdowns, buttons with outline variant) use the same border color as cards
- Border color is controlled via `--ui-border` CSS variable
- The `ring-accented` class is overridden to use `--ui-border` for consistency:
  ```css
  .ring-accented {
    --tw-ring-color: var(--ui-border) !important;
  }
  ```

---

## 9. Buttons

### Primary Action Button
```vue
<UButton
  color="primary"
  icon="i-lucide-plus"
  size="lg"
  class="cursor-pointer rounded-full px-6"
>
  Action Text
</UButton>
```

### Outline/Secondary Button
```vue
<UButton
  color="neutral"
  variant="outline"
  size="lg"
  class="cursor-pointer rounded-full px-5"
>
  Button Text
</UButton>
```

### Rules
- Always include `cursor-pointer` class
- Use `rounded-full` for pill-shaped buttons
- Add horizontal padding (`px-5` or `px-6`) for better proportions

---

## 10. Component Checklist

When creating a new page, ensure:

### General
- [ ] Page container uses `px-3 py-0 md:px-4 md:py-1 space-y-3`
- [ ] All icons have NO backgrounds or borders
- [ ] Cards use `card-elevated` class without hover effects
- [ ] All buttons have `cursor-pointer` class
- [ ] Rounded buttons use `rounded-full` with appropriate padding
- [ ] Dropdown menus use `onSelect` handler

### Page Header (Responsive)
- [ ] Icon uses responsive size: `w-8 h-8 sm:w-12 sm:h-12 text-primary`
- [ ] Title uses responsive size: `text-xl sm:text-3xl font-bold text-primary`
- [ ] Action button has responsive padding: `px-3 sm:px-6`
- [ ] Button text switches between short/full: `<span class="hidden sm:inline">` pattern

### Filter Section (Responsive)
- [ ] Uses dual layout pattern: `hidden lg:flex` for desktop, `lg:hidden` for mobile
- [ ] Desktop: Single row with dropdown at far right (`ml-auto`)
- [ ] Mobile: Stacked rows with search + dropdown, then scrollable toggles
- [ ] Mobile dropdown shows icon only (no label)
- [ ] Toggle buttons scrollable on mobile: `overflow-x-auto -mx-3 px-3`
- [ ] Toggle buttons use unified `bg-primary` when selected
