# Project Design System Reference

Quick reference for Stock Management System design patterns and conventions.

**For comprehensive details, see:** `project-docs/UI_DESIGN_SYSTEM.md`

---

## 1. Brand Colors & Usage Rules

### Primary & Secondary Colors

- **Primary:** Navy Blue (#000046) - brand, primary actions, headings, focus states
- **Secondary:** Emerald Green (#45cf7b) - success, secondary actions, positive feedback
- **Supporting:** Zinc (neutrals), Amber (warnings), Red (errors), Blue (info)

### Usage Rules

- ✅ Use Tailwind tokens (text-navy-500, bg-emerald-400) with dark: variants
- ✅ Use semantic color props for Nuxt UI (color="primary", color="secondary")
- ❌ Never use inline hex colors or custom color names in Nuxt UI props
- ❌ Never configure colors in app.config.ts (Tailwind v4 uses @theme)

---

## 2. Semantic Design Tokens

**Location:** `app/assets/css/main.css` - Single source of truth for all tokens

### Background Tokens

- `--ui-bg` - Page background
- `--ui-bg-elevated` - Cards, modals, elevated surfaces
- `--ui-bg-muted` - Subtle backgrounds, disabled fields
- `--ui-bg-accented` - Highlighted sections
- `--ui-bg-inverted` - Dark in light mode, light in dark

### Text Tokens

- `--ui-text` - Primary body text
- `--ui-text-muted` - Secondary text, descriptions, labels
- `--ui-text-dimmed` - Disabled text, placeholders
- `--ui-text-highlighted` - Important text, headings

### Border Tokens

- `--ui-border` - Default borders (cards, inputs)
- `--ui-border-muted` - Subtle dividers, table borders
- `--ui-border-accented` - Emphasized borders, focus states

### Business Domain Tokens

**Stock Status:**

- `--ui-stock-healthy` - Normal stock levels
- `--ui-stock-low` - Below minimum threshold
- `--ui-stock-critical` - Out of stock or critically low
- `--ui-stock-pending` - Stock in transfer

**Approval Workflow:**

- `--ui-status-draft` - Unsaved or draft state
- `--ui-status-pending` - Awaiting approval
- `--ui-status-approved` - Approved, completed
- `--ui-status-rejected` - Rejected, failed

**Period States:**

- `--ui-period-open` - Period open, accepting transactions
- `--ui-period-ready` - Ready for close, awaiting coordination
- `--ui-period-closed` - Period locked

**Price Variance:**

- `--ui-variance-detected` - Price differs from locked period price

**Rule:** Use business tokens for domain concepts, NOT raw color tokens

---

## 3. Layout Architecture (3-Source Padding System)

### Layout Body (app/layouts/default.vue)

| Viewport           | X-axis (horizontal) | Y-axis (vertical) |
| ------------------ | ------------------- | ----------------- |
| Mobile (<640px)    | px-0 (0)            | py-2 (8px)        |
| sm-md (640-767px)  | px-12 (48px)        | py-2 (8px)        |
| md-xl (768-1279px) | px-12 (48px)        | py-2 (8px)        |
| xl (≥1280px)       | px-16 (64px)        | py-4 (16px)       |

**Additional:** `max-w-[1920px] mx-auto w-full`

### Page Container (Required Pattern)

**Pattern:** `<div class="px-0 py-0 md:px-4 md:py-1 space-y-3">`

| Viewport         | X-axis      | Y-axis     | Section Spacing |
| ---------------- | ----------- | ---------- | --------------- |
| Mobile (<768px)  | px-0 (0)    | py-0 (0)   | space-y-3       |
| Desktop (≥768px) | px-4 (16px) | py-1 (4px) | space-y-3       |

### Page Content Width

- **Default:** Full-width (no max-width constraints)
- **Exception:** Login page uses max-w-md for centered content

**Check:** All pages must use unified container pattern (except login)

**Common Issue:** Inconsistent padding like `p-4 md:p-6`, `p-6`, or other mixed values

---

## 4. Page Header Pattern

### Structure Checklist

- [ ] Icon: `w-6 h-6 sm:w-10 sm:h-10 text-primary` (NO background/border)
- [ ] Title: `text-xl sm:text-3xl font-bold text-primary`
- [ ] Description: `hidden sm:block` (mobile hidden)
- [ ] Action button: `rounded-full px-3 sm:px-6` with responsive text
- [ ] Button text: Short on mobile, full on desktop

### Common Issues

- ❌ Icons with backgrounds (`bg-*`) or borders (`ring-*`, `border`)
- ❌ Non-responsive icon/title sizes
- ❌ Description visible on mobile (should be hidden)
- ❌ Action button without responsive padding

---

## 5. Filter Section Pattern (Dual Layout)

### Desktop Layout (lg and above)

- **Structure:** Single row with Search | Toggle buttons | Status dropdown
- **Dropdown positioning:** Far right using `ml-auto`
- **Toggle container:** `bg-muted rounded-full` with `gap-1 p-1`
- **Dropdown:** Full button with icon + label

### Mobile Layout (below lg)

- **Row 1:** Search + Status dropdown only
- **Toggle buttons:** **HIDDEN** (use `lg:hidden` to hide on mobile)
- **Dropdown:** Icon only with `px-3`
- **Rationale:** Simplifies mobile UX, search + dropdown provide sufficient filtering

### Toggle Button Styling

- **Selected:** `bg-primary text-white shadow-sm`
- **Unselected:** `text-muted hover:text-default hover:bg-elevated`

### Card Padding

- `:ui="{ body: 'p-3 sm:p-4' }"`

**Critical Check:** Mobile filter sections must NOT show toggle buttons

---

## 6. Form Layout Standards

### Responsive Grid Pattern

- **Container:** `grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6`
- **All inputs:** `class="w-full"` (MANDATORY)
- **Full-width fields:** `lg:col-span-2` (textareas, read-only displays)
- **Gap spacing:** `gap-6` (1.5rem / 24px)

### Alternative Single-Column Pattern

- **Container:** `space-y-6`
- **Fields:** `w-full lg:w-1/2`
- **Use when:** Settings sections with 2-3 fields, stacked layout preferred

### Critical Checks

- [ ] Grid container uses correct classes
- [ ] Every input has `class="w-full"`
- [ ] Textareas use `lg:col-span-2`
- [ ] Gap spacing is `gap-6`
- [ ] No arbitrary spacing values

---

## 7. Component Library

### Surface Classes

- `.card-elevated` - Elevated card with border/shadow (NO hover effects)
- `.card-muted` - Subtle background for secondary content
- `.surface-inverted` - Dark in light mode, light in dark mode

### Form Classes

- `.form-label` - Consistent label styling (0.875rem, 500 weight, muted color)
- `.form-input` - Consistent input styling (full width, padding, border)
- `.form-error` - Error message styling (0.875rem, error color)

### Badge Classes

**Standard:**

- `.badge-primary`, `.badge-success`, `.badge-warning`, `.badge-error`, `.badge-info`

**Stock Status:**

- `.badge-stock-healthy` (emerald)
- `.badge-stock-low` (amber)
- `.badge-stock-critical` (red)
- `.badge-stock-pending` (navy)

**Approval Workflow:**

- `.badge-draft` (zinc)
- `.badge-pending` (navy)
- `.badge-approved` (emerald)
- `.badge-rejected` (red)

### Interactive Classes

- `.focus-ring` - Consistent focus ring (2px, `--ui-ring`)
- `.smooth-transition` - Standard timing (200ms ease-in-out)

**Check:** Cards must have NO hover effects (static surfaces)

---

## 8. Button & Icon Rules

### Button Rules

- [ ] Always include `cursor-pointer` class
- [ ] Use `rounded-full` for pill-shaped buttons
- [ ] Semantic colors: `color="primary"`, `color="secondary"`, `color="success"`, `color="error"`
- [ ] Cancel buttons: `color="error" variant="soft"` or `variant="outline"`
- [ ] Delete buttons: `color="error"` (solid variant)
- [ ] Never use custom color names (`color="navy"` won't work)

### Icon Rules

- [ ] NO backgrounds (no `bg-*` classes)
- [ ] NO borders (no `border`, `ring-*`)
- [ ] NO rounded containers around icons
- [ ] Display directly with color classes only
- [ ] Appropriate size for context (e.g., `w-10 h-10` for cards)

---

## 9. Card Action Buttons Pattern (Responsive)

### Container

- `flex flex-wrap items-center gap-2 pt-4 border-t border-[var(--ui-border)]`

### Button Text Visibility

- **Mobile/Medium (<1024px):** Icons only
- **Large (≥1024px):** Icons + text with `<span class="hidden lg:inline">Button Text</span>`
- **Spacer:** `<div class="hidden xl:flex flex-1" />` (xl+ screens only)

### Requirements Checklist

- [ ] Uses `flex-wrap` for wrapping when space limited
- [ ] Text labels use `hidden lg:inline` for responsive visibility
- [ ] All buttons have recognizable icons
- [ ] Uses `size="sm"` for compact appearance
- [ ] Applies `@click.stop` to prevent parent click handlers

### Button Order (Typical)

1. Destructive action (Delete) - left side
2. Spacer (xl+ only)
3. Status toggles (Deactivate, etc.)
4. View/Edit actions - right side

---

## 10. Dropdown Menu Patterns

### Status Filter (All / Active / Inactive)

**Always include three options:**

- **All** - Show all items (no filter)
- **Active** - Show only active items
- **Inactive** - Show only inactive/archived items

**Standard Icons:**

- All: `i-lucide-list`
- Active: `i-lucide-circle-check`
- Inactive: `i-lucide-archive`

**Implementation:**

- Use `onSelect` handler (not `click`)
- Use `null` value for "All" option
- Set `active` property to highlight selected item
- Dropdown button icon should change based on selection

---

## 11. Tailwind CSS v4 Constraints

### @apply Limitation

**Rule:** Cannot use `@apply` with custom class names, only built-in Tailwind utilities.

❌ **Wrong:**

```css
.badge-base {
  @apply inline-flex items-center px-2.5;
}
.badge-primary {
  @apply badge-base; /* ERROR: Cannot apply unknown utility */
}
```

✅ **Correct:**

```css
.badge-primary {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.625rem;
  /* Use direct CSS properties */
}

/* OR use @apply with built-in utilities only */
.card-elevated {
  @apply bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)];
}
```

### @utility Limitation

**Rule:** Cannot use `@utility` with pseudo-elements/classes in name. Names must be alphanumeric only.

❌ **Wrong:**

```css
@utility placeholder-muted::placeholder { ... }
@utility hover-primary:hover { ... }
```

✅ **Correct:**

```css
.placeholder-muted::placeholder { ... }
.hover-primary:hover { ... }
```

---

## 12. Code Formatting Standards (Prettier)

### Critical Rules

- **Semicolons:** Always use (`;`)
- **Quotes:** Double (`"`) not single (`'`)
- **Indentation:** 2 spaces (never tabs)
- **Line Width:** 100 characters maximum
- **Arrow Functions:** Always parentheses: `(x) => x` not `x => x`
- **Trailing Commas:** ES5 style (objects/arrays only, not function parameters)
- **Vue Files:** Do not indent `<script>` and `<style>` blocks

### Component Naming (Nuxt 4 Auto-Import)

- `app/components/layout/AppNavbar.vue` → `<LayoutAppNavbar />`
- `app/components/delivery/LineItem.vue` → `<DeliveryLineItem />`
- Root: `Footer.vue` → `<Footer />` (no prefix needed)

**Run before submitting:** `pnpm format` to format all files

---

## 13. Common Issues to Flag

### Layout & Structure

- ❌ Inconsistent page container (not using `px-0 py-0 md:px-4 md:py-1 space-y-3`)
- ❌ Page content with unnecessary max-width constraints
- ❌ Icons with backgrounds or borders
- ❌ Cards with hover effects
- ❌ Mobile filter sections showing toggle buttons (should hide with `lg:hidden`)

### Forms & Inputs

- ❌ Form inputs without `class="w-full"`
- ❌ Textareas without `lg:col-span-2` for full width
- ❌ Incorrect grid container classes (not using responsive pattern)
- ❌ Missing `gap-6` spacing or using arbitrary gap values

### Buttons & Actions

- ❌ Buttons without `cursor-pointer` class
- ❌ Card action buttons without responsive text pattern
- ❌ Cancel buttons without error color styling
- ❌ Icon-only buttons without `aria-label` for accessibility

### Colors & Tokens

- ❌ Inline hex colors instead of semantic tokens
- ❌ Custom color names in Nuxt UI props (`color="navy"`)
- ❌ Not using business tokens for domain concepts
- ❌ Missing dark mode variants (`dark:`)

### Code Quality

- ❌ Using `@apply` with custom class names
- ❌ Single quotes or missing semicolons (Prettier violations)
- ❌ Inconsistent indentation (not 2 spaces)
- ❌ Using `@utility` with pseudo-elements in name

---

## 14. Quick Review Checklist

### Every Page

- [ ] Container uses `px-0 py-0 md:px-4 md:py-1 space-y-3`
- [ ] Icons have NO backgrounds or borders
- [ ] Cards use `.card-elevated` class without hover effects
- [ ] All buttons include `cursor-pointer` class
- [ ] Works in both light AND dark mode
- [ ] Follows Prettier formatting rules

### Page Header

- [ ] Icon: Responsive sizing (`w-6 h-6 sm:w-10 sm:h-10`)
- [ ] Title: Responsive sizing (`text-xl sm:text-3xl font-bold text-primary`)
- [ ] Description: Hidden on mobile (`hidden sm:block`)
- [ ] Action button: Responsive padding (`px-3 sm:px-6`)
- [ ] Button text: Responsive (short on mobile, full on desktop)

### Filter Section

- [ ] Uses dual layout pattern (desktop full, mobile simplified)
- [ ] Toggle buttons hidden on mobile (`lg:hidden`)
- [ ] Card padding: `:ui="{ body: 'p-3 sm:p-4' }"`
- [ ] Desktop dropdown at far right (`ml-auto`)
- [ ] Mobile dropdown icon-only with `px-3`

### Forms

- [ ] Grid container: `grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6`
- [ ] All inputs have `class="w-full"`
- [ ] Textareas/full-width fields use `lg:col-span-2`
- [ ] Gap spacing is `gap-6` (not arbitrary values)

### Card Action Buttons

- [ ] Container uses `flex flex-wrap items-center gap-2`
- [ ] Button text uses `hidden lg:inline` for responsive visibility
- [ ] Spacer uses `hidden xl:flex flex-1` (xl+ only)
- [ ] All buttons have recognizable icons
- [ ] Uses `size="sm"` for compact appearance
- [ ] Applies `@click.stop` to prevent parent handlers

### Dropdown Menus

- [ ] Status filters include All, Active, Inactive options
- [ ] Uses `onSelect` handler (not `click`)
- [ ] Uses `null` value for "All" option
- [ ] Standard icons (list, circle-check, archive)

### Code Quality

- [ ] No inline hex colors (use semantic tokens)
- [ ] No custom color names in Nuxt UI props
- [ ] Uses business tokens for domain concepts
- [ ] Includes dark mode variants where needed
- [ ] No `@apply` with custom class names
- [ ] Double quotes, semicolons, 2-space indentation
- [ ] Follows Nuxt 4 component naming conventions

---

## Reference Documentation

**For comprehensive details, code examples, and complete specifications:**

See `project-docs/UI_DESIGN_SYSTEM.md` (2000+ lines, complete design system)

**Key sections in full documentation:**

- Design Philosophy & Principles
- Complete color palettes (50-950 shades)
- Typography hierarchy and classes
- Detailed component patterns with code examples
- Accessibility standards (WCAG AA)
- PWA implementation considerations
- Common patterns & examples (forms, cards, tables)
