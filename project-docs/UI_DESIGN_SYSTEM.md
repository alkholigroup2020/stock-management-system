# UI Design System - Stock Management System

**Unified Design Reference for All UI/UX Decisions**

Version: 2.2
Last Updated: December 2025
Status: Swapped light theme backgrounds - nav/sidebar/footer use blue-gray, content area uses white

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Brand Colors & Color System](#brand-colors--color-system)
3. [Layout & Spacing Standards](#layout--spacing-standards)
4. [Page Header](#page-header)
5. [Filter Section](#filter-section)
6. [Component Library](#component-library)
7. [Typography](#typography)
8. [Semantic Design Tokens](#semantic-design-tokens)
9. [Icons](#icons)
10. [Buttons](#buttons)
11. [Cards](#cards)
12. [Dropdown Menus](#dropdown-menus)
13. [Empty State](#empty-state)
14. [Accessibility Standards](#accessibility-standards)
15. [Tailwind CSS v4 Constraints](#tailwind-css-v4-constraints)
16. [PWA Design Considerations](#pwa-design-considerations)
17. [Async Operations & Loading States](#async-operations--loading-states)
18. [Code Formatting Standards](#code-formatting-standards)
19. [Usage Guidelines & Best Practices](#usage-guidelines--best-practices)
20. [Common Patterns & Examples](#common-patterns--examples)
21. [Component Checklist](#component-checklist)

---

## Design Philosophy

### Core Principles

1. **Semantic over Presentational**: Use `var(--ui-stock-healthy)` not `var(--color-emerald-600)`
2. **Business-Aware**: Tokens reflect domain concepts (stock status, approvals, periods)
3. **Dark Mode First**: All tokens have light/dark variants
4. **Accessible by Default**: WCAG AA contrast ratios enforced
5. **Single Source of Truth**: All colors in `app/assets/css/main.css`, nowhere else
6. **Consistency**: Unified padding, spacing, and component patterns across all pages
7. **Simplicity**: Clear language, minimal jargon, keyboard-friendly navigation

### Color Meaning

Colors in this system map directly to business logic and user intent:

| Color             | Hex     | Business Meaning                                                  |
| ----------------- | ------- | ----------------------------------------------------------------- |
| **Navy Blue**     | #1e4d8c | Brand identity, primary actions, trust, pending states, authority |
| **Emerald Green** | #45cf7b | Success, approvals, healthy stock, positive outcomes              |
| **Amber**         | #f59e0b | Warnings, low stock, price variance, attention needed             |
| **Red**           | #ef4444 | Errors, critical stock levels, rejections, dangerous actions      |
| **Blue**          | #3b82f6 | Informational messages, neutral notifications                     |
| **Zinc (Gray)**   | #71717a | Neutral UI, text, borders, disabled states                        |

---

## Brand Colors & Color System

### Primary Color - Navy Blue (#1e4d8c)

**Purpose:** Primary brand elements, headings, primary buttons, important text

**Available shades:** 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950

**Tailwind prefix:** `navy` (e.g., `navy-500`, `navy-700`)

**Full palette:**

```css
--color-navy-50: #e8f0fc; /* Lightest - subtle blue tint */
--color-navy-100: #c9dbf7;
--color-navy-200: #9bbcf0;
--color-navy-300: #6a9be6; /* Used for dark mode highlighted text */
--color-navy-400: #3d7dd9; /* Dark mode primary - vibrant blue */
--color-navy-500: #1e4d8c; /* Light mode primary, brand color */
--color-navy-600: #173d70;
--color-navy-700: #122f56;
--color-navy-800: #0d2240;
--color-navy-900: #08162a;
--color-navy-950: #040b16; /* Darkest */
```

### Secondary Color - Emerald Green (#45cf7b)

**Purpose:** Success states, secondary actions, accents, positive feedback

**Available shades:** 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950

**Tailwind prefix:** `emerald` (e.g., `emerald-400`, `emerald-600`)

**Full palette:**

```css
--color-emerald-50: #edfcf4;
--color-emerald-400: #45cf7b; /* Brand emerald green */
--color-emerald-600: #1f9a4c;
--color-emerald-950: #0a2916;
```

### Supporting Colors

**Zinc (Neutral/Gray):**

```css
--color-zinc-50: #fafafa; /* Very light gray backgrounds */
--color-zinc-300: #d4d4d8; /* Borders */
--color-zinc-600: #52525b; /* Muted text */
--color-zinc-900: #18181b; /* Primary text */
--color-zinc-950: #09090b; /* Darkest gray */
```

**Amber (Warning):**

```css
--color-amber-50: #fffbeb;
--color-amber-500: #f59e0b; /* Warning color */
--color-amber-950: #451a03;
```

**Red (Error/Critical):**

```css
--color-red-50: #fef2f2;
--color-red-600: #dc2626; /* Error color */
--color-red-950: #450a0a;
```

**Blue (Info):**

```css
--color-blue-50: #eff6ff;
--color-blue-600: #2563eb; /* Info color */
--color-blue-950: #172554;
```

### Color Usage Rules

**✅ DO:**

- Use Tailwind color tokens (e.g., `text-navy-500`, `bg-emerald-400`)
- Support both light and dark modes using `dark:` variant
- Use semantic color naming for Nuxt UI components (`color="primary"`, `color="secondary"`)
- Test in both light and dark mode
- Use business tokens for domain concepts (`--ui-stock-low`, not `--color-amber-500`)

**❌ DON'T:**

- Never use inline styles with hex colors (e.g., `style="color: #000046"`)
- Never use custom color names in Nuxt UI props (e.g., `color="navy"` won't work)
- Don't configure colors in `app.config.ts` (has no effect with Tailwind v4 `@theme`)
- Never hardcode colors that should adapt to theme

---

## Layout & Spacing Standards

### Padding Architecture (3 Sources)

**CRITICAL:** The application uses a **layered padding system** with 3 distinct sources. Understanding this architecture is essential for consistent layouts.

#### Source 1: Layout Body Padding (default.vue)

The main content area in the layout applies the primary horizontal padding and max-width constraint:

```vue
<!-- app/layouts/default.vue -->
<main class="py-2 px-0 sm:px-12 xl:py-4 xl:px-16 max-w-[1920px] mx-auto w-full">
  <slot />
</main>
```

| Breakpoint      | X-axis (horizontal) | Y-axis (vertical) |
| --------------- | ------------------- | ----------------- |
| Mobile (<640px) | `px-0` (0)          | `py-2` (8px)      |
| sm (≥640px)     | `px-12` (48px)      | `py-2` (8px)      |
| xl (≥1280px)    | `px-16` (64px)      | `py-4` (16px)     |

**Key Features:**

- Mobile screens have **zero horizontal padding** at the layout level, allowing pages to use full viewport width
- **Max-width constraint**: `max-w-[1920px]` prevents content from expanding indefinitely on very large screens (4K+ monitors)
- **Centered layout**: `mx-auto` centers content horizontally when viewport exceeds content width (ultra-wide displays)
- **Full width**: `w-full` ensures content takes full available width up to max-width
- **Stable sidebar**: Default sidebar `width="260"` prevents layout shifts during hydration

#### Source 2: Page Container Padding

Individual pages apply their own wrapper padding:

```vue
<div class="px-0 py-0 md:px-4 md:py-1 space-y-3">
  <!-- Page content -->
</div>
```

| Breakpoint      | X-axis (horizontal) | Y-axis (vertical) |
| --------------- | ------------------- | ----------------- |
| Mobile (<768px) | `px-0` (0)          | `py-0` (0)        |
| md (≥768px)     | `px-4` (16px)       | `py-1` (4px)      |

**Key:** Mobile screens have **zero padding** at the page level, relying on component-level padding (cards, etc.) for spacing.

#### Source 3: Component Padding (Cards, etc.)

Individual components like filter cards apply their own internal padding:

```vue
<UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }"></UCard>
```

### Combined Padding Summary

| Viewport           | Layout Body | Page Container | Total Before Components |
| ------------------ | ----------- | -------------- | ----------------------- |
| Mobile (<640px)    | 0           | 0              | **0**                   |
| sm-md (640-767px)  | 48px        | 0              | **48px per side**       |
| md-xl (768-1279px) | 48px        | 16px           | **64px per side**       |
| xl (≥1280px)       | 64px        | 16px           | **80px per side**       |

### Page Container Pattern

**CRITICAL:** All pages must follow this consistent container pattern:

```vue
<div class="px-0 py-0 md:px-4 md:py-1 space-y-3">
  <!-- Page content -->
</div>
```

**Rules:**

- **Horizontal padding:** `px-0` (mobile), `md:px-4` (desktop)
- **Vertical padding:** `py-0` (mobile), `md:py-1` (desktop) - minimal vertical padding
- **Section spacing:** `space-y-3` between major sections

**Login Page Exception:**

- Special centered layout with `px-4 py-12 sm:px-6 lg:px-8`

**Full-Height Pages:**

- Combine with `min-h-screen bg-default`

**Examples:**

```vue
<!-- Standard page layout -->
<template>
  <div class="px-0 py-0 md:px-4 md:py-1 space-y-3">
    <!-- Page content -->
  </div>
</template>

<!-- Full-height page layout -->
<template>
  <div class="min-h-screen bg-default px-0 py-0 md:px-4 md:py-1 space-y-3">
    <!-- Page content -->
  </div>
</template>

<!-- Login page (exception) -->
<template>
  <div class="min-h-screen flex items-center justify-center bg-default px-4 py-12 sm:px-6 lg:px-8">
    <!-- Centered content -->
  </div>
</template>
```

**IMPORTANT:** Never use inconsistent padding values like `p-4 md:p-6`, `p-6`, `p-3`, or other mixed values. Always use the unified `px-0 py-0 md:px-4 md:py-1 space-y-3` pattern for all pages except login.

### Page Content Width

**DESIGN RULE:** By default, page content flows full-width within the page container. Content sections (header, loading, error, main content) are direct children of the container and benefit from the unified `space-y-3` spacing.

**Standard Pattern (Full Width):**

```vue
<template>
  <div class="px-0 py-0 md:px-4 md:py-1 space-y-3">
    <!-- Page Header - direct child, full width -->
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2 sm:gap-4">
        <UIcon name="i-lucide-icon" class="w-8 h-8 sm:w-12 sm:h-12 text-primary" />
        <h1 class="text-xl sm:text-3xl font-bold text-primary">Page Title</h1>
      </div>
      <UButton color="primary" class="cursor-pointer">Action</UButton>
    </div>

    <!-- Loading State - direct child -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <LoadingSpinner />
    </div>

    <!-- Error State - direct child -->
    <ErrorAlert v-else-if="error" :message="error" />

    <!-- Main Content - direct child, full width -->
    <div v-else>
      <!-- Page content (cards, grids, forms, etc.) -->
    </div>
  </div>
</template>
```

**Rules:**

- **All pages use full-width content** by default
- **Direct children** of the page container benefit from `space-y-3` spacing
- **No max-width constraints** needed for standard pages (list pages, form pages, detail pages)
- **Content flows naturally** within the responsive padding

**Exception - Narrow Centered Content:**

For special pages that need narrow, centered content (e.g., login, simple modals):

```vue
<template>
  <div class="min-h-screen flex items-center justify-center bg-default px-4 py-12 sm:px-6 lg:px-8">
    <div class="max-w-md w-full">
      <!-- Narrow centered content -->
    </div>
  </div>
</template>
```

**When to use max-width constraints:**

- `max-w-md`: Login page, authentication forms
- `max-w-lg`: Simple modals, confirmation dialogs
- Generally **avoid** max-width on standard pages - let content flow full width

---

## Page Header

### Structure (Responsive)

```vue
<div class="flex items-center justify-between gap-3">
  <div class="flex items-center gap-2 sm:gap-4">
    <!-- Responsive icon size -->
    <UIcon name="i-lucide-{icon-name}" class="w-6 h-6 sm:w-10 sm:h-10 text-primary" />
    <div>
      <!-- Responsive title size -->
      <h1 class="text-xl sm:text-3xl font-bold text-primary">Page Title</h1>
      <!-- Description: hidden on mobile, visible on sm+ -->
      <p class="hidden sm:block text-sm text-[var(--ui-text-muted)] mt-1">
        Short description of the page purpose
      </p>
    </div>
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

- **Icon:** Responsive size (`w-6 h-6 sm:w-10 sm:h-10`), primary color, NO background or border
- **Title:** Responsive size (`text-xl sm:text-3xl font-bold text-primary`)
- **Description:** Hidden on mobile (`hidden sm:block`), muted text color, shown on `sm` screens and larger
- **Action button:** Rounded (`rounded-full`), responsive padding (`px-3 sm:px-6`)
- **Button text:** Short text on mobile, full text on larger screens

### Location & Period Display

For pages that need location and period context:

- **Location display:** Current location name OR "All Locations" for global pages
- **Period display:** Current period name (e.g., "November 2025")

---

## Filter Section

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

### Mobile-Only Simplified Filters (Design Rule)

**IMPORTANT:** On small screens (below `lg` breakpoint), toggle button groups should be **hidden** to simplify the mobile experience. Users can still filter using the search input and status dropdown.

**Rationale:**

- Toggle buttons take up significant horizontal space on mobile
- Scrollable toggle rows can feel cluttered on small screens
- Search and status dropdown provide sufficient filtering for mobile users
- Keeps the mobile UI clean and focused

**Implementation Pattern:**

```vue
<UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
  <!-- Desktop: Full filter bar with toggle buttons (lg and above) -->
  <div class="hidden lg:flex items-center gap-3">
    <!-- Search -->
    <div class="flex-1 min-w-0 max-w-md">
      <UInput v-model="filters.search" placeholder="Search..." icon="i-lucide-search" size="lg" class="w-full" />
    </div>

    <!-- Toggle Button Group - ONLY visible on desktop -->
    <div class="flex items-center gap-1 p-1 bg-muted rounded-full">
      <button v-for="option in options" :key="option.value" type="button"
        class="px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 cursor-pointer whitespace-nowrap"
        :class="getButtonClass(option.value)" @click="selectOption(option.value)">
        {{ option.label }}
      </button>
    </div>

    <!-- Status Dropdown -->
    <UDropdownMenu :items="dropdownItems" class="ml-auto">
      <UButton color="neutral" variant="outline" size="lg" class="cursor-pointer rounded-full px-5" trailing-icon="i-lucide-chevron-down">
        <UIcon :name="statusIcon" class="w-4 h-4 mr-2" />
        {{ statusLabel }}
      </UButton>
    </UDropdownMenu>
  </div>

  <!-- Mobile: Search and Status only - NO toggle buttons (below lg) -->
  <div class="flex items-center gap-3 lg:hidden">
    <div class="flex-1 min-w-0">
      <UInput v-model="filters.search" placeholder="Search..." icon="i-lucide-search" size="lg" class="w-full" />
    </div>
    <UDropdownMenu :items="dropdownItems">
      <UButton color="neutral" variant="outline" size="lg" class="cursor-pointer rounded-full px-3" trailing-icon="i-lucide-chevron-down">
        <UIcon :name="statusIcon" class="w-4 h-4" />
      </UButton>
    </UDropdownMenu>
  </div>
</UCard>
```

**When to apply this rule:**

- List pages with category/type toggle filters (Locations, Users, Items, etc.)
- Pages where the toggle options are "nice to have" but not critical for basic filtering
- When search + status dropdown provide sufficient filtering capability

**When NOT to apply this rule:**

- If toggle buttons are essential for the page's primary use case
- Dashboard pages where quick category switching is critical
- When user testing shows mobile users need the toggle options

---

## Component Library

### Surface/Card Classes

#### .card-elevated

Elevated card with border and shadow. **NO hover effects.**

```css
.card-elevated {
  background: var(--ui-bg-elevated);
  border: 1px solid var(--ui-border);
  border-radius: 0.5rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
```

**Usage:**

```vue
<div class="card-elevated p-6">
  <h3>Stock Summary</h3>
  <p>Content here</p>
</div>

<!-- Or with UCard -->
<UCard class="card-elevated">
  <!-- Card content -->
</UCard>
```

**IMPORTANT:** Cards should remain static - NO hover effects.

#### .card-muted

Subtle background card for secondary content.

```css
.card-muted {
  background: var(--ui-bg-muted);
  border: 1px solid var(--ui-border-muted);
  border-radius: 0.5rem;
}
```

#### .surface-inverted

Inverted surface (dark in light mode, light in dark mode).

```css
.surface-inverted {
  background: var(--ui-bg-inverted);
  color: var(--ui-text-inverted);
  border: 1px solid var(--ui-border-inverted);
  border-radius: 0.5rem;
}
```

### Form Layout Standards

**CRITICAL:** All forms must follow a responsive two-column layout pattern for optimal use of screen space and improved user experience.

#### Responsive Grid Layout

**Pattern:** Use Tailwind's responsive grid system to create forms that are:

- **Single column on mobile and tablet** (default)
- **Two columns side-by-side on large screens** (lg breakpoint and above)

**Base Structure:**

```vue
<div class="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
  <!-- Form fields here -->
</div>
```

#### Full-Width Fields

Some fields should span the entire width regardless of screen size:

- **Textareas** (Description, Address, Notes)
- **Special read-only fields** (like Location Code displays)
- **Full-width select menus** (when contextually appropriate)

**Implementation:** Use `lg:col-span-2` class:

```vue
<div class="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
  <!-- Full-width field -->
  <UFormField label="Description" name="description" class="lg:col-span-2">
    <UTextarea v-model="form.description" class="w-full" />
  </UFormField>

  <!-- Two fields side-by-side on lg+ -->
  <UFormField label="Name" name="name">
    <UInput v-model="form.name" class="w-full" />
  </UFormField>

  <UFormField label="Type" name="type">
    <USelectMenu v-model="form.type" class="w-full" />
  </UFormField>
</div>
```

#### Input Width Rule

**IMPORTANT:** All inputs must have `class="w-full"` to ensure they consume 100% of their grid cell width.

```vue
<!-- ✅ CORRECT -->
<UInput v-model="value" class="w-full" />
<USelectMenu v-model="value" class="w-full" />
<UTextarea v-model="value" class="w-full" />

<!-- ❌ WRONG - Will not fill container properly -->
<UInput v-model="value" />
```

#### Complete Form Example

```vue
<template>
  <UCard class="card-elevated">
    <template #header>
      <h2 class="text-lg font-semibold">Basic Information</h2>
    </template>

    <!-- Responsive Grid: 1 column mobile, 2 columns lg+ -->
    <div class="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
      <!-- Read-only field - Full width -->
      <div
        class="lg:col-span-2 p-4 rounded-lg bg-[var(--ui-bg-muted)] border border-[var(--ui-border-muted)]"
      >
        <label class="form-label text-xs mb-2">Location Code</label>
        <span class="text-lg font-mono font-semibold">LOC-001</span>
      </div>

      <!-- Two inputs side-by-side on large screens -->
      <UFormField label="Location Name" name="name" required>
        <UInput v-model="form.name" placeholder="Enter name" class="w-full" />
      </UFormField>

      <UFormField label="Location Type" name="type" required>
        <USelectMenu v-model="form.type" :items="types" class="w-full" />
      </UFormField>

      <!-- Textarea - Full width -->
      <UFormField label="Description" name="description" class="lg:col-span-2">
        <UTextarea v-model="form.description" :rows="3" class="w-full" />
      </UFormField>

      <!-- Timezone and Status side-by-side -->
      <UFormField label="Timezone" name="timezone">
        <USelectMenu v-model="form.timezone" :items="timezones" class="w-full" />
      </UFormField>

      <div class="p-4 rounded-lg bg-[var(--ui-bg-muted)] border border-[var(--ui-border)]">
        <label class="font-semibold">Status</label>
        <UToggle v-model="form.is_active" />
      </div>
    </div>
  </UCard>
</template>
```

#### Form Layout Rules Summary

| Rule                   | Specification                                           |
| ---------------------- | ------------------------------------------------------- |
| **Grid Container**     | `grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6` |
| **Gap Between Fields** | `gap-6` (1.5rem / 24px)                                 |
| **Full-Width Fields**  | Add `lg:col-span-2` class                               |
| **Input Width**        | Always include `class="w-full"`                         |
| **Breakpoint**         | Use `lg:` prefix (1024px and above)                     |
| **Mobile Behavior**    | Single column stack (grid-cols-1)                       |

#### Single Column Section Layout (Exception)

Some form sections work better with a single-column layout (e.g., Settings sections with just 2-3 fields). In these cases:

**Rules:**

- Use `space-y-6` for vertical spacing between fields
- Apply `w-full lg:w-1/2` to individual fields for 50% width on large screens
- Fields stack vertically on all screen sizes
- Each field takes 100% width on mobile, 50% width on large screens

**Example:**

```vue
<UCard class="card-elevated">
  <template #header>
    <h2 class="text-lg font-semibold">Settings</h2>
  </template>

  <!-- Single column layout with 50% width fields on large screens -->
  <div class="space-y-6">
    <UFormField label="Timezone" name="timezone" class="w-full lg:w-1/2">
      <USelectMenu v-model="form.timezone" :items="timezones" class="w-full" />
    </UFormField>

    <div class="w-full lg:w-1/2 p-4 rounded-lg bg-[var(--ui-bg-muted)]">
      <label class="font-semibold">Status</label>
      <UToggle v-model="form.is_active" />
    </div>
  </div>
</UCard>
```

**When to use:**

- Settings sections with 2-3 fields
- When fields don't naturally pair with each other
- When visual balance is better with stacked layout
- When fields have different UI patterns (input + toggle)

### Form Classes

#### .form-label

Consistent label styling for form fields.

```css
.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--ui-text);
  margin-bottom: 0.375rem;
}
```

#### .form-input

Consistent input field styling.

```css
.form-input {
  width: 100%;
  padding: 0.625rem 1rem;
  border-radius: 0.5rem;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--ui-border);
  color: var(--ui-text);
}
.form-input::placeholder {
  color: var(--ui-text-muted);
}
.form-input:focus {
  ring: 2px var(--ui-ring);
  border-color: transparent;
}
```

**Usage:**

```vue
<label class="form-label" for="itemName">Item Name</label>
<input id="itemName" class="form-input" type="text" />
```

#### .form-error

Error message styling for form validation.

```css
.form-error {
  font-size: 0.875rem;
  color: var(--ui-error);
  margin-top: 0.25rem;
}
```

### Badge Classes

All badge classes extend `.badge-base`:

```css
.badge-base {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}
```

**Standard Badges:**

```vue
<span class="badge-primary">Primary</span>
<!-- Navy -->
<span class="badge-success">Success</span>
<!-- Emerald -->
<span class="badge-warning">Warning</span>
<!-- Amber -->
<span class="badge-error">Error</span>
<!-- Red -->
<span class="badge-info">Info</span>
<!-- Blue -->
```

**Business-Specific Badges:**

**Stock Status:**

```vue
<span class="badge-stock-healthy">Healthy</span>
<span class="badge-stock-low">Low Stock</span>
<span class="badge-stock-critical">Critical</span>
<span class="badge-stock-pending">In Transfer</span>
```

**Approval Workflow:**

```vue
<span class="badge-draft">Draft</span>
<span class="badge-pending">Pending</span>
<span class="badge-approved">Approved</span>
<span class="badge-rejected">Rejected</span>
```

### Interactive Classes

#### .focus-ring

Consistent focus ring for accessibility.

```css
.focus-ring:focus {
  outline: none;
  ring: 2px var(--ui-ring);
  ring-offset: 2px var(--ui-bg-elevated);
}
```

#### .smooth-transition

Standard transition timing for animations.

```css
.smooth-transition {
  transition: all 200ms ease-in-out;
}
```

---

## Typography

### Hierarchy

1. **Display** (`.text-display`) - Page titles, hero sections
2. **Heading** (`.text-heading`) - Main section headings
3. **Subheading** (`.text-subheading`) - Subsection headings
4. **Body** (`.text-body`) - Main content, paragraphs
5. **Label** (`.text-label`) - Form labels, table headers
6. **Caption** (`.text-caption`) - Small text, helper text

### Typography Classes

| Class              | Purpose                     | CSS                                    |
| ------------------ | --------------------------- | -------------------------------------- |
| `.text-display`    | Page titles, hero text      | `4xl`, `bold`, `--ui-text-highlighted` |
| `.text-heading`    | Section headings            | `2xl`, `semibold`, `--ui-text`         |
| `.text-subheading` | Subsection headings         | `lg`, `medium`, `--ui-text`            |
| `.text-body`       | Body paragraphs             | `base`, `--ui-text`                    |
| `.text-label`      | Form labels, small headings | `sm`, `medium`, `--ui-text-muted`      |
| `.text-caption`    | Captions, helper text       | `sm`, `--ui-text-muted`                |

### Font Stack

```css
font-family:
  system-ui,
  -apple-system,
  "Segoe UI",
  Roboto,
  "Helvetica Neue",
  Arial,
  sans-serif;
```

### Help Content Typography

**DESIGN RULE:** All help content pages (Getting Started, Role Guides, Permissions pages) must use consistent font sizes throughout.

| Element                    | Font Size Class              | Usage                                           |
| -------------------------- | ---------------------------- | ----------------------------------------------- |
| **Page Title (h2)**        | `text-2xl font-bold`         | Main page heading (e.g., "Operator Guide")      |
| **Page Subtitle**          | `text-sm`                    | Description under title                         |
| **Section Title (h3)**     | `text-lg font-semibold`      | Collapsible section headings, major sections    |
| **Subsection Title (h4)**  | `font-medium`                | Subsection headings within expanded content     |
| **All Content**            | `text-sm`                    | Paragraphs, lists, table cells, descriptions    |

**Example Structure:**

```vue
<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="pb-4 border-b border-[var(--ui-border)]">
      <h2 class="text-2xl font-bold text-[var(--ui-text-highlighted)]">
        Page Title
      </h2>
      <p class="text-sm text-[var(--ui-text-muted)] mt-1">
        Page subtitle/description
      </p>
    </div>

    <!-- Section -->
    <section>
      <h3 class="text-lg font-semibold text-[var(--ui-text-highlighted)] mb-3">
        Section Title
      </h3>
      <p class="text-sm text-[var(--ui-text-muted)] mb-4">
        Section description paragraph.
      </p>
      <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
        <li>List item content</li>
      </ul>
    </section>
  </div>
</template>
```

**Rules:**

- All paragraphs (`<p>`) must include `text-sm`
- All lists (`<ul>`, `<ol>`) must include `text-sm` on the list element
- Page subtitles must use `text-sm` (not default size)
- Maintain consistency across all help pages (guides, permissions, getting started)

---

## Semantic Design Tokens

**Location:** `app/assets/css/main.css` in `:root` and `.dark` blocks

### Background Tokens

| Token              | Light Mode          | Dark Mode            | Usage                                                  |
| ------------------ | ------------------- | -------------------- | ------------------------------------------------------ |
| `--ui-bg`          | #ffffff (white)     | #0c1220 (navy-dark)  | Page background, main content area                     |
| `--ui-bg-elevated` | #f0f4f8 (blue-gray) | #151c2c (navy-card)  | Nav, sidebar, footer, cards, modals, elevated surfaces |
| `--ui-bg-muted`    | #e8ecf1 (blue-tint) | #1e2738 (navy-muted) | Subtle backgrounds, disabled input fields              |
| `--ui-bg-accented` | navy-50 (#e8f0fc)   | navy-900 (#08162a)   | Highlighted sections, featured areas                   |
| `--ui-bg-inverted` | navy-800 (#0d2240)  | zinc-100 (#f4f4f5)   | Dark surfaces in light mode, light in dark             |

### Text Tokens

| Token                   | Light Mode         | Dark Mode           | Usage                                        |
| ----------------------- | ------------------ | ------------------- | -------------------------------------------- |
| `--ui-text`             | zinc-900 (#18181b) | #eef1f5 (bright)    | Primary body text                            |
| `--ui-text-muted`       | zinc-600 (#52525b) | #a0aec0 (blue-tint) | Secondary text, descriptions, labels         |
| `--ui-text-dimmed`      | zinc-400 (#a1a1aa) | #64748b             | Disabled text, placeholder text              |
| `--ui-text-highlighted` | navy-600 (#173d70) | navy-300 (#6a9be6)  | Important text, headings, emphasized content |
| `--ui-text-inverted`    | white (#ffffff)    | zinc-900 (#18181b)  | Text on inverted backgrounds                 |

### Border Tokens

| Token                  | Light Mode          | Dark Mode           | Usage                             |
| ---------------------- | ------------------- | ------------------- | --------------------------------- |
| `--ui-border`          | #c5cdd8 (blue-gray) | #2d3a4f (blue-tint) | Default borders for cards, inputs |
| `--ui-border-muted`    | #dde3eb             | #232d3f             | Subtle dividers, table borders    |
| `--ui-border-accented` | navy-500 (#1e4d8c)  | navy-400 (#3d7dd9)  | Emphasized borders, focus states  |
| `--ui-border-inverted` | zinc-700 (#3f3f46)  | zinc-300 (#d4d4d8)  | Borders on inverted surfaces      |

**Border Consistency Rule:**
All form fields (inputs, dropdowns, buttons with outline variant) use the same border color as cards via the `--ui-border` CSS variable.

### Interactive State Tokens

| Token                   | Purpose                                     | Usage                                 |
| ----------------------- | ------------------------------------------- | ------------------------------------- |
| `--ui-primary`          | Primary brand color (navy-500 / navy-400)   | Mapped to Nuxt UI `color="primary"`   |
| `--ui-secondary`        | Secondary color (emerald-500 / emerald-400) | Mapped to Nuxt UI `color="secondary"` |
| `--ui-primary-hover`    | Primary hover state (navy-600 / navy-300)   | Custom button hover states            |
| `--ui-primary-active`   | Primary active state (navy-700 / navy-200)  | Custom button pressed states          |
| `--ui-primary-contrast` | Text on primary bg (white / dark bg color)  | Button text color                     |
| `--ui-bg-hover`         | Background hover (#e4eaf1 / #1e2738)        | Hover states for neutral elements     |
| `--ui-bg-active`        | Background active (#d8e0ea / #283347)       | Active states for neutral elements    |
| `--ui-ring`             | Focus ring color (navy-400 / navy-400)      | Focus indicators                      |
| `--ui-focus`            | Focus outline (navy-400 / navy-400)         | Alternative focus styling             |

### Feedback Tokens

| Token          | Light Mode            | Dark Mode             | Usage                               |
| -------------- | --------------------- | --------------------- | ----------------------------------- |
| `--ui-success` | emerald-600 (#1f9a4c) | emerald-400 (#45cf7b) | Success messages, completed actions |
| `--ui-warning` | amber-500 (#f59e0b)   | amber-400 (#fbbf24)   | Warning messages, caution alerts    |
| `--ui-error`   | red-600 (#dc2626)     | red-400 (#f87171)     | Error messages, failed actions      |
| `--ui-info`    | blue-600 (#2563eb)    | blue-400 (#60a5fa)    | Informational messages              |

### Business-Specific Tokens

#### Stock Status

| Token                 | Light Mode  | Dark Mode   | Business Logic                                |
| --------------------- | ----------- | ----------- | --------------------------------------------- |
| `--ui-stock-healthy`  | emerald-600 | emerald-400 | Stock level is normal, ready for use          |
| `--ui-stock-low`      | amber-500   | amber-400   | Stock below minimum threshold, needs reorder  |
| `--ui-stock-critical` | red-600     | red-400     | Out of stock or critically low, urgent action |
| `--ui-stock-pending`  | navy-500    | navy-400    | Stock in transfer between locations           |

#### Approval Workflow States

| Token                  | Light Mode  | Dark Mode   | Business Logic                          |
| ---------------------- | ----------- | ----------- | --------------------------------------- |
| `--ui-status-draft`    | zinc-500    | zinc-400    | Unsaved or draft state                  |
| `--ui-status-pending`  | navy-500    | navy-400    | Awaiting supervisor/admin approval      |
| `--ui-status-approved` | emerald-600 | emerald-400 | Approved by supervisor/admin, completed |
| `--ui-status-rejected` | red-600     | red-400     | Rejected by supervisor/admin, failed    |

#### Period States

| Token                | Light Mode  | Dark Mode   | Business Logic                                         |
| -------------------- | ----------- | ----------- | ------------------------------------------------------ |
| `--ui-period-open`   | emerald-600 | emerald-400 | Period is open, accepting transactions                 |
| `--ui-period-ready`  | navy-500    | navy-400    | Location ready for period close, awaiting coordination |
| `--ui-period-closed` | zinc-500    | zinc-400    | Period locked, no modifications allowed                |

#### Price Variance

| Token                    | Value                 | Usage                                              |
| ------------------------ | --------------------- | -------------------------------------------------- |
| `--ui-variance-detected` | amber-500 / amber-400 | Price on delivery differs from locked period price |

---

## Icons

### General Rules

- **NO backgrounds** on icons (remove `bg-*` classes)
- **NO borders** on icons (remove `border`, `ring-*` wrapper classes)
- **NO rounded containers** around icons
- Icons should be displayed directly with just color classes

### Page Header Icons

```vue
<UIcon name="i-lucide-map-pin" class="w-8 h-8 sm:w-12 sm:h-12 text-primary" />
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

## Buttons

### Primary Action Button

```vue
<UButton color="primary" icon="i-lucide-plus" size="lg" class="cursor-pointer rounded-full px-6">
  Action Text
</UButton>
```

### Outline/Secondary Button

```vue
<UButton color="neutral" variant="outline" size="lg" class="cursor-pointer rounded-full px-5">
  Button Text
</UButton>
```

### Success Button

```vue
<UButton color="success" class="cursor-pointer">Approve</UButton>
```

### Cancel/Destructive Action Button

**DESIGN RULE:** Cancel buttons and other destructive actions should use error/warning color styling to visually indicate caution and prevent accidental clicks.

```vue
<!-- Recommended: Soft error styling for cancel -->
<UButton color="error" variant="soft" size="lg" class="cursor-pointer" @click="handleCancel">
  Cancel
</UButton>

<!-- Alternative: Outline variant for less aggressive look -->
<UButton color="error" variant="outline" size="lg" class="cursor-pointer" @click="handleCancel">
  Cancel
</UButton>

<!-- For truly destructive actions (delete, remove) -->
<UButton color="error" size="lg" class="cursor-pointer" @click="handleDelete">
  Delete Location
</UButton>
```

**Rationale:**

- Red/error color draws attention to potentially destructive actions
- Helps prevent accidental cancellations or deletions
- Clear visual distinction from primary action buttons
- `variant="soft"` provides warning without being too aggressive
- `variant="outline"` offers a lighter alternative

### Rules

- **Always include `cursor-pointer` class**
- Use `rounded-full` for pill-shaped buttons
- Add horizontal padding (`px-5` or `px-6`) for better proportions
- Use semantic color names: `color="primary"`, `color="secondary"`, `color="success"`, `color="error"`
- **Never use custom color names** like `color="navy"` (won't work)
- **Cancel buttons:** Use `color="error"` with `variant="soft"` or `variant="outline"`
- **Delete buttons:** Use `color="error"` (solid variant) for maximum visual weight

### Responsive Action Buttons (Card Actions Pattern)

**DESIGN RULE:** Action buttons at the bottom of cards (e.g., user cards, item cards) must adapt to screen size to prevent truncation and ensure all buttons are visible.

**Pattern:** Use flex-wrap with responsive text visibility to show:

- **Small/Medium screens (< 1024px):** Icons only, buttons can wrap to two rows if needed
- **Large screens (≥ 1024px):** Icons + text labels
- **Extra-large screens (≥ 1280px):** Full layout with spacer between button groups

**Implementation:**

```vue
<!-- Action Buttons Container -->
<div class="flex flex-wrap items-center gap-2 pt-4 border-t border-[var(--ui-border)]">
  <!-- Delete Button (Destructive action - typically on left) -->
  <UButton
    color="error"
    variant="ghost"
    size="sm"
    icon="i-lucide-trash-2"
    class="cursor-pointer"
    @click.stop="handleDelete"
  >
    <span class="hidden lg:inline">Delete</span>
  </UButton>

  <!-- Spacer - only visible on extra-large screens -->
  <div class="hidden xl:flex flex-1" />

  <!-- Status Toggle Button -->
  <UButton
    color="warning"
    variant="ghost"
    size="sm"
    icon="i-lucide-user-x"
    class="cursor-pointer"
    @click.stop="handleToggle"
  >
    <span class="hidden lg:inline">Deactivate</span>
  </UButton>

  <!-- View Button -->
  <UButton
    color="neutral"
    variant="ghost"
    size="sm"
    icon="i-lucide-eye"
    class="cursor-pointer"
    @click.stop="handleView"
  >
    <span class="hidden lg:inline">View</span>
  </UButton>

  <!-- Edit Button -->
  <UButton
    color="primary"
    variant="ghost"
    size="sm"
    icon="i-lucide-edit"
    class="cursor-pointer"
    @click.stop="handleEdit"
  >
    <span class="hidden lg:inline">Edit</span>
  </UButton>
</div>
```

**Key Features:**

1. **`flex-wrap`**: Allows buttons to wrap to multiple rows when space is limited
2. **Responsive text visibility**: `hidden lg:inline` hides text labels below 1024px
3. **Conditional spacer**: `hidden xl:flex flex-1` provides spacing only on xl+ screens
4. **Consistent sizing**: All buttons use `size="sm"` for compact appearance
5. **Icon-only on mobile**: Ensures buttons fit without truncation on smaller screens

**Rules:**

- Use `flex-wrap` instead of nested flex containers
- Text labels: `<span class="hidden lg:inline">Button Text</span>`
- Spacer: `<div class="hidden xl:flex flex-1" />` (only for xl+ screens)
- Buttons must have icons that are recognizable without text
- Use standard icon conventions (trash for delete, eye for view, edit/pencil for edit)
- Apply `@click.stop` to prevent parent click handlers (e.g., card click)

**When to Use:**

- User management cards
- Item cards with multiple actions
- Any card with 3+ action buttons
- Dashboard cards with action buttons
- List view items with inline actions

**Benefits:**

- Prevents button truncation at medium screen sizes
- Maintains icon-only usability on mobile
- Provides full labels on larger screens for clarity
- Natural wrapping behavior when needed
- Consistent pattern across the application

---

## Cards

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

## Dropdown Menus

### Status Filter Pattern (All / Active / Inactive)

**DESIGN RULE:** Status filters should include three options: "All", "Active", and "Inactive" to give users full control over filtering.

**Implementation:**

```typescript
// Status dropdown items with "All" option
const statusDropdownItems = computed(() => [
  [
    {
      label: "All",
      icon: "i-lucide-list",
      active: filters.is_active === null,
      onSelect: () => selectStatus(null),
    },
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

// Current status label for dropdown button
const currentStatusLabel = computed(() => {
  if (filters.is_active === true) return "Active";
  if (filters.is_active === false) return "Inactive";
  return "All";
});

// Current status icon for dropdown button
const currentStatusIcon = computed(() => {
  if (filters.is_active === true) return "i-lucide-circle-check";
  if (filters.is_active === false) return "i-lucide-archive";
  return "i-lucide-list";
});

// Select status handler
const selectStatus = (statusValue: boolean | null) => {
  filters.is_active = statusValue;
  filters.include_inactive = statusValue === null ? true : !statusValue;
  fetchData();
};
```

**Standard Icons for Status Options:**

| Option       | Icon                    | Meaning                           |
| ------------ | ----------------------- | --------------------------------- |
| **All**      | `i-lucide-list`         | Show all items (no filter)        |
| **Active**   | `i-lucide-circle-check` | Show only active items            |
| **Inactive** | `i-lucide-archive`      | Show only inactive/archived items |

### Rules

- Use `onSelect` (not `click`) for dropdown item handlers
- Each option should have its own descriptive icon
- Use `active` property to highlight the selected item
- Dropdown button icon should change based on current selection
- **Always include "All" option** to allow users to view unfiltered data
- Use `null` value for "All" option to indicate no filter applied

---

## Empty State

### Structure

```vue
<EmptyState icon="i-lucide-{icon-name}" title="No items found" description="Description text here.">
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

## Accessibility Standards

### Color Contrast

All text/background token combinations meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text):

✅ `--ui-text` on `--ui-bg` = High contrast in both modes
✅ `--ui-text-muted` on `--ui-bg` = 7:1+ contrast
✅ White on `--ui-primary` (#1e4d8c) = 8.5:1
✅ White on `--ui-stock-healthy` = 4.6:1

**Rules:**

- Maintain sufficient contrast ratios (WCAG AA minimum)
- Support both light and dark modes
- Use color AND text/icons (don't rely on color alone)

### Focus States

- All interactive elements must use `--ui-ring` for focus indication
- Minimum 2px ring width
- Use `.focus-ring` utility class for consistency
- Navy borders for focus states (`focus:border-navy-400`)

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  .smooth-transition,
  .hover-lift,
  .fade-in {
    transition: none;
    animation: none;
  }
}
```

### Screen Reader Support

- Use `.sr-only` class for visually hidden but screen-reader-accessible text
- Include `aria-label` on status badges
- Use semantic HTML (`<button>`, `<nav>`, `<main>`)

### Keyboard Navigation

- Clear labels; no jargon (Food, Clean, Delivery, Issue)
- Keyboard friendly (tab between fields)
- Error messages in plain words (e.g., "Qty exceeds on-hand")

---

## Tailwind CSS v4 Constraints

### @apply Limitation

**IMPORTANT:** Tailwind CSS v4 does NOT allow using `@apply` with custom class names. You can ONLY use `@apply` with built-in Tailwind utilities.

**❌ WRONG - Will cause build error:**

```css
.badge-base {
  @apply inline-flex items-center px-2.5 py-0.5 rounded-full;
}

.badge-primary {
  @apply badge-base; /* ERROR: Cannot apply unknown utility class */
  background-color: var(--ui-primary);
}
```

**✅ CORRECT - Use direct CSS properties:**

```css
.badge-primary {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  line-height: 1rem;
  font-weight: 500;
  background-color: var(--ui-primary);
  color: var(--ui-primary-contrast);
}
```

**✅ ALSO CORRECT - @apply with built-in utilities only:**

```css
.card-elevated {
  @apply bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)];
  @apply rounded-lg shadow-sm;
  @apply transition-shadow duration-200;
}
```

### @utility Directive Limitation

**IMPORTANT:** Tailwind CSS v4's `@utility` directive requires utility names to be **alphanumeric only** (starting with a lowercase letter). It does NOT support pseudo-elements or pseudo-classes in the utility name itself.

**❌ WRONG - Will cause build error:**

```css
@utility placeholder-muted::placeholder {
  color: var(--ui-text-muted);
}

@utility hover-primary:hover {
  color: var(--ui-primary);
}
```

**✅ CORRECT - Use regular CSS classes for pseudo-elements/classes:**

```css
.placeholder-muted::placeholder {
  color: var(--ui-text-muted);
}

.hover-primary:hover {
  color: var(--ui-primary);
}
```

**When to use `@utility`:**

- Simple utilities without pseudo-elements/classes
- Utilities that need to be applied via Tailwind's utility system
- Single property utilities like `@utility bg-elevated { background-color: var(--ui-bg-elevated); }`

**When to use regular CSS classes:**

- Pseudo-elements (::placeholder, ::before, ::after)
- Pseudo-classes (:hover, :focus, :active)
- Complex multi-property patterns
- Business-specific badge and card classes

---

## PWA Design Considerations

### Progressive Web App Features

**Level 1 PWA (MVP):**

- ✅ Installable (Add to Home Screen)
- ✅ Offline UI with clear messaging
- ✅ Cached static assets (CSS, JS, images)
- ✅ App-like experience (full-screen, no browser chrome)
- ✅ Custom splash screen
- ✅ Auto-update on new deployment

**Offline Behavior:**

- **Works Offline:** View cached pages, previously loaded data, interface navigation
- **Requires Connection:** Post deliveries/issues, fetch fresh data, period close
- **User Experience:** Clear "You're offline" banner, disabled buttons with tooltips, green "Back online" notification

**Design Implications:**

- Use `useOnlineStatus()` composable to detect offline state
- Disable action buttons when offline: `<UButton :disabled="!isOnline">`
- Show clear offline indicators in UI
- Provide graceful error messages for offline operations

---

## Async Operations & Loading States

### Full-Page Loading Overlay (Critical UX Rule)

**DESIGN RULE:** When performing save, post, or other critical async operations, the entire UI must be blocked with a full-page loading overlay to prevent user interaction.

**Problem this solves:**

- Button shows loading state, but rest of page remains interactive
- Users can click around, edit fields, or navigate away during API calls
- Leads to confusion, accidental actions, and potential data inconsistency

**Required behavior:**

- Full viewport coverage blocks all interaction
- Semi-transparent backdrop with blur effect
- Clear loading message indicating what's happening
- Prevents clicks, keyboard input, and navigation

### LoadingOverlay Component

The `LoadingOverlay` component (at `app/components/LoadingOverlay.vue`) provides:

- **Full viewport coverage** with `fixed inset-0 z-50`
- **Semi-transparent backdrop** (`bg-black/50 backdrop-blur-sm`)
- **Centered loading card** with spinner and message
- **Event blocking** - prevents all clicks and interactions
- **Accessible** - proper ARIA labels and semantic structure

### Implementation Pattern

**Basic Usage:**

```vue
<template>
  <div>
    <!-- Loading Overlay for Save Operations -->
    <LoadingOverlay
      v-if="saving"
      title="Saving..."
      message="Please wait while we save your changes"
    />

    <!-- Loading Overlay for Post Operations -->
    <LoadingOverlay
      v-if="posting"
      title="Posting..."
      message="Please wait while we process your request"
    />

    <!-- Page Content -->
    <div class="px-0 py-0 md:px-4 md:py-1 space-y-3">
      <!-- ... -->
    </div>
  </div>
</template>
```

**With Progress Steps (for multi-step operations):**

```vue
<LoadingOverlay
  v-if="processing"
  title="Processing..."
  :current-step="2"
  :total-steps="5"
  step-description="Validating data..."
/>
```

### When to Use Full-Page Loading Overlay

**Always use for:**

- Saving draft documents (deliveries, issues, transfers)
- Posting/submitting transactions
- Approval actions (approve, reject)
- Period close operations
- Any operation that modifies data and should prevent concurrent edits

**Do NOT use for:**

- Initial page data loading (use skeleton loaders or inline spinners)
- Background refreshes that don't require user attention
- Quick operations that complete in < 500ms

### Common Loading State Variables

Use descriptive boolean state variables tied to specific operations:

```typescript
const savingDraft = ref(false); // For draft save operations
const saving = ref(false); // For update/save operations
const posting = ref(false); // For post/submit operations
const approving = ref(false); // For approval actions
const deleting = ref(false); // For delete operations
```

### Loading Messages by Operation Type

| Operation        | Title                 | Message                                            |
| ---------------- | --------------------- | -------------------------------------------------- |
| **Save Draft**   | "Saving Draft..."     | "Please wait while we save your delivery draft"    |
| **Save**         | "Saving Changes..."   | "Please wait while we save your changes"           |
| **Post**         | "Posting Delivery..." | "Please wait while we process your delivery"       |
| **Approve**      | "Approving..."        | "Please wait while we process your approval"       |
| **Reject**       | "Rejecting..."        | "Please wait while we process your rejection"      |
| **Delete**       | "Deleting..."         | "Please wait while we remove the item"             |
| **Period Close** | "Closing Period..."   | "Please wait while we close the accounting period" |

### Implementation Checklist

When adding async operations to a page:

- [ ] Add appropriate loading state variable (`saving`, `posting`, etc.)
- [ ] Set loading state to `true` before API call
- [ ] Set loading state to `false` in both success and error handlers (use `finally`)
- [ ] Add `<LoadingOverlay>` component with `v-if` bound to loading state
- [ ] Use descriptive title and message for the operation
- [ ] Test that UI is properly blocked during operation
- [ ] Test that overlay dismisses on both success and error

---

## Code Formatting Standards

**CRITICAL:** All code must follow the project's Prettier configuration to ensure consistency with VS Code's format-on-save.

### Formatting Rules

- **Semicolons:** Always use semicolons (`;`)
- **Quotes:** Use double quotes (`"`) not single quotes
- **Indentation:** 2 spaces (never tabs)
- **Line Width:** 100 characters maximum
- **Arrow Functions:** Always use parentheses around parameters: `(x) => x` not `x => x`
- **Trailing Commas:** ES5 style (objects/arrays only, not function parameters)
- **Vue Files:** Do not indent `<script>` and `<style>` blocks

### Component Naming Conventions

**Nuxt 4 Component Auto-Import:** Components in subdirectories combine folder path + filename.

- `app/components/layout/AppNavbar.vue` → `<LayoutAppNavbar />`
- `app/components/delivery/LineItem.vue` → `<DeliveryLineItem />`
- Nested: `app/components/ui/form/Input.vue` → `<UiFormInput />`
- Root `/app/components/` needs no prefix: `Footer.vue` → `<Footer />`

---

## Usage Guidelines & Best Practices

### Do's ✅

- **Use semantic tokens** for custom components: `bg-[var(--ui-bg-elevated)]`
- **Use utility classes** when available: `.badge-stock-healthy`
- **Use semantic colors** in Nuxt UI components: `<UButton color="primary">`
- **Support both themes**: Test in light and dark mode
- **Use business tokens** for domain concepts: `--ui-stock-low`, not `--color-amber-500`
- **Always use Tailwind color tokens** (e.g., `text-navy-500`)
- **Always include dark mode variants** (e.g., `dark:text-navy-400`)
- **Always include `cursor-pointer`** on buttons
- **Show totals and clear buttons** ("Post delivery", "Post Issue")
- **Prevent mistakes**: Block negative stock; confirm on close
- **Keep forms short**: Remember last choices where helpful

### Don'ts ❌

- **Never use inline styles** with hex colors: `style="color: #000046"`
- **Never use custom color names** in Nuxt UI props: `color="navy"` (won't work)
- **Never hardcode colors** that should adapt to theme
- **Never add hover effects to cards** - cards should remain static
- **Never add backgrounds/borders to icons** - display icons directly
- **Never mix systems**: Pick semantic tokens OR Tailwind classes, be consistent within a component
- **Never use @apply with custom classes**: Tailwind CSS v4 only allows `@apply` with built-in utilities
- **Never use @utility with pseudo-elements**: `@utility` directive requires alphanumeric names only
- **Don't configure colors in app.config.ts** (has no effect with Tailwind v4 `@theme`)

### When to Use What

**Semantic Tokens (`var(--ui-*)`):**

- Custom components not using Nuxt UI
- Business logic-driven colors (stock status, approvals)
- Backgrounds, text, borders that need to adapt to dark mode

**Tailwind Color Classes (`text-navy-500`):**

- Quick prototyping
- One-off designs
- When you need a specific shade

**Nuxt UI Semantic Colors (`color="primary"`):**

- All Nuxt UI components (UButton, UAlert, UBadge, etc.)
- Standard feedback colors (success, warning, error)

**Utility Classes (`.badge-stock-healthy`):**

- Common patterns used multiple times
- Consistency across the app
- Business-specific UI elements

---

## Common Patterns & Examples

### Complete Form Example

```vue
<template>
  <div class="card-elevated p-6 max-w-2xl">
    <h2 class="text-heading mb-6">Post Delivery</h2>

    <form @submit.prevent="submitDelivery" class="space-y-4">
      <!-- Supplier -->
      <div>
        <label class="form-label" for="supplier">Supplier</label>
        <select id="supplier" class="form-input" v-model="form.supplier">
          <option value="">Select supplier</option>
          <option v-for="s in suppliers" :key="s.id" :value="s.id">
            {{ s.name }}
          </option>
        </select>
        <span class="form-error" v-if="errors.supplier">
          {{ errors.supplier }}
        </span>
      </div>

      <!-- Invoice Number -->
      <div>
        <label class="form-label" for="invoiceNo">Invoice Number</label>
        <input
          id="invoiceNo"
          type="text"
          class="form-input"
          v-model="form.invoiceNo"
          placeholder="INV-2024-001"
        />
      </div>

      <!-- Actions -->
      <div class="flex gap-3 pt-4">
        <UButton color="primary" type="submit" :loading="loading" class="cursor-pointer">
          Post Delivery
        </UButton>
        <UButton color="neutral" variant="outline" @click="cancel" class="cursor-pointer">
          Cancel
        </UButton>
      </div>
    </form>
  </div>
</template>
```

### Dashboard Metric Cards

```vue
<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <!-- Total Receipts -->
    <div class="card-elevated p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-label">Total Receipts</p>
          <p class="text-3xl font-bold text-[var(--ui-text)]">
            SAR {{ totalReceipts.toLocaleString() }}
          </p>
        </div>
        <UIcon name="i-lucide-package" class="w-10 h-10 text-emerald-600" />
      </div>
    </div>

    <!-- Total Issues -->
    <div class="card-elevated p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-label">Total Issues</p>
          <p class="text-3xl font-bold text-[var(--ui-text)]">
            SAR {{ totalIssues.toLocaleString() }}
          </p>
        </div>
        <UIcon name="i-lucide-send" class="w-10 h-10 text-navy-600" />
      </div>
    </div>

    <!-- Days Left -->
    <div class="card-elevated p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-label">Days Left in Period</p>
          <p class="text-3xl font-bold text-[var(--ui-text)]">
            {{ daysLeft }}
          </p>
        </div>
        <UIcon name="i-lucide-calendar" class="w-10 h-10 text-amber-600" />
      </div>
    </div>
  </div>
</template>
```

### Stock Item Card

```vue
<div class="card-elevated p-4">
  <div class="flex items-start justify-between mb-3">
    <div>
      <h4 class="text-[var(--ui-text-highlighted)] font-semibold">
        {{ item.name }}
      </h4>
      <p class="text-caption">{{ item.code }} | {{ item.unit }}</p>
    </div>
    <span :class="getStockBadgeClass(item.onHand, item.minThreshold)">
      {{ getStockStatusText(item.onHand, item.minThreshold) }}
    </span>
  </div>
  <div class="grid grid-cols-2 gap-4 p-3 bg-[var(--ui-bg-muted)] rounded-lg">
    <div>
      <p class="text-label">On Hand</p>
      <p class="text-[var(--ui-text)] font-bold">{{ item.onHand }} {{ item.unit }}</p>
    </div>
    <div>
      <p class="text-label">WAC</p>
      <p class="text-[var(--ui-text)] font-bold">SAR {{ item.wac.toFixed(2) }}</p>
    </div>
  </div>
</div>
```

### Data Table Pattern

```vue
<div class="card-elevated">
  <table class="w-full">
    <thead class="bg-[var(--ui-bg-muted)] border-b border-[var(--ui-border)]">
      <tr>
        <th class="px-4 py-3 text-left text-label">Item Code</th>
        <th class="px-4 py-3 text-left text-label">Item Name</th>
        <th class="px-4 py-3 text-right text-label">On Hand</th>
        <th class="px-4 py-3 text-left text-label">Status</th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="item in items"
        :key="item.id"
        class="border-b border-[var(--ui-border-muted)] hover:bg-[var(--ui-bg-hover)] smooth-transition"
      >
        <td class="px-4 py-3 text-[var(--ui-text)]">{{ item.code }}</td>
        <td class="px-4 py-3 text-[var(--ui-text)]">{{ item.name }}</td>
        <td class="px-4 py-3 text-right text-[var(--ui-text)]">{{ item.onHand }}</td>
        <td class="px-4 py-3">
          <span :class="getStockBadgeClass(item.onHand, item.minThreshold)">
            {{ getStockStatusText(item.onHand, item.minThreshold) }}
          </span>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## Component Checklist

When creating a new page, ensure:

### General

- [ ] Page container uses `px-0 py-0 md:px-4 md:py-1 space-y-3`
- [ ] All icons have NO backgrounds or borders
- [ ] Cards use `card-elevated` class without hover effects
- [ ] All buttons have `cursor-pointer` class
- [ ] Rounded buttons use `rounded-full` with appropriate padding
- [ ] Dropdown menus use `onSelect` handler

### Async Operations

- [ ] All save/post operations use `<LoadingOverlay>` to block UI
- [ ] Loading state variables are descriptive (`savingDraft`, `posting`, etc.)
- [ ] Loading overlay has appropriate title and message
- [ ] Loading state resets in both success and error handlers

### Form Layout

- [ ] Form fields use responsive grid: `grid grid-cols-1 lg:grid-cols-2 gap-6`
- [ ] All inputs have `class="w-full"` to fill their container
- [ ] Textareas and special fields use `lg:col-span-2` for full width
- [ ] Form sections properly grouped within cards
- [ ] Consistent gap spacing (`gap-6`) between fields

### Page Header (Responsive)

- [ ] Icon uses responsive size: `w-6 h-6 sm:w-10 sm:h-10 text-primary`
- [ ] Title uses responsive size: `text-xl sm:text-3xl font-bold text-primary`
- [ ] Description uses `hidden sm:block` to hide on mobile screens
- [ ] Action button has responsive padding: `px-3 sm:px-6`
- [ ] Button text switches between short/full: `<span class="hidden sm:inline">` pattern

### Filter Section (Responsive)

- [ ] Uses dual layout pattern: `hidden lg:flex` for desktop, `lg:hidden` for mobile
- [ ] Desktop: Single row with dropdown at far right (`ml-auto`)
- [ ] **Mobile: Toggle buttons HIDDEN** - only search + status dropdown visible
- [ ] Mobile dropdown shows icon only (no label)
- [ ] Toggle buttons use unified `bg-primary` when selected

### Action Buttons (Card Actions Pattern)

- [ ] Uses `flex-wrap` to allow button wrapping
- [ ] Button text uses `hidden lg:inline` for responsive visibility
- [ ] Spacer uses `hidden xl:flex flex-1` (only visible on xl+ screens)
- [ ] All buttons have recognizable icons
- [ ] Click handlers use `@click.stop` to prevent parent click propagation
- [ ] Buttons use `size="sm"` for compact appearance

### Visual Testing

- [ ] All pages work in light mode
- [ ] All pages work in dark mode
- [ ] Theme toggle works smoothly
- [ ] Stock status badges display correct colors
- [ ] Approval badges display correct colors
- [ ] Forms use `.form-input` and `.form-label`
- [ ] Cards use `.card-elevated` or `.card-muted`
- [ ] No inline hex colors in templates
- [ ] No direct color class usage on business elements (use tokens)
- [ ] No `@utility` directives with pseudo-elements in CSS files
- [ ] Focus states are visible on all interactive elements
- [ ] Screen reader testing passes
- [ ] Color contrast passes WCAG AA

---

## Summary of Key Design Rules

| Rule                            | Specification                                                                     |
| ------------------------------- | --------------------------------------------------------------------------------- |
| **Page Container**              | `px-0 py-0 md:px-4 md:py-1 space-y-3`                                             |
| **Layout Body**                 | `py-2 px-0 sm:px-12 xl:py-4 xl:px-16 max-w-[1920px] mx-auto w-full` (default.vue) |
| **Max Content Width**           | `1920px` (centered on ultra-wide, stable sidebar width prevents shifts)           |
| **Page Content Width**          | Full width by default (no max-width), sections as direct children                 |
| **Section Spacing**             | `space-y-3` (automatic via container)                                             |
| **Page Header Icon**            | `w-6 h-6 sm:w-10 sm:h-10 text-primary` (NO background)                            |
| **Page Title**                  | `text-xl sm:text-3xl font-bold text-primary`                                      |
| **Page Description**            | `hidden sm:block` (hidden on mobile, visible on sm+)                              |
| **Cards**                       | `card-elevated` (NO hover effects)                                                |
| **Buttons - Primary**           | `color="primary"`, include `cursor-pointer`, use `rounded-full px-6`              |
| **Buttons - Cancel**            | `color="error" variant="soft"` or `variant="outline"`, include `cursor-pointer`   |
| **Buttons - Card Actions**      | `flex flex-wrap`, text `hidden lg:inline`, spacer `hidden xl:flex flex-1`         |
| **Icons**                       | NO backgrounds, NO borders, NO rounded containers                                 |
| **Filter Layout**               | Dual layout: desktop full filters, mobile search + dropdown only (no toggles)     |
| **Dropdown Handler**            | Use `onSelect` (not `click`)                                                      |
| **Form Layout - Standard**      | `grid grid-cols-1 lg:grid-cols-2 gap-6`, all inputs `w-full`                      |
| **Form Layout - Single Column** | `space-y-6`, fields use `w-full lg:w-1/2`                                         |
| **Async Operations**            | Use `<LoadingOverlay>` for all save/post operations to block entire UI            |

---

**Single Source of Truth for Design:** `app/assets/css/main.css`

**For questions or updates to this guide, consult the team lead or update this document directly.**
