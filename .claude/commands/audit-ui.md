# UI Consistency Audit

Perform a comprehensive UI consistency audit against the project's design system.

## Scope

**Target:** $ARGUMENTS (if empty, scan all pages in `app/pages/`)

## Instructions

1. **Read the design system first:**
   - Read `project-docs/UI_DESIGN_GUIDE.md` to understand all design patterns
   - This is the single source of truth for UI standards

2. **Scan the target files** and check for the following:

### Page Structure Checks

- [ ] **Page Padding:** Outer wrapper uses `p-4 md:p-6` (exception: login page uses `px-4 py-12 sm:px-6 lg:px-8`)
- [ ] **Page Header:** Pages use `<LayoutPageHeader>` component (except detail/modal pages)
- [ ] **Section Spacing:** Uses `space-y-6` between major sections
- [ ] **Card Spacing:** Uses `gap-6` for card grids

### Color System Checks

- [ ] **No Inline Hex Colors:** No `style="color: #xxx"` or `style="background: #xxx"`
- [ ] **Semantic Nuxt UI Colors:** Uses `color="primary"`, `color="secondary"`, `color="success"`, `color="error"` (NOT `color="navy"`, `color="emerald"`)
- [ ] **Semantic Tokens:** Custom styles use `var(--ui-*)` tokens, not hardcoded values

### Component Usage Checks

- [ ] **Buttons:** All `<UButton>` use semantic color props and have `cursor-pointer` class
- [ ] **Cards:** Use `.card-elevated` or `<UCard>` with proper styling
- [ ] **Badges:** Use `.badge-*` utility classes or `<UBadge>` with semantic colors
- [ ] **Forms:** Use `.form-label`, `.form-input`, `.form-error` classes

### Dark Mode Checks

- [ ] **Theme-Aware Classes:** Background/text classes have corresponding `dark:` variants where needed
- [ ] **No Light-Only Styles:** No hardcoded light-mode-only colors

### Typography Checks

- [ ] **Heading Classes:** Uses `.text-heading` or proper Tailwind text sizes
- [ ] **Label Classes:** Uses `.text-label` for form labels
- [ ] **Caption Classes:** Uses `.text-caption` for secondary text

## Output Format

Generate a report with:

```
## UI Audit Report

**Files Scanned:** [count]
**Issues Found:** [count]

### Violations

#### [filename]:[line]
- **Issue:** [description]
- **Current:** `[problematic code]`
- **Fix:** `[corrected code]`

### Summary by Category
- Page Structure: X issues
- Color System: X issues
- Component Usage: X issues
- Dark Mode: X issues
- Typography: X issues

### Passing Checks
[List of checks that passed]
```

## Critical Rules

- Reference `project-docs/UI_DESIGN_GUIDE.md` for all standards
- Provide exact line numbers for each violation
- Include both the problematic code and the suggested fix
- Do NOT modify any files - this is an audit only
