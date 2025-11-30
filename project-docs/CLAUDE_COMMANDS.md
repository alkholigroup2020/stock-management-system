# Claude Code Slash Commands

This document describes the custom slash commands available for UI development and validation.

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `/audit-ui` | Check UI consistency against UI_DESIGN_GUIDE.md |
| `/validate-tokens` | Find design token violations |
| `/generate-component` | Create component boilerplate |
| `/audit-a11y` | Run live accessibility audit |

---

## `/audit-ui` - UI Consistency Audit

Validates pages and components against the project's design system.

### What it checks

- Page padding (`p-4 md:p-6`)
- `LayoutPageHeader` usage
- No inline hex colors
- Semantic Nuxt UI color props
- Proper spacing utilities
- Dark mode variants
- Typography classes

### Usage

```bash
/audit-ui                              # Scan all pages
/audit-ui app/pages/deliveries.vue     # Audit specific file
/audit-ui app/components/              # Audit all components
```

### Output

Report with pass/fail for each check, violations with line numbers, and suggested fixes.

---

## `/validate-tokens` - Design Token Validator

Scans for design system violations in the codebase.

### What it detects

- Inline hex colors (`style="color: #xxx"`)
- Wrong Nuxt UI colors (`color="navy"` → should be `color="primary"`)
- Non-standard spacing values
- Missing dark mode variants
- Direct palette colors instead of semantic tokens
- Hardcoded pixel values

### Usage

```bash
/validate-tokens                                    # Scan entire codebase
/validate-tokens app/pages/                         # Scan specific directory
/validate-tokens app/components/DataTable.vue       # Scan specific file
```

### Output

List of violations with file:line, severity (Critical/Warning), and suggested fixes.

---

## `/generate-component` - Component Generator

Creates boilerplate code following project standards.

### Available templates

| Type | Description | Output Path |
|------|-------------|-------------|
| `page` | Full page with header, padding, offline handling | `app/pages/[name].vue` |
| `feature` | Feature component with typed props/emits | `app/components/[feature]/[Name].vue` |
| `form` | Form with Zod validation and error handling | `app/components/[feature]/[Name]Form.vue` |
| `store` | Pinia store with typed state/actions | `app/stores/[name].ts` |
| `composable` | Composable with proper typing | `app/composables/use[Name].ts` |

### Usage

```bash
/generate-component page StockAdjustment
/generate-component feature dashboard/MetricCard
/generate-component form DeliveryEntry
/generate-component store inventory
/generate-component composable useStockLevel
```

### Output

Creates a new file with boilerplate following all project standards from UI_DESIGN_GUIDE.md.

---

## `/audit-a11y` - Accessibility Audit

Performs live WCAG 2.1 AA accessibility testing using Playwright.

### Prerequisites

Dev server must be running:

```bash
pnpm dev
```

### What it checks

- Color contrast (4.5:1 for text, 3:1 for large text)
- Keyboard navigation
- Form accessibility (labels, errors)
- Interactive element names
- ARIA usage
- Focus visibility

### Usage

```bash
/audit-a11y                    # Audit main routes (/, /stock-now, /items, etc.)
/audit-a11y /deliveries        # Audit specific route
/audit-a11y /transfers/new     # Audit nested route
```

### Output

WCAG compliance report with violations, severity, specific WCAG criteria, and fixes.

---

## Best Practices

1. **Run `/audit-ui` after creating new pages** to catch design inconsistencies early
2. **Run `/validate-tokens` before committing** to ensure no design violations
3. **Use `/generate-component` for new features** to start with proper structure
4. **Run `/audit-a11y` on completed features** to verify accessibility

---

## Related Documentation

- [UI_DESIGN_GUIDE.md](./UI_DESIGN_GUIDE.md) - Complete design system reference
- [CLAUDE.md](../CLAUDE.md) - Project rules and coding standards
