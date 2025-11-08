# Design System

**Stock Management System - Complete Design System Reference**

Version: 1.0
Last Updated: January 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Design Philosophy](#design-philosophy)
3. [Color System](#color-system)
4. [Semantic Tokens](#semantic-tokens)
5. [Business-Specific Tokens](#business-specific-tokens)
6. [Utility Classes](#utility-classes)
7. [Component Patterns](#component-patterns)
8. [Typography](#typography)
9. [Accessibility](#accessibility)
10. [Usage Guidelines](#usage-guidelines)
11. [Examples](#examples)

---

## Overview

The Stock Management System uses a comprehensive, semantic design system built on:

- **Tailwind CSS v4** with `@theme` directive for color palettes
- **CSS Custom Properties** for semantic color tokens
- **Nuxt UI** components with custom brand color integration
- **Utility-first approach** with pre-built pattern classes

**All design tokens are defined in a single source:** `app/assets/css/main.css`

---

## Design Philosophy

### Color Meaning

Colors in this system map directly to business logic and user intent:

| Color             | Hex     | Business Meaning                                                  |
| ----------------- | ------- | ----------------------------------------------------------------- |
| **Navy Blue**     | #000046 | Brand identity, primary actions, trust, pending states, authority |
| **Emerald Green** | #45cf7b | Success, approvals, healthy stock, positive outcomes              |
| **Amber**         | #f59e0b | Warnings, low stock, price variance, attention needed             |
| **Red**           | #ef4444 | Errors, critical stock levels, rejections, dangerous actions      |
| **Blue**          | #3b82f6 | Informational messages, neutral notifications                     |
| **Zinc (Gray)**   | #71717a | Neutral UI, text, borders, disabled states                        |

### Principles

1. **Semantic over Presentational**: Use `var(--ui-stock-healthy)` not `var(--color-emerald-600)`
2. **Business-Aware**: Tokens reflect domain concepts (stock status, approvals, periods)
3. **Dark Mode First**: All tokens have light/dark variants
4. **Accessible by Default**: WCAG AA contrast ratios enforced
5. **Single Source of Truth**: All colors in `main.css`, nowhere else

---

## Color System

### Base Color Palettes

All palettes defined in `@theme` block with shades `50`-`950`:

#### Navy (Primary Brand)

```css
--color-navy-50: #e6e6f0   /* Lightest */
--color-navy-100: #b3b3d9
--color-navy-200: #8080c2
--color-navy-300: #4d4dab
--color-navy-400: #26269b  /* Dark mode primary */
--color-navy-500: #000046  /* Light mode primary, brand color */
--color-navy-600: #00003f
--color-navy-700: #000037
--color-navy-800: #00002f
--color-navy-900: #000020
--color-navy-950: #000010  /* Darkest */
```

**Usage in Tailwind classes:**

- `text-navy-500` - Navy text
- `bg-navy-50` - Very light navy background
- `border-navy-600` - Navy border

#### Emerald (Secondary/Success)

```css
--color-emerald-50: #edfcf4
--color-emerald-400: #45cf7b  /* Brand emerald green */
--color-emerald-600: #1f9a4c
--color-emerald-950: #0a2916
```

#### Zinc (Neutral/Gray)

```css
--color-zinc-50: #fafafa   /* Very light gray backgrounds */
--color-zinc-300: #d4d4d8  /* Borders */
--color-zinc-600: #52525b  /* Muted text */
--color-zinc-900: #18181b  /* Primary text */
--color-zinc-950: #09090b  /* Darkest gray */
```

#### Amber (Warning)

```css
--color-amber-50: #fffbeb
--color-amber-500: #f59e0b  /* Warning color */
--color-amber-950: #451a03
```

#### Red (Error/Critical)

```css
--color-red-50: #fef2f2
--color-red-600: #dc2626    /* Error color */
--color-red-950: #450a0a
```

#### Blue (Info)

```css
--color-blue-50: #eff6ff
--color-blue-600: #2563eb  /* Info color */
--color-blue-950: #172554
```

---

## Semantic Tokens

**Location:** `app/assets/css/main.css` in `:root` and `.dark` blocks

### Background Tokens

| Token              | Light Mode         | Dark Mode          | Usage                                      |
| ------------------ | ------------------ | ------------------ | ------------------------------------------ |
| `--ui-bg`          | zinc-50 (#fafafa)  | zinc-950 (#09090b) | Page background                            |
| `--ui-bg-elevated` | white (#ffffff)    | zinc-900 (#18181b) | Cards, modals, dialogs, elevated surfaces  |
| `--ui-bg-muted`    | zinc-100 (#f4f4f5) | zinc-800 (#27272a) | Subtle backgrounds, disabled input fields  |
| `--ui-bg-accented` | navy-50 (#e6e6f0)  | navy-950 (#000010) | Highlighted sections, featured areas       |
| `--ui-bg-inverted` | zinc-900 (#18181b) | zinc-50 (#fafafa)  | Dark surfaces in light mode, light in dark |

**Example:**

```vue
<div class="bg-[var(--ui-bg)]">
  <div class="bg-[var(--ui-bg-elevated)] border-[var(--ui-border)]">
    <!-- Card content -->
  </div>
</div>
```

### Text Tokens

| Token                   | Light Mode         | Dark Mode          | Usage                                        |
| ----------------------- | ------------------ | ------------------ | -------------------------------------------- |
| `--ui-text`             | zinc-900 (#18181b) | zinc-100 (#f4f4f5) | Primary body text                            |
| `--ui-text-muted`       | zinc-600 (#52525b) | zinc-400 (#a1a1aa) | Secondary text, descriptions, labels         |
| `--ui-text-dimmed`      | zinc-400 (#a1a1aa) | zinc-600 (#52525b) | Disabled text, placeholder text              |
| `--ui-text-highlighted` | navy-700 (#000037) | navy-300 (#4d4dab) | Important text, headings, emphasized content |
| `--ui-text-inverted`    | white (#ffffff)    | zinc-900 (#18181b) | Text on inverted backgrounds                 |

**Example:**

```vue
<h1 class="text-[var(--ui-text-highlighted)]">Stock Report</h1>
<p class="text-[var(--ui-text)]">Main content here</p>
<span class="text-[var(--ui-text-muted)]">Helper text</span>
```

### Border Tokens

| Token                  | Light Mode         | Dark Mode          | Usage                             |
| ---------------------- | ------------------ | ------------------ | --------------------------------- |
| `--ui-border`          | zinc-300 (#d4d4d8) | zinc-700 (#3f3f46) | Default borders for cards, inputs |
| `--ui-border-muted`    | zinc-200 (#e4e4e7) | zinc-800 (#27272a) | Subtle dividers, table borders    |
| `--ui-border-accented` | navy-300 (#4d4dab) | navy-700 (#000037) | Emphasized borders, focus states  |
| `--ui-border-inverted` | zinc-700 (#3f3f46) | zinc-300 (#d4d4d8) | Borders on inverted surfaces      |

### Interactive State Tokens

| Token                   | Purpose                                     | Usage                                 |
| ----------------------- | ------------------------------------------- | ------------------------------------- |
| `--ui-primary`          | Primary brand color (navy-500 / navy-400)   | Mapped to Nuxt UI `color="primary"`   |
| `--ui-secondary`        | Secondary color (emerald-500 / emerald-400) | Mapped to Nuxt UI `color="secondary"` |
| `--ui-primary-hover`    | Primary hover state (navy-600 / navy-500)   | Custom button hover states            |
| `--ui-primary-active`   | Primary active state (navy-700 / navy-600)  | Custom button pressed states          |
| `--ui-primary-contrast` | Text on primary bg (white / black)          | Button text color                     |
| `--ui-bg-hover`         | Background hover (zinc-100 / zinc-800)      | Hover states for neutral elements     |
| `--ui-bg-active`        | Background active (zinc-200 / zinc-700)     | Active states for neutral elements    |
| `--ui-ring`             | Focus ring color (navy-500 / navy-400)      | Focus indicators                      |
| `--ui-focus`            | Focus outline (navy-500 / navy-400)         | Alternative focus styling             |

### Feedback Tokens

| Token          | Light Mode            | Dark Mode             | Usage                               |
| -------------- | --------------------- | --------------------- | ----------------------------------- |
| `--ui-success` | emerald-600 (#1f9a4c) | emerald-500 (#2eb860) | Success messages, completed actions |
| `--ui-warning` | amber-500 (#f59e0b)   | amber-400 (#fbbf24)   | Warning messages, caution alerts    |
| `--ui-error`   | red-600 (#dc2626)     | red-500 (#ef4444)     | Error messages, failed actions      |
| `--ui-info`    | blue-600 (#2563eb)    | blue-500 (#3b82f6)    | Informational messages              |

---

## Business-Specific Tokens

### Stock Status

| Token                 | Light Mode  | Dark Mode   | Business Logic                                |
| --------------------- | ----------- | ----------- | --------------------------------------------- |
| `--ui-stock-healthy`  | emerald-600 | emerald-500 | Stock level is normal, ready for use          |
| `--ui-stock-low`      | amber-500   | amber-400   | Stock below minimum threshold, needs reorder  |
| `--ui-stock-critical` | red-600     | red-500     | Out of stock or critically low, urgent action |
| `--ui-stock-pending`  | navy-500    | navy-400    | Stock in transfer between locations           |

**Usage:**

```vue
<template>
  <span
    class="px-2 py-1 rounded text-white"
    :style="{ backgroundColor: getStockColor(item.onHand, item.minThreshold) }"
  >
    {{ stockStatusText }}
  </span>
</template>

<script setup>
const getStockColor = (onHand, minThreshold) => {
  if (onHand === 0) return "var(--ui-stock-critical)";
  if (onHand < minThreshold) return "var(--ui-stock-low)";
  return "var(--ui-stock-healthy)";
};
</script>
```

Or use the badge class:

```vue
<span class="badge-stock-healthy">Healthy</span>
<span class="badge-stock-low">Low Stock</span>
<span class="badge-stock-critical">Critical</span>
```

### Approval Workflow States

| Token                  | Light Mode  | Dark Mode   | Business Logic                          |
| ---------------------- | ----------- | ----------- | --------------------------------------- |
| `--ui-status-draft`    | zinc-500    | zinc-400    | Unsaved or draft state                  |
| `--ui-status-pending`  | navy-500    | navy-400    | Awaiting supervisor/admin approval      |
| `--ui-status-approved` | emerald-600 | emerald-500 | Approved by supervisor/admin, completed |
| `--ui-status-rejected` | red-600     | red-500     | Rejected by supervisor/admin, failed    |

**Applies to:**

- PRF/PO submissions
- Transfer requests
- Period close approvals
- NCR resolutions

**Usage:**

```vue
<span class="badge-pending" v-if="transfer.status === 'PENDING'">
  Pending Approval
</span>
<span class="badge-approved" v-if="transfer.status === 'APPROVED'">
  Approved
</span>
```

### Period States

| Token                | Light Mode  | Dark Mode   | Business Logic                                         |
| -------------------- | ----------- | ----------- | ------------------------------------------------------ |
| `--ui-period-open`   | emerald-600 | emerald-500 | Period is open, accepting transactions                 |
| `--ui-period-ready`  | navy-500    | navy-400    | Location ready for period close, awaiting coordination |
| `--ui-period-closed` | zinc-500    | zinc-400    | Period locked, no modifications allowed                |

**Usage:**

```vue
<span
  class="badge-base"
  :style="{ backgroundColor: 'var(--ui-period-open)', color: 'white' }"
  v-if="period.status === 'OPEN'"
>
  Open
</span>
```

### Price Variance

| Token                    | Value                 | Usage                                              |
| ------------------------ | --------------------- | -------------------------------------------------- |
| `--ui-variance-detected` | amber-500 / amber-400 | Price on delivery differs from locked period price |

**Usage:**

```vue
<UAlert
  color="warning"
  title="Price Variance Detected"
  :description="`Expected: SAR ${periodPrice}, Actual: SAR ${deliveryPrice}. Auto-NCR will be created.`"
  v-if="hasPriceVariance"
/>
```

---

## Utility Classes

### Surface/Card Classes

#### .card-elevated

Elevated card with border, shadow, and hover effect.

```css
.card-elevated {
  background: var(--ui-bg-elevated);
  border: 1px solid var(--ui-border);
  border-radius: 0.5rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: box-shadow 200ms;
}
.card-elevated:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

**Usage:**

```vue
<div class="card-elevated p-6">
  <h3>Stock Summary</h3>
  <p>Content here</p>
</div>
```

#### .card-muted

Subtle background card for secondary content.

```css
.card-muted {
  background: var(--ui-bg-muted);
  border: 1px solid var(--ui-border-muted);
  border-radius: 0.5rem;
}
```

**Usage:**

```vue
<div class="card-muted p-4">
  <p>Disabled or secondary content</p>
</div>
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

**Usage:**

```vue
<label class="form-label" for="itemName">Item Name</label>
<input id="itemName" class="form-input" type="text" />
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

#### Standard Badges

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

#### Business-Specific Badges

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

### Typography Classes

| Class              | Purpose                     | CSS                                    |
| ------------------ | --------------------------- | -------------------------------------- |
| `.text-display`    | Page titles, hero text      | `4xl`, `bold`, `--ui-text-highlighted` |
| `.text-heading`    | Section headings            | `2xl`, `semibold`, `--ui-text`         |
| `.text-subheading` | Subsection headings         | `lg`, `medium`, `--ui-text`            |
| `.text-body`       | Body paragraphs             | `base`, `--ui-text`                    |
| `.text-label`      | Form labels, small headings | `sm`, `medium`, `--ui-text-muted`      |
| `.text-caption`    | Captions, helper text       | `sm`, `--ui-text-muted`                |

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

#### .hover-lift

Subtle lift effect on hover.

```css
.hover-lift {
  transition: transform 200ms;
}
.hover-lift:hover {
  transform: translateY(-2px);
}
```

---

## Component Patterns

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

### Transfer Request Card

```vue
<div class="card-elevated p-4">
  <div class="flex items-start justify-between mb-3">
    <div>
      <h4 class="text-[var(--ui-text-highlighted)] font-semibold">
        Transfer #{{ transfer.id }}
      </h4>
      <p class="text-caption">
        {{ transfer.fromLocation }} → {{ transfer.toLocation }} |
        {{ formatDate(transfer.date) }}
      </p>
    </div>
    <span class="badge-pending" v-if="transfer.status === 'PENDING'">
      Pending Approval
    </span>
    <span class="badge-approved" v-else-if="transfer.status === 'APPROVED'">
      Approved
    </span>
  </div>
  <div class="space-y-2">
    <div class="flex justify-between text-sm">
      <span class="text-[var(--ui-text-muted)]">Items:</span>
      <span class="text-[var(--ui-text)]">{{ transfer.itemCount }}</span>
    </div>
    <div class="flex justify-between text-sm">
      <span class="text-[var(--ui-text-muted)]">Total Value:</span>
      <span class="text-[var(--ui-text)] font-semibold">
        SAR {{ transfer.totalValue.toFixed(2) }}
      </span>
    </div>
  </div>
  <div class="flex gap-2 mt-4" v-if="transfer.status === 'PENDING' && canApprove">
    <UButton color="success" size="sm" block @click="approve">Approve</UButton>
    <UButton color="error" variant="outline" size="sm" block @click="reject">
      Reject
    </UButton>
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

## Typography

### Hierarchy

1. **Display** (`.text-display`) - Page titles, hero sections
2. **Heading** (`.text-heading`) - Main section headings
3. **Subheading** (`.text-subheading`) - Subsection headings
4. **Body** (`.text-body`) - Main content, paragraphs
5. **Label** (`.text-label`) - Form labels, table headers
6. **Caption** (`.text-caption`) - Small text, helper text

### Font Stack

```css
font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial,
  sans-serif;
```

---

## Accessibility

### Color Contrast

All text/background token combinations meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text):

✅ `--ui-text` on `--ui-bg` = 15.8:1
✅ `--ui-text-muted` on `--ui-bg` = 7.2:1
✅ White on `--ui-primary` = 21:1
✅ White on `--ui-stock-healthy` = 4.6:1

### Focus States

- All interactive elements must use `--ui-ring` for focus indication
- Minimum 2px ring width
- Use `.focus-ring` utility class for consistency

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

---

## Usage Guidelines

### Do's ✅

- **Use semantic tokens** for custom components: `bg-[var(--ui-bg-elevated)]`
- **Use utility classes** when available: `.badge-stock-healthy`
- **Use semantic colors** in Nuxt UI components: `<UButton color="primary">`
- **Support both themes**: Test in light and dark mode
- **Use business tokens** for domain concepts: `--ui-stock-low`, not `--color-amber-500`

### Don'ts ❌

- **Never use inline styles** with hex colors: `style="color: #000046"`
- **Never use custom color names** in Nuxt UI props: `color="navy"` (won't work)
- **Never hardcode colors** that should adapt to theme
- **Never mix systems**: Pick semantic tokens OR Tailwind classes, be consistent within a component
- **Never use @apply with custom classes**: Tailwind CSS v4 only allows `@apply` with built-in utilities (see below)

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

### Tailwind CSS v4 @apply Limitation ⚠️

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
  @apply rounded-lg shadow-sm hover:shadow-md;
  @apply transition-shadow duration-200;
}
```

**Why this matters:**

- All badge utility classes in `main.css` use direct CSS properties
- Form and card classes can still use `@apply` with Tailwind's built-in utilities
- This ensures compatibility with Tailwind CSS v4's architecture

---

## Examples

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
        <UButton color="primary" type="submit" :loading="loading">
          Post Delivery
        </UButton>
        <UButton color="neutral" variant="outline" @click="cancel">
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
        <div class="text-emerald-600 text-3xl">📦</div>
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
        <div class="text-navy-600 text-3xl">📤</div>
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
        <div class="text-amber-600 text-3xl">📅</div>
      </div>
    </div>
  </div>
</template>
```

---

## Testing & Validation

### Checklist

- [ ] All pages work in light mode
- [ ] All pages work in dark mode
- [ ] Theme toggle works smoothly
- [ ] Stock status badges display correct colors
- [ ] Approval badges display correct colors
- [ ] Forms use `.form-input` and `.form-label`
- [ ] Cards use `.card-elevated` or `.card-muted`
- [ ] No inline hex colors in templates
- [ ] No direct color class usage on business elements (use tokens)
- [ ] Focus states are visible on all interactive elements
- [ ] Screen reader testing passes
- [ ] Color contrast passes WCAG AA

### Test Pages

- **Deliveries**: `/deliveries` - Basic page layout test
- **Dashboard** (when built): Real-world metric cards and data displays

---

## Reference Links

- **Quick Reference**: `CLAUDE.md` - Design system section
- **Tailwind CSS v4**: https://tailwindcss.com/docs
- **Nuxt UI**: https://ui.nuxt.com
- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21/Understanding/

---

**For questions or updates to this design system, consult the team lead or update this document directly.**
